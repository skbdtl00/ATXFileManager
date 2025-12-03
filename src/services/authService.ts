import { query } from '../config/database';
import { User } from '../types';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    username: string;
    full_name?: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [data.email, data.username]
    );

    if (existing.rows.length > 0) {
      throw new Error('User already exists');
    }

    const passwordHash = await hashPassword(data.password);

    const result = await query(
      `INSERT INTO users (email, username, full_name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, full_name, role, storage_quota, storage_used, is_active, created_at`,
      [data.email, data.username, data.full_name || null, passwordHash]
    );

    const user = result.rows[0];

    // Create default storage provider (local)
    await query(
      `INSERT INTO storage_providers (user_id, name, type, config, is_primary)
       VALUES ($1, 'Local Storage', 'local', '{}', true)`,
      [user.id]
    );

    // Create user's root folder
    await query(
      `INSERT INTO files (user_id, name, path, type)
       VALUES ($1, 'root', $2, 'folder')`,
      [user.id, `/users/${user.id}`]
    );

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    requiresTwoFactor: boolean;
  }> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    if (user.two_factor_enabled) {
      return {
        user,
        accessToken: '',
        refreshToken: '',
        requiresTwoFactor: true,
      };
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, accessToken, refreshToken, requiresTwoFactor: false };
  }

  async verifyTwoFactor(userId: string, token: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Invalid two-factor code');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, refreshToken };
  }

  async setupTwoFactor(userId: string): Promise<{
    secret: string;
    qrCode: string;
  }> {
    const secret = speakeasy.generateSecret({
      name: `ATX File Manager (${userId})`,
    });

    await query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async enableTwoFactor(userId: string, token: string): Promise<void> {
    const result = await query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const secret = result.rows[0].two_factor_secret;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Invalid two-factor code');
    }

    await query(
      'UPDATE users SET two_factor_enabled = true WHERE id = $1',
      [userId]
    );
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await query(
      'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(oldPassword, result.rows[0].password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid old password');
    }

    const newPasswordHash = await hashPassword(newPassword);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );
  }
}

export default new AuthService();
