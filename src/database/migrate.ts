import pool from '../config/database';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';

async function migrate() {
  const client = await pool.connect();
  try {
    logger.info('Starting database migration...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    // Execute the entire schema as a single transaction
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');

    logger.info('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logger.error('Rollback failed:', rollbackError);
    }
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
