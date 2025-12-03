# ATX File Manager - Quick Start Guide

Get up and running with ATX File Manager in minutes!

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher

## Installation Methods

### Method 1: Automated Installation (Recommended for Linux)

For Ubuntu, Debian, CentOS, Fedora, or Arch Linux:

```bash
# Download and run the installation script
chmod +x install.sh
sudo ./install.sh
```

The script will:
1. Install all dependencies (Node.js, PostgreSQL, Redis)
2. Set up the database
3. Configure the application
4. Optionally create a systemd service

### Method 2: Docker (Recommended for all platforms)

```bash
# Clone the repository
git clone https://github.com/skbdtl00/ATXFileManager.git
cd ATXFileManager

# Start all services with Docker Compose
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Method 3: Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/skbdtl00/ATXFileManager.git
cd ATXFileManager

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Create environment configuration
cp .env.example .env
# Edit .env with your settings

# 5. Set up PostgreSQL database
createdb atxfilemanager

# 6. Build the application
npm run build

# 7. Run database migrations
npm run migrate

# 8. Seed initial data (creates admin user)
npm run seed

# 9. Start the backend (in one terminal)
npm start

# 10. Start the frontend (in another terminal)
cd frontend
npm run dev
```

## First Login

After installation:

1. Open your browser and navigate to `http://localhost:3000`
2. Login with default credentials:
   - **Email**: admin@atxfilemanager.com
   - **Password**: changeme
3. **IMPORTANT**: Change the admin password immediately!
   - Go to Settings → Security → Change Password

## Basic Usage

### Upload Files

1. Click the "Upload" button
2. Select files from your computer
3. Files will be uploaded to your storage

### Create Folders

1. Click "New Folder"
2. Enter a folder name
3. Click "Create"

### Organize Files

- **Move**: Drag and drop files to folders
- **Copy**: Right-click → Copy → Navigate → Paste
- **Rename**: Right-click → Rename
- **Delete**: Select files → Press Delete key

### Search

1. Use the search bar at the top
2. Type your query
3. Results appear in real-time

### Share Files

1. Right-click on a file
2. Select "Share"
3. Configure sharing options
4. Copy the share link

## Configuration

### Storage Limits

Edit user storage quotas in the database:

```sql
-- Set 50GB quota for a user
UPDATE users 
SET storage_quota = 53687091200 
WHERE email = 'user@example.com';
```

### Cloud Storage (S3)

Enable S3 storage in `.env`:

```env
S3_ENABLED=true
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
```

### Two-Factor Authentication

Enable 2FA for enhanced security:

1. Go to Settings → Security
2. Click "Enable Two-Factor Authentication"
3. Scan QR code with your authenticator app
4. Enter the verification code
5. Save backup codes

## Common Tasks

### Creating New Users

Use the registration API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePassword123",
    "full_name": "New User"
  }'
```

### Backup Database

```bash
# Create backup
pg_dump -U postgres atxfilemanager > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres atxfilemanager < backup.sql
```

### View Logs

```bash
# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# System service logs (if using systemd)
sudo journalctl -u atxfilemanager -f
```

## Troubleshooting

### Cannot connect to database

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d atxfilemanager -c "SELECT 1"
```

### Cannot connect to Redis

```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping
```

### Port already in use

```bash
# Check what's using the port
sudo lsof -i :3001

# Change port in .env
PORT=3002
```

### Application won't start

```bash
# Check logs for errors
tail -f logs/error.log

# Ensure all dependencies are installed
npm install

# Rebuild the application
npm run build
```

## Next Steps

- Read the [User Guide](docs/USER_GUIDE.md) for detailed features
- Read the [Admin Guide](docs/ADMIN_GUIDE.md) for administration
- Check the [API Documentation](docs/API.md) for integration
- Configure automatic backups
- Set up SSL/TLS for production
- Configure email notifications

## Support

Need help?
- 📖 Documentation: Check the `docs/` folder
- 🐛 Issues: GitHub Issues
- 💬 Community: Coming soon
- 📧 Email: support@atxfilemanager.com

## Security Checklist

Before going to production:

- [ ] Change default admin password
- [ ] Configure strong JWT secrets
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable two-factor authentication
- [ ] Set up automated backups
- [ ] Review and set appropriate storage quotas
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Review audit logs regularly

---

Happy file managing! 🗂️
