import AWS from 'aws-sdk';
import FTPClient from 'ftp';
import SFTPClient from 'ssh2-sftp-client';
import fs from 'fs/promises';
import { config } from '../config/env';
import { promisify } from 'util';

export class StorageService {
  private s3?: AWS.S3;

  constructor() {
    if (config.s3.enabled && config.s3.accessKeyId && config.s3.secretAccessKey) {
      this.s3 = new AWS.S3({
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
        region: config.s3.region,
        ...(config.s3.endpoint && { endpoint: config.s3.endpoint }),
      });
    }
  }

  async uploadToS3(filePath: string, key: string): Promise<string> {
    if (!this.s3 || !config.s3.bucket) {
      throw new Error('S3 is not configured');
    }

    const fileContent = await fs.readFile(filePath);

    const params = {
      Bucket: config.s3.bucket,
      Key: key,
      Body: fileContent,
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async downloadFromS3(key: string, destinationPath: string): Promise<void> {
    if (!this.s3 || !config.s3.bucket) {
      throw new Error('S3 is not configured');
    }

    const params = {
      Bucket: config.s3.bucket,
      Key: key,
    };

    const result = await this.s3.getObject(params).promise();
    await fs.writeFile(destinationPath, result.Body as Buffer);
  }

  async deleteFromS3(key: string): Promise<void> {
    if (!this.s3 || !config.s3.bucket) {
      throw new Error('S3 is not configured');
    }

    const params = {
      Bucket: config.s3.bucket,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }

  async uploadToFTP(localPath: string, remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new FTPClient();

      client.on('ready', async () => {
        try {
          const fileContent = await fs.readFile(localPath);
          const put = promisify(client.put.bind(client));
          await put(fileContent, remotePath);
          client.end();
          resolve();
        } catch (error) {
          client.end();
          reject(error);
        }
      });

      client.on('error', (err) => {
        reject(err);
      });

      client.connect({
        host: config.ftp.host,
        port: config.ftp.port,
        user: config.ftp.user,
        password: config.ftp.password,
      });
    });
  }

  async uploadToSFTP(localPath: string, remotePath: string): Promise<void> {
    const sftp = new SFTPClient();

    try {
      await sftp.connect({
        host: config.sftp.host,
        port: config.sftp.port,
        username: config.sftp.user,
        password: config.sftp.password,
      });

      await sftp.put(localPath, remotePath);
    } finally {
      await sftp.end();
    }
  }

  async downloadFromSFTP(remotePath: string, localPath: string): Promise<void> {
    const sftp = new SFTPClient();

    try {
      await sftp.connect({
        host: config.sftp.host,
        port: config.sftp.port,
        username: config.sftp.user,
        password: config.sftp.password,
      });

      await sftp.get(remotePath, localPath);
    } finally {
      await sftp.end();
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3 || !config.s3.bucket) {
      throw new Error('S3 is not configured');
    }

    const params = {
      Bucket: config.s3.bucket,
      Key: key,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrlPromise('getObject', params);
  }
}

export default new StorageService();
