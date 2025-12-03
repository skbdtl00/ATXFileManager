import schedule from 'node-schedule';
import { query } from '../config/database';
import logger from '../utils/logger';
import { Job } from '../types';

export class JobService {
  private scheduledJobs: Map<string, schedule.Job> = new Map();

  async createJob(data: {
    userId: string;
    name: string;
    type: 'backup' | 'cleanup' | 'virus_scan' | 'duplicate_detection' | 'webhook';
    schedule: string;
    config: Record<string, any>;
  }): Promise<Job> {
    const result = await query(
      `INSERT INTO jobs (user_id, name, type, schedule, config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.userId, data.name, data.type, data.schedule, JSON.stringify(data.config)]
    );

    const job = result.rows[0];

    // Schedule the job
    if (job.schedule) {
      this.scheduleJob(job);
    }

    return job;
  }

  async listJobs(userId?: string): Promise<Job[]> {
    const queryText = userId
      ? 'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM jobs ORDER BY created_at DESC';

    const params = userId ? [userId] : [];
    const result = await query(queryText, params);

    return result.rows;
  }

  async getJob(jobId: string): Promise<Job> {
    const result = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);

    if (result.rows.length === 0) {
      throw new Error('Job not found');
    }

    return result.rows[0];
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
    const allowedFields = ['name', 'schedule', 'config', 'status', 'is_active'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => {
      if (field === 'config') {
        return `${field} = $${index + 2}::jsonb`;
      }
      return `${field} = $${index + 2}`;
    }).join(', ');

    const values = [
      jobId,
      ...fields.map(field => {
        if (field === 'config') {
          return JSON.stringify(updates[field as keyof Job]);
        }
        return updates[field as keyof Job];
      }),
    ];

    const result = await query(
      `UPDATE jobs SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    const job = result.rows[0];

    // Reschedule if schedule changed
    if (updates.schedule || updates.is_active !== undefined) {
      this.unscheduleJob(jobId);
      if (job.is_active && job.schedule) {
        this.scheduleJob(job);
      }
    }

    return job;
  }

  async deleteJob(jobId: string): Promise<void> {
    this.unscheduleJob(jobId);
    await query('DELETE FROM jobs WHERE id = $1', [jobId]);
  }

  async executeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);

    // Log job start
    await query(
      `INSERT INTO job_logs (job_id, status, message)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [jobId, 'started', `Job ${job.name} started`]
    );

    try {
      // Execute based on job type
      switch (job.type) {
        case 'backup':
          await this.executeBackupJob(job);
          break;
        case 'cleanup':
          await this.executeCleanupJob(job);
          break;
        case 'virus_scan':
          await this.executeVirusScanJob(job);
          break;
        case 'duplicate_detection':
          await this.executeDuplicateDetectionJob(job);
          break;
        case 'webhook':
          await this.executeWebhookJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Update job status
      await query(
        'UPDATE jobs SET last_run = NOW(), status = $1 WHERE id = $2',
        ['completed', jobId]
      );

      // Log job completion
      await query(
        `INSERT INTO job_logs (job_id, status, message, completed_at)
         VALUES ($1, $2, $3, NOW())`,
        [jobId, 'completed', `Job ${job.name} completed successfully`]
      );

      logger.info(`Job ${job.name} (${jobId}) completed successfully`);
    } catch (error: any) {
      // Update job status
      await query(
        'UPDATE jobs SET status = $1 WHERE id = $2',
        ['failed', jobId]
      );

      // Log job failure
      await query(
        `INSERT INTO job_logs (job_id, status, message, completed_at)
         VALUES ($1, $2, $3, NOW())`,
        [jobId, 'failed', `Job ${job.name} failed: ${error.message}`]
      );

      logger.error(`Job ${job.name} (${jobId}) failed:`, error);
      throw error;
    }
  }

  private scheduleJob(job: Job): void {
    try {
      const scheduledJob = schedule.scheduleJob(job.schedule!, async () => {
        try {
          await this.executeJob(job.id);
        } catch (error) {
          logger.error(`Scheduled job ${job.id} execution failed:`, error);
        }
      });

      this.scheduledJobs.set(job.id, scheduledJob);
      logger.info(`Job ${job.name} (${job.id}) scheduled with pattern: ${job.schedule}`);
    } catch (error) {
      logger.error(`Failed to schedule job ${job.id}:`, error);
    }
  }

  private unscheduleJob(jobId: string): void {
    const scheduledJob = this.scheduledJobs.get(jobId);
    if (scheduledJob) {
      scheduledJob.cancel();
      this.scheduledJobs.delete(jobId);
      logger.info(`Job ${jobId} unscheduled`);
    }
  }

  async loadScheduledJobs(): Promise<void> {
    const result = await query(
      'SELECT * FROM jobs WHERE is_active = true AND schedule IS NOT NULL'
    );

    for (const job of result.rows) {
      this.scheduleJob(job);
    }

    logger.info(`Loaded ${result.rows.length} scheduled jobs`);
  }

  private async executeBackupJob(job: Job): Promise<void> {
    // Implement backup logic
    logger.info(`Executing backup job: ${job.name}`);
    // This would integrate with storage service to backup files
  }

  private async executeCleanupJob(job: Job): Promise<void> {
    logger.info(`Executing cleanup job: ${job.name}`);
    
    // Clean up deleted files older than retention period
    const retentionDays = parseInt(job.config.retentionDays) || 30;
    
    await query(
      `DELETE FROM files 
       WHERE is_deleted = true 
       AND deleted_at < NOW() - INTERVAL '1 days' * $1`,
      [retentionDays]
    );

    // Clean up expired share links
    await query(
      `UPDATE share_links 
       SET is_active = false 
       WHERE expires_at < NOW() AND is_active = true`
    );

    logger.info('Cleanup job completed');
  }

  private async executeVirusScanJob(job: Job): Promise<void> {
    logger.info(`Executing virus scan job: ${job.name}`);
    // This would integrate with ClamAV service
  }

  private async executeDuplicateDetectionJob(job: Job): Promise<void> {
    logger.info(`Executing duplicate detection job: ${job.name}`);
    
    // Find duplicate files by hash
    const duplicates = await query(`
      SELECT hash_md5, COUNT(*) as count, ARRAY_AGG(id) as file_ids
      FROM files
      WHERE hash_md5 IS NOT NULL AND is_deleted = false
      GROUP BY hash_md5
      HAVING COUNT(*) > 1
    `);

    logger.info(`Found ${duplicates.rows.length} sets of duplicate files`);
  }

  private async executeWebhookJob(job: Job): Promise<void> {
    logger.info(`Executing webhook job: ${job.name}`);
    // This would trigger configured webhooks
  }
}

export default new JobService();
