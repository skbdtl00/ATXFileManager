import pool from '../config/database';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';

async function migrate() {
  try {
    logger.info('Starting database migration...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    await pool.query(schema);

    logger.info('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

migrate();
