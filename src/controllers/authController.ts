import { Request, Response } from 'express';
import authService from '../services/authService';
import { query } from '../config/database';
import logger from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username, full_name } = req.body;

      const result = await authService.register({
        email,
        password,
        username,
        full_name,
      });

      // Log audit
      await query(
        'INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [result.user.id, 'user_registered', 'user', req.ip, req.get('user-agent')]
      );

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      logger.error(`Registration error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      // Log audit
      await query(
        'INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [result.user.id, 'user_login', 'user', req.ip, req.get('user-agent')]
      );

      logger.info(`User logged in: ${email}`);

      if (result.requiresTwoFactor) {
        res.json({
          message: 'Two-factor authentication required',
          requiresTwoFactor: true,
          userId: result.user.id,
        });
        return;
      }

      res.json({
        message: 'Login successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      logger.error(`Login error: ${error.message}`);
      res.status(401).json({ error: error.message });
    }
  }

  async verifyTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      const { userId, token } = req.body;

      const result = await authService.verifyTwoFactor(userId, token);

      res.json({
        message: 'Two-factor verification successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      logger.error(`2FA verification error: ${error.message}`);
      res.status(401).json({ error: error.message });
    }
  }

  async setupTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
      }

      const result = await authService.setupTwoFactor(req.user!.userId);

      res.json({
        message: 'Two-factor setup initiated',
        secret: result.secret,
        qrCode: result.qrCode,
      });
    } catch (error: any) {
      logger.error(`2FA setup error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async enableTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
      }

      const { token } = req.body;

      await authService.enableTwoFactor(req.user!.userId, token);

      res.json({ message: 'Two-factor authentication enabled' });
    } catch (error: any) {
      logger.error(`2FA enable error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async disableTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
      }

      await authService.disableTwoFactor(req.user!.userId);

      res.json({ message: 'Two-factor authentication disabled' });
    } catch (error: any) {
      logger.error(`2FA disable error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
      }

      const { oldPassword, newPassword } = req.body;

      await authService.changePassword(req.user!.userId, oldPassword, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      logger.error(`Password change error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
      }

      const result = await query(
        `SELECT id, email, username, full_name, role, storage_quota, storage_used, 
         two_factor_enabled, is_verified, created_at 
         FROM users WHERE id = $1`,
        [req.user!.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: result.rows[0] });
    } catch (error: any) {
      logger.error(`Get profile error: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
