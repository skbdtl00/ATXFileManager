import archiver from 'archiver';
import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

export class ArchiveService {
  async createZip(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  async createTar(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: 9,
        },
      });

      output.on('close', () => {
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  async extractZip(zipPath: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: outputDir }))
        .on('close', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  async extractTar(tarPath: string, outputDir: string): Promise<void> {
    try {
      await execPromise(`tar -xzf "${tarPath}" -C "${outputDir}"`);
    } catch (error) {
      throw new Error(`Failed to extract tar: ${error}`);
    }
  }

  async extract7z(archivePath: string, outputDir: string): Promise<void> {
    try {
      await execPromise(`7z x "${archivePath}" -o"${outputDir}" -y`);
    } catch (error) {
      throw new Error(`Failed to extract 7z: ${error}`);
    }
  }

  async createArchive(
    sourceDir: string,
    outputPath: string,
    format: 'zip' | 'tar'
  ): Promise<void> {
    if (format === 'zip') {
      await this.createZip(sourceDir, outputPath);
    } else if (format === 'tar') {
      await this.createTar(sourceDir, outputPath);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  async extractArchive(
    archivePath: string,
    outputDir: string,
    format?: 'zip' | 'tar' | '7z'
  ): Promise<void> {
    // Auto-detect format from extension if not provided
    if (!format) {
      const ext = path.extname(archivePath).toLowerCase();
      if (ext === '.zip') {
        format = 'zip';
      } else if (ext === '.tar' || ext === '.gz' || ext === '.tgz') {
        format = 'tar';
      } else if (ext === '.7z') {
        format = '7z';
      } else {
        throw new Error('Unsupported archive format');
      }
    }

    if (format === 'zip') {
      await this.extractZip(archivePath, outputDir);
    } else if (format === 'tar') {
      await this.extractTar(archivePath, outputDir);
    } else if (format === '7z') {
      await this.extract7z(archivePath, outputDir);
    }
  }
}

export default new ArchiveService();
