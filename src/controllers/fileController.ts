import { Request, Response } from 'express';
import fileService from '../services/fileService';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/env';
import { query } from '../config/database';

export class FileController {
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
        return;
      }

      const { parentId } = req.body;

      // Check storage quota
      const userResult = await query(
        'SELECT storage_used, storage_quota FROM users WHERE id = $1',
        [req.user!.userId]
      );

      const user = userResult.rows[0];
      if (user.storage_used + req.file.size > user.storage_quota) {
        // Delete uploaded file
        await fs.unlink(req.file.path);
        res.status(400).json({ error: 'Storage quota exceeded' });
        return;
      }

      const file = await fileService.createFile({
        userId: req.user!.userId,
        parentId: parentId || undefined,
        name: req.file.originalname,
        type: 'file',
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      // Generate thumbnail for images
      if (req.file.mimetype.startsWith('image/')) {
        try {
          await fileService.generateThumbnail(file.id, req.file.path);
        } catch (error) {
          logger.error(`Thumbnail generation failed: ${error}`);
        }
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)',
        [req.user!.userId, file.id, 'upload', { filename: file.name, size: file.size }]
      );

      logger.info(`File uploaded: ${file.name} by ${req.user!.email}`);

      res.status(201).json({
        message: 'File uploaded successfully',
        file,
      });
    } catch (error: any) {
      logger.error(`Upload error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async getFiles(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { parentId } = req.query;

      const files = await fileService.getUserFiles(
        req.user!.userId,
        parentId as string | undefined
      );

      res.json({ files });
    } catch (error: any) {
      logger.error(`Get files error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async getFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({ file });
    } catch (error: any) {
      logger.error(`Get file error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (file.type === 'folder') {
        res.status(400).json({ error: 'Cannot download a folder directly' });
        return;
      }

      const filePath = path.join(config.storage.path, file.path);

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, file_id, action) VALUES ($1, $2, $3)',
        [req.user!.userId, file.id, 'download']
      );

      res.download(filePath, file.name);
    } catch (error: any) {
      logger.error(`Download error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async createFolder(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { name, parentId } = req.body;

      const folder = await fileService.createFile({
        userId: req.user!.userId,
        parentId: parentId || undefined,
        name,
        type: 'folder',
      });

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)',
        [req.user!.userId, folder.id, 'create_folder', { name }]
      );

      res.status(201).json({
        message: 'Folder created successfully',
        folder,
      });
    } catch (error: any) {
      logger.error(`Create folder error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async renameFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;
      const { name } = req.body;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const updatedFile = await fileService.updateFile(id, { name });

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)',
        [req.user!.userId, file.id, 'rename', { oldName: file.name, newName: name }]
      );

      res.json({
        message: 'File renamed successfully',
        file: updatedFile,
      });
    } catch (error: any) {
      logger.error(`Rename error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;
      const { permanent } = req.query;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await fileService.deleteFile(id, permanent === 'true');

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)',
        [req.user!.userId, file.id, permanent === 'true' ? 'delete_permanent' : 'delete', { name: file.name }]
      );

      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      logger.error(`Delete error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async moveFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;
      const { targetParentId } = req.body;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const movedFile = await fileService.moveFile(id, targetParentId);

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)',
        [req.user!.userId, file.id, 'move', { name: file.name }]
      );

      res.json({
        message: 'File moved successfully',
        file: movedFile,
      });
    } catch (error: any) {
      logger.error(`Move error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async copyFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;
      const { targetParentId } = req.body;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const copiedFile = await fileService.copyFile(id, targetParentId, req.user!.userId);

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, file_id, action, details) VALUES ($1, $2, $3, $4)',
        [req.user!.userId, file.id, 'copy', { name: file.name }]
      );

      res.json({
        message: 'File copied successfully',
        file: copiedFile,
      });
    } catch (error: any) {
      logger.error(`Copy error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async searchFiles(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { q } = req.query;

      if (!q) {
        res.status(400).json({ error: 'Search query required' });
        return;
      }

      const files = await fileService.searchFiles(req.user!.userId, q as string);

      res.json({ files });
    } catch (error: any) {
      logger.error(`Search error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async starFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const updatedFile = await fileService.updateFile(id, { is_starred: !file.is_starred });

      res.json({
        message: `File ${updatedFile.is_starred ? 'starred' : 'unstarred'} successfully`,
        file: updatedFile,
      });
    } catch (error: any) {
      logger.error(`Star error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async getFolderSize(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (file.type !== 'folder') {
        res.status(400).json({ error: 'Not a folder' });
        return;
      }

      const size = await fileService.calculateFolderSize(id);

      res.json({ size });
    } catch (error: any) {
      logger.error(`Get folder size error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async addTag(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;
      const { tag } = req.body;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await fileService.addTag(id, tag);

      res.json({ message: 'Tag added successfully' });
    } catch (error: any) {
      logger.error(`Add tag error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async getTags(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id } = req.params;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const tags = await fileService.getTags(id);

      res.json({ tags });
    } catch (error: any) {
      logger.error(`Get tags error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }

  async removeTag(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
        return;
      }

      const { id, tag } = req.params;

      const file = await fileService.getFile(id);

      if (file.user_id !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await fileService.removeTag(id, tag);

      res.json({ message: 'Tag removed successfully' });
    } catch (error: any) {
      logger.error(`Remove tag error: ${error.message}`);
      res.status(400).json({ error: error.message });
        return;
    }
  }
}

export default new FileController();
