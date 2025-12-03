import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { File } from '../types';
import { hashFile } from '../utils/crypto';
import { config } from '../config/env';
import sharp from 'sharp';

export class FileService {
  async createFile(data: {
    userId: string;
    parentId?: string;
    name: string;
    type: 'file' | 'folder';
    filePath?: string;
    mimeType?: string;
    size?: number;
  }): Promise<File> {
    const fileId = uuidv4();
    const parentPath = data.parentId 
      ? (await this.getFile(data.parentId)).path 
      : `/users/${data.userId}`;
    
    const fullPath = `${parentPath}/${data.name}`;

    const result = await query(
      `INSERT INTO files (id, user_id, parent_id, name, path, type, mime_type, size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [fileId, data.userId, data.parentId || null, data.name, fullPath, data.type, data.mimeType || null, data.size || 0]
    );

    // Update storage used
    if (data.size) {
      await query(
        'UPDATE users SET storage_used = storage_used + $1 WHERE id = $2',
        [data.size, data.userId]
      );
    }

    return result.rows[0];
  }

  async getFile(fileId: string): Promise<File> {
    const result = await query(
      'SELECT * FROM files WHERE id = $1 AND is_deleted = false',
      [fileId]
    );

    if (result.rows.length === 0) {
      throw new Error('File not found');
    }

    return result.rows[0];
  }

  async getUserFiles(userId: string, parentId?: string): Promise<File[]> {
    const result = await query(
      `SELECT * FROM files 
       WHERE user_id = $1 AND parent_id ${parentId ? '= $2' : 'IS NULL'} AND is_deleted = false
       ORDER BY type DESC, name ASC`,
      parentId ? [userId, parentId] : [userId]
    );

    return result.rows;
  }

  async updateFile(fileId: string, updates: Partial<File>): Promise<File> {
    const allowedFields = ['name', 'is_starred'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [fileId, ...fields.map(field => updates[field as keyof File])];

    const result = await query(
      `UPDATE files SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteFile(fileId: string, permanent: boolean = false): Promise<void> {
    if (permanent) {
      const file = await this.getFile(fileId);
      
      // Delete physical file if it exists
      const physicalPath = path.join(config.storage.path, file.path);
      try {
        await fs.unlink(physicalPath);
      } catch (error) {
        // File might not exist physically
      }

      // Update storage used
      await query(
        'UPDATE users SET storage_used = storage_used - $1 WHERE id = $2',
        [file.size, file.user_id]
      );

      await query('DELETE FROM files WHERE id = $1', [fileId]);
    } else {
      await query(
        'UPDATE files SET is_deleted = true, deleted_at = NOW() WHERE id = $1',
        [fileId]
      );
    }
  }

  async moveFile(fileId: string, newParentId: string): Promise<File> {
    const file = await this.getFile(fileId);
    const newParent = await this.getFile(newParentId);

    if (newParent.type !== 'folder') {
      throw new Error('Target must be a folder');
    }

    const newPath = `${newParent.path}/${file.name}`;

    const result = await query(
      'UPDATE files SET parent_id = $1, path = $2 WHERE id = $3 RETURNING *',
      [newParentId, newPath, fileId]
    );

    return result.rows[0];
  }

  async copyFile(fileId: string, targetParentId: string, userId: string): Promise<File> {
    const sourceFile = await this.getFile(fileId);
    const targetParent = await this.getFile(targetParentId);

    if (targetParent.type !== 'folder') {
      throw new Error('Target must be a folder');
    }

    const newFileId = uuidv4();
    const newPath = `${targetParent.path}/${sourceFile.name}`;

    const result = await query(
      `INSERT INTO files (id, user_id, parent_id, name, path, type, mime_type, size, hash_md5, hash_sha256)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        newFileId,
        userId,
        targetParentId,
        sourceFile.name,
        newPath,
        sourceFile.type,
        sourceFile.mime_type,
        sourceFile.size,
        sourceFile.hash_md5,
        sourceFile.hash_sha256,
      ]
    );

    // Copy physical file
    if (sourceFile.type === 'file') {
      const sourcePath = path.join(config.storage.path, sourceFile.path);
      const targetPath = path.join(config.storage.path, newPath);
      await fs.copyFile(sourcePath, targetPath);

      // Update storage used
      await query(
        'UPDATE users SET storage_used = storage_used + $1 WHERE id = $2',
        [sourceFile.size, userId]
      );
    }

    return result.rows[0];
  }

  async searchFiles(userId: string, searchTerm: string): Promise<File[]> {
    const result = await query(
      `SELECT * FROM files 
       WHERE user_id = $1 
       AND is_deleted = false 
       AND (name ILIKE $2 OR path ILIKE $2)
       ORDER BY type DESC, name ASC`,
      [userId, `%${searchTerm}%`]
    );

    return result.rows;
  }

  async calculateFolderSize(folderId: string): Promise<number> {
    const result = await query(
      `WITH RECURSIVE folder_tree AS (
         SELECT id FROM files WHERE id = $1
         UNION ALL
         SELECT f.id FROM files f
         INNER JOIN folder_tree ft ON f.parent_id = ft.id
       )
       SELECT COALESCE(SUM(size), 0) as total_size 
       FROM files 
       WHERE id IN (SELECT id FROM folder_tree) AND type = 'file'`,
      [folderId]
    );

    return parseInt(result.rows[0].total_size, 10);
  }

  async generateThumbnail(fileId: string, filePath: string): Promise<void> {
    const sizes = {
      small: 150,
      medium: 300,
      large: 600,
    };

    for (const [size, dimension] of Object.entries(sizes)) {
      const thumbnailPath = path.join(
        config.storage.path,
        'thumbnails',
        size,
        `${fileId}.jpg`
      );

      await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });

      await sharp(filePath)
        .resize(dimension, dimension, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      await query(
        'INSERT INTO thumbnails (file_id, size, path) VALUES ($1, $2, $3)',
        [fileId, size, thumbnailPath]
      );
    }
  }

  async addTag(fileId: string, tagName: string): Promise<void> {
    await query(
      'INSERT INTO file_tags (file_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [fileId, tagName.toLowerCase()]
    );
  }

  async getTags(fileId: string): Promise<string[]> {
    const result = await query(
      'SELECT tag_name FROM file_tags WHERE file_id = $1',
      [fileId]
    );

    return result.rows.map(row => row.tag_name);
  }

  async removeTag(fileId: string, tagName: string): Promise<void> {
    await query(
      'DELETE FROM file_tags WHERE file_id = $1 AND tag_name = $2',
      [fileId, tagName.toLowerCase()]
    );
  }
}

export default new FileService();
