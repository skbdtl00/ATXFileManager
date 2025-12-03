# ATX File Manager - Admin Guide

This guide covers administrative tasks and system management for ATX File Manager.

## Initial Setup

### First Login

After installation, login with default credentials:
- Email: admin@atxfilemanager.com
- Password: changeme

⚠️ **CRITICAL:** Change the admin password immediately!

1. Login with default credentials
2. Go to Settings → Security
3. Click "Change Password"
4. Enter a strong password
5. Save changes

### System Configuration

Configure the system through the `.env` file:

```bash
# Edit configuration
nano .env

# Restart service to apply changes
sudo systemctl restart atxfilemanager
```

## User Management

### Creating Users

**Via API:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "newuser",
    "password": "SecurePassword123",
    "full_name": "John Doe"
  }'
```

**Via Database:**
```sql
INSERT INTO users (email, username, password_hash, role, storage_quota)
VALUES ('user@example.com', 'username', '$2b$10$...', 'user', 10737418240);
```

### Managing User Roles

Roles in ATX File Manager:
- **admin**: Full system access
- **moderator**: User and content management
- **user**: Standard user access

**Update user role:**
```sql
UPDATE users SET role = 'moderator' WHERE email = 'user@example.com';
```

### Storage Quotas

**Set user storage quota:**
```sql
-- Set 50GB quota
UPDATE users SET storage_quota = 53687091200 WHERE email = 'user@example.com';
```

**Check user storage usage:**
```sql
SELECT email, storage_used, storage_quota,
       ROUND((storage_used::numeric / storage_quota * 100), 2) as usage_percent
FROM users
ORDER BY usage_percent DESC;
```

### User Status

**Deactivate user:**
```sql
UPDATE users SET is_active = false WHERE email = 'user@example.com';
```

**Reactivate user:**
```sql
UPDATE users SET is_active = true WHERE email = 'user@example.com';
```

## System Monitoring

### Database Queries

**Active users:**
```sql
SELECT COUNT(*) FROM users WHERE is_active = true;
```

**Total storage used:**
```sql
SELECT pg_size_pretty(SUM(storage_used)::bigint) FROM users;
```

**File statistics:**
```sql
SELECT 
  type,
  COUNT(*) as count,
  pg_size_pretty(SUM(size)::bigint) as total_size
FROM files
WHERE is_deleted = false
GROUP BY type;
```

**Recent uploads:**
```sql
SELECT u.email, f.name, f.size, f.created_at
FROM files f
JOIN users u ON f.user_id = u.id
WHERE f.type = 'file'
ORDER BY f.created_at DESC
LIMIT 20;
```

### Audit Logs

**View recent actions:**
```sql
SELECT 
  u.email,
  a.action,
  a.resource_type,
  a.ip_address,
  a.created_at
FROM audit_logs a
LEFT JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 50;
```

**Failed login attempts:**
```sql
SELECT 
  ip_address,
  COUNT(*) as attempts,
  MAX(created_at) as last_attempt
FROM audit_logs
WHERE action = 'login_failed'
AND created_at > NOW() - INTERVAL '1 day'
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

### System Health

**Check database connection:**
```bash
psql -U postgres -d atxfilemanager -c "SELECT NOW();"
```

**Check Redis:**
```bash
redis-cli ping
```

**Check application logs:**
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

**View systemd service status:**
```bash
sudo systemctl status atxfilemanager
```

## Storage Management

### Local Storage

**Check disk usage:**
```bash
du -sh uploads/
du -sh temp/
```

**Clean temporary files:**
```bash
find temp/ -type f -mtime +1 -delete
```

**Clean thumbnails (optional):**
```bash
rm -rf uploads/thumbnails/
# Thumbnails will be regenerated as needed
```

### S3 Storage

**Configure S3:**
Edit `.env`:
```env
S3_ENABLED=true
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
```

**Test S3 connection:**
```bash
aws s3 ls s3://your-bucket-name/
```

### FTP/SFTP Storage

**Configure FTP:**
```env
FTP_HOST=ftp.example.com
FTP_PORT=21
FTP_USER=username
FTP_PASSWORD=password
```

**Configure SFTP:**
```env
SFTP_HOST=sftp.example.com
SFTP_PORT=22
SFTP_USER=username
SFTP_PASSWORD=password
```

## Backup and Recovery

### Database Backup

**Manual backup:**
```bash
pg_dump -U postgres atxfilemanager > backup_$(date +%Y%m%d).sql
```

**Automated backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -U postgres atxfilemanager | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz uploads/

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

**Setup cron job:**
```bash
crontab -e
# Add line:
0 2 * * * /path/to/backup-script.sh
```

### Database Restore

```bash
# Restore from backup
gunzip < backup.sql.gz | psql -U postgres atxfilemanager

# Or from uncompressed:
psql -U postgres atxfilemanager < backup.sql
```

## Security

### SSL/TLS Configuration

**Using nginx as reverse proxy:**
```nginx
server {
    listen 443 ssl http2;
    server_name filemanager.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for uploads
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

### Rate Limiting

Configure in `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # Max requests per window
```

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow API port (if needed externally)
sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable
```

## Performance Optimization

### Database Optimization

**Analyze and vacuum:**
```sql
VACUUM ANALYZE;
```

**Update statistics:**
```sql
ANALYZE files;
ANALYZE users;
ANALYZE audit_logs;
```

**Check slow queries:**
```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```

### Redis Optimization

**Check memory usage:**
```bash
redis-cli info memory
```

**Configure max memory:**
Edit Redis config:
```
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Application Optimization

**Enable compression:**
Already enabled in code via `compression` middleware.

**Enable caching:**
Configure Redis caching in `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
sudo journalctl -u atxfilemanager -n 50
tail -f logs/error.log
```

**Common issues:**
1. Port already in use
2. Database connection failed
3. Redis connection failed
4. Missing environment variables

**Fix:**
```bash
# Check port usage
sudo lsof -i :3001

# Test database
psql -U postgres -d atxfilemanager -c "SELECT 1"

# Test Redis
redis-cli ping
```

### High CPU Usage

**Check processes:**
```bash
top
htop
```

**Identify heavy queries:**
```sql
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start;
```

**Kill problematic query:**
```sql
SELECT pg_terminate_backend(pid);
```

### High Memory Usage

**Check memory:**
```bash
free -h
```

**Restart services:**
```bash
sudo systemctl restart atxfilemanager
sudo systemctl restart postgresql
sudo systemctl restart redis
```

### Disk Space Issues

**Check disk usage:**
```bash
df -h
```

**Clean up:**
```bash
# Clean temporary files
rm -rf temp/*

# Clean old logs
find logs/ -name "*.log" -mtime +30 -delete

# Vacuum database
sudo -u postgres psql atxfilemanager -c "VACUUM FULL;"
```

## Maintenance Tasks

### Daily Tasks

- Monitor system health
- Check error logs
- Review audit logs

### Weekly Tasks

- Review user activity
- Clean temporary files
- Update dependencies (if needed)

### Monthly Tasks

- Database backup verification
- Review and optimize database
- Update documentation
- Security audit

### Quarterly Tasks

- Review storage usage trends
- Plan capacity upgrades
- Review security policies
- Update system software

## Support and Updates

### Getting Updates

```bash
cd /path/to/ATXFileManager
git pull origin main
npm install
npm run build
npm run migrate
sudo systemctl restart atxfilemanager
```

### Getting Help

- Documentation: Check docs/ folder
- GitHub Issues: Report bugs
- Email: admin@atxfilemanager.com

## Best Practices

1. **Regular Backups**: Automate daily backups
2. **Monitor Logs**: Set up log monitoring
3. **Update Regularly**: Keep system and dependencies updated
4. **Security First**: Use SSL, strong passwords, 2FA
5. **Resource Monitoring**: Track CPU, memory, disk usage
6. **Document Changes**: Keep track of configuration changes
7. **Test Backups**: Regularly test restore procedures
8. **Limit Access**: Use principle of least privilege
9. **Audit Trail**: Review audit logs regularly
10. **Capacity Planning**: Monitor growth and plan ahead

---

For additional support, contact the development team or check the community forums.
