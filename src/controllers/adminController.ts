import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import logger from '../utils/logger';

export class AdminController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      // Get system statistics
      const userStats = await query(
        `SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week
         FROM users`
      );

      const fileStats = await query(
        `SELECT 
          COUNT(*) as total_files,
          COUNT(*) FILTER (WHERE type = 'folder') as total_folders,
          SUM(size) as total_size,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as files_today
         FROM files
         WHERE is_deleted = false`
      );

      const storageStats = await query(
        `SELECT 
          SUM(storage_used) as used,
          SUM(storage_quota) as total
         FROM users`
      );

      const activityStats = await query(
        `SELECT 
          action,
          COUNT(*) as count
         FROM activity_logs
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY action
         ORDER BY count DESC
         LIMIT 10`
      );

      res.json({
        users: userStats.rows[0],
        files: fileStats.rows[0],
        storage: storageStats.rows[0],
        recentActivity: activityStats.rows,
      });
    } catch (error: any) {
      logger.error(`Admin dashboard error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async listUsers(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, search, role } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let queryText = `
        SELECT id, email, username, full_name, role, storage_quota, storage_used,
               is_active, is_verified, two_factor_enabled, last_login, created_at
        FROM users
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        queryText += ` AND (email ILIKE $${paramIndex} OR username ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (role) {
        queryText += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const users = await query(queryText, params);

      const countQuery = await query(
        'SELECT COUNT(*) FROM users WHERE 1=1' + 
        (search ? ` AND (email ILIKE '%${search}%' OR username ILIKE '%${search}%')` : '') +
        (role ? ` AND role = '${role}'` : '')
      );

      res.json({
        users: users.rows,
        total: parseInt(countQuery.rows[0].count),
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      logger.error(`List users error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role, storage_quota, is_active } = req.body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (role) {
        updates.push(`role = $${paramIndex}`);
        params.push(role);
        paramIndex++;
      }

      if (storage_quota !== undefined) {
        updates.push(`storage_quota = $${paramIndex}`);
        params.push(storage_quota);
        paramIndex++;
      }

      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(is_active);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid updates provided' });
      }

      params.push(id);
      const result = await query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log audit
      await query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user!.userId, 'user_updated', 'user', id, { updates: req.body }]
      );

      res.json({
        message: 'User updated successfully',
        user: result.rows[0],
      });
    } catch (error: any) {
      logger.error(`Update user error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if user exists
      const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete user (cascade will delete related data)
      await query('DELETE FROM users WHERE id = $1', [id]);

      // Log audit
      await query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
        [req.user!.userId, 'user_deleted', 'user', id]
      );

      logger.info(`User deleted: ${id} by ${req.user!.email}`);

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      logger.error(`Delete user error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 50, action, userId } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let queryText = `
        SELECT a.*, u.email, u.username
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (action) {
        queryText += ` AND a.action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }

      if (userId) {
        queryText += ` AND a.user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      queryText += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const logs = await query(queryText, params);

      const countQuery = await query(
        'SELECT COUNT(*) FROM audit_logs WHERE 1=1' +
        (action ? ` AND action = '${action}'` : '') +
        (userId ? ` AND user_id = '${userId}'` : '')
      );

      res.json({
        logs: logs.rows,
        total: parseInt(countQuery.rows[0].count),
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      logger.error(`Get audit logs error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async getSystemStats(req: AuthRequest, res: Response) {
    try {
      const stats = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
          (SELECT COUNT(*) FROM files WHERE is_deleted = false) as total_files,
          (SELECT SUM(size) FROM files WHERE is_deleted = false) as total_storage,
          (SELECT COUNT(*) FROM files WHERE type = 'folder') as total_folders,
          (SELECT COUNT(*) FROM share_links WHERE is_active = true) as active_shares,
          (SELECT COUNT(*) FROM jobs WHERE is_active = true) as active_jobs
      `);

      res.json({ stats: stats.rows[0] });
    } catch (error: any) {
      logger.error(`Get system stats error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async getStorageReport(req: AuthRequest, res: Response) {
    try {
      const report = await query(`
        SELECT 
          u.id,
          u.email,
          u.username,
          u.storage_quota,
          u.storage_used,
          ROUND((u.storage_used::numeric / NULLIF(u.storage_quota, 0) * 100), 2) as usage_percent,
          COUNT(f.id) as file_count
        FROM users u
        LEFT JOIN files f ON u.id = f.user_id AND f.is_deleted = false
        GROUP BY u.id
        ORDER BY usage_percent DESC NULLS LAST
        LIMIT 100
      `);

      res.json({ report: report.rows });
    } catch (error: any) {
      logger.error(`Get storage report error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AdminController();
