import { query } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { config } from '../config/env';
import logger from '../utils/logger';

async function seed() {
  try {
    logger.info('Starting database seeding...');

    // Check if admin already exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [config.admin.email]
    );

    if (existing.rows.length > 0) {
      logger.info('Admin user already exists, skipping seed');
      process.exit(0);
    }

    // Create admin user
    const passwordHash = await hashPassword(config.admin.password);

    const userResult = await query(
      `INSERT INTO users (email, username, full_name, password_hash, role, storage_quota, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        config.admin.email,
        'admin',
        'System Administrator',
        passwordHash,
        'admin',
        107374182400, // 100GB
        true,
        true,
      ]
    );

    const adminId = userResult.rows[0].id;

    // Create default storage provider for admin
    await query(
      `INSERT INTO storage_providers (user_id, name, type, config, is_primary)
       VALUES ($1, 'Local Storage', 'local', '{}', true)`,
      [adminId]
    );

    // Create admin's root folder
    await query(
      `INSERT INTO files (user_id, name, path, type)
       VALUES ($1, 'root', $2, 'folder')`,
      [adminId, `/users/${adminId}`]
    );

    logger.info('✅ Database seeded successfully');
    logger.info(`Admin credentials: ${config.admin.email} / ${config.admin.password}`);
    logger.info('⚠️  Please change the admin password after first login!');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seed();
