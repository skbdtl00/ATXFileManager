export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  password_hash: string;
  role: 'admin' | 'user' | 'moderator';
  storage_quota: number;
  storage_used: number;
  is_active: boolean;
  is_verified: boolean;
  two_factor_secret?: string;
  two_factor_enabled: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface File {
  id: string;
  user_id: string;
  parent_id?: string;
  storage_provider_id?: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  mime_type?: string;
  size: number;
  hash_md5?: string;
  hash_sha256?: string;
  is_encrypted: boolean;
  encryption_key?: string;
  is_starred: boolean;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface StorageProvider {
  id: string;
  user_id: string;
  name: string;
  type: 'local' | 's3' | 'ftp' | 'sftp';
  config: Record<string, any>;
  is_primary: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ShareLink {
  id: string;
  file_id: string;
  user_id: string;
  token: string;
  password_hash?: string;
  max_downloads?: number;
  download_count: number;
  allowed_ips?: string[];
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Job {
  id: string;
  user_id: string;
  name: string;
  type: 'backup' | 'cleanup' | 'virus_scan' | 'duplicate_detection' | 'webhook';
  schedule?: string;
  config: Record<string, any>;
  last_run?: Date;
  next_run?: Date;
  status: 'active' | 'paused' | 'completed' | 'failed';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  created_at: Date;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  permissions?: Record<string, any>;
  last_used_at?: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Webhook {
  id: string;
  user_id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  storage_limit: number;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  start_date: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}
