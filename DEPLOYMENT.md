# Deployment Guide

This guide covers deploying ATX File Manager to production environments.

## Pre-Deployment Checklist

### Requirements
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Redis 6+ installed and running
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Sufficient disk space (based on expected usage)
- [ ] Backup solution in place

### Security
- [ ] Changed default admin password
- [ ] Generated strong JWT secrets
- [ ] Configured strong database password
- [ ] Set up firewall rules
- [ ] Configured SSL/TLS
- [ ] Reviewed SECURITY.md
- [ ] Disabled debug mode
- [ ] Set NODE_ENV=production

### Configuration
- [ ] Created production .env file
- [ ] Configured SMTP for emails
- [ ] Set appropriate rate limits
- [ ] Configured storage quotas
- [ ] Set up CORS for production domain
- [ ] Configured file size limits

## Deployment Methods

### Method 1: Docker (Recommended)

#### Prerequisites
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Deployment Steps

1. **Clone the repository**
```bash
git clone https://github.com/skbdtl00/ATXFileManager.git
cd ATXFileManager
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with production values
nano .env
```

3. **Update docker-compose.yml**
```yaml
# Set production environment variables
# Configure volumes for persistence
# Set resource limits
```

4. **Start services**
```bash
docker-compose up -d
```

5. **Initialize database**
```bash
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

6. **Verify deployment**
```bash
docker-compose ps
docker-compose logs backend
curl http://localhost:3001/health
```

### Method 2: systemd Service (Linux)

#### Prerequisites
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y postgresql redis-server nginx
```

#### Deployment Steps

1. **Clone and setup**
```bash
cd /opt
sudo git clone https://github.com/skbdtl00/ATXFileManager.git
cd ATXFileManager
sudo chown -R $USER:$USER .
```

2. **Install dependencies**
```bash
npm install
cd frontend && npm install && cd ..
```

3. **Configure**
```bash
cp .env.example .env
nano .env
```

4. **Build**
```bash
npm run build
cd frontend && npm run build && cd ..
```

5. **Setup database**
```bash
sudo -u postgres createdb atxfilemanager
npm run migrate
npm run seed
```

6. **Create systemd service**
```bash
sudo nano /etc/systemd/system/atxfilemanager.service
```

```ini
[Unit]
Description=ATX File Manager
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ATXFileManager
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=atxfilemanager
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

7. **Start service**
```bash
sudo systemctl daemon-reload
sudo systemctl enable atxfilemanager
sudo systemctl start atxfilemanager
sudo systemctl status atxfilemanager
```

8. **Configure nginx**
```bash
sudo nano /etc/nginx/sites-available/atxfilemanager
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Upload settings
        client_max_body_size 500M;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

9. **Enable and restart nginx**
```bash
sudo ln -s /etc/nginx/sites-available/atxfilemanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Method 3: Cloud Platforms

#### AWS EC2

1. Launch EC2 instance (t3.medium or larger)
2. Configure security groups (ports 80, 443)
3. Follow systemd deployment steps
4. Set up RDS for PostgreSQL (recommended)
5. Set up ElastiCache for Redis (recommended)
6. Configure S3 for file storage (recommended)

#### DigitalOcean Droplet

1. Create Droplet (2GB RAM minimum)
2. Follow systemd deployment steps
3. Use DigitalOcean Managed PostgreSQL (optional)
4. Use DigitalOcean Spaces for storage (optional)

#### Heroku

```bash
# Create app
heroku create atx-file-manager

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate
heroku run npm run seed
```

## Post-Deployment Tasks

### 1. Verify Deployment

```bash
# Check health
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@atxfilemanager.com","password":"changeme"}'

# Check logs
tail -f logs/combined.log
```

### 2. Change Default Password

Login and immediately change the admin password.

### 3. Configure Monitoring

#### Setup Log Monitoring
```bash
# Install log monitoring tool
npm install -g pm2
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

#### Setup Uptime Monitoring
- UptimeRobot (free tier available)
- Pingdom
- New Relic
- Datadog

### 4. Setup Backups

#### Database Backups
```bash
# Create backup script
sudo nano /opt/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/db"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup
pg_dump -U postgres atxfilemanager | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-bucket/backups/
```

```bash
# Make executable
sudo chmod +x /opt/scripts/backup-db.sh

# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /opt/scripts/backup-db.sh
```

#### File Backups
```bash
# Backup files to S3
aws s3 sync /opt/ATXFileManager/uploads s3://your-bucket/uploads
```

### 5. SSL Certificate Renewal

#### Let's Encrypt
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (cron)
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet
```

### 6. Performance Tuning

#### PostgreSQL
```sql
-- Increase connection limit
ALTER SYSTEM SET max_connections = 100;

-- Tune for performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';

-- Restart PostgreSQL
```

#### Redis
```
# /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

#### Node.js
```bash
# Use PM2 for clustering
npm install -g pm2
pm2 start dist/index.js -i max
pm2 save
pm2 startup
```

## Maintenance

### Daily Tasks
- Monitor error logs
- Check disk space
- Review performance metrics

### Weekly Tasks
- Review audit logs
- Update dependencies (if needed)
- Check backup integrity

### Monthly Tasks
- Review security logs
- Update documentation
- Performance optimization
- Database maintenance (VACUUM)

## Troubleshooting

### Application Won't Start

1. Check logs: `sudo journalctl -u atxfilemanager -n 50`
2. Verify database connection
3. Verify Redis connection
4. Check environment variables
5. Check file permissions

### High Memory Usage

1. Check Node.js memory limit
2. Review database connections
3. Check Redis memory usage
4. Analyze memory leaks

### Slow Performance

1. Check database indexes
2. Review slow queries
3. Optimize Redis cache
4. Check disk I/O
5. Review network latency

### Database Issues

1. Check connection pool settings
2. Analyze slow queries
3. Run VACUUM and ANALYZE
4. Check disk space
5. Review database logs

## Rollback Procedure

If deployment fails:

1. **Stop new version**
```bash
sudo systemctl stop atxfilemanager
# or
docker-compose down
```

2. **Restore previous version**
```bash
git checkout <previous-commit>
npm install
npm run build
```

3. **Restore database** (if migrations were run)
```bash
psql -U postgres atxfilemanager < backup.sql
```

4. **Start previous version**
```bash
sudo systemctl start atxfilemanager
# or
docker-compose up -d
```

## Scaling

### Horizontal Scaling

1. Load balancer (nginx, HAProxy)
2. Multiple application instances
3. Shared Redis for sessions
4. Shared PostgreSQL or read replicas
5. Shared file storage (S3, NFS)

### Vertical Scaling

1. Increase server resources
2. Optimize database
3. Add Redis memory
4. Increase connection pools

## Support

For deployment assistance:
- Documentation: docs/ folder
- GitHub Issues: Technical problems
- Email: support@atxfilemanager.com

---

Last Updated: 2024-12-03
