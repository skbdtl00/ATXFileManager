# ATX File Manager

![Logo](20250811_142916.png)

A comprehensive, enterprise-grade file management system built with Node.js, Express, PostgreSQL, Redis, and Next.js. Features cloud storage integration, automation, security controls, and advanced file operations.

## 🌟 Features

### Core File Management
- ✅ Upload / Download / View / Move / Copy files
- ✅ Rename and delete operations
- ✅ Create folders with nested hierarchy
- ✅ Smart search with indexing
- ✅ Sort and filter capabilities
- ✅ Drag and drop support

### Advanced File Tools
- 📦 Archive creation (ZIP/TAR)
- 📂 Extract archives (ZIP/TAR/7z)
- 🔐 File hashing (MD5/SHA256)
- ✨ Multi-select actions
- 📋 Clipboard for operations
- 📊 Recursive folder size calculator
- 🏷️ File tagging system
- 🖼️ Image thumbnail generation
- 📝 Text/code editor with syntax highlighting
- 📄 PDF viewer
- 🔄 In-app file converter (20+ formats)
- ✂️ Basic photo editor (crop, resize, etc.)

### Security & Permissions
- 👥 Role-based access control (RBAC)
- 🔒 Per-file permissions
- ⏰ Expiring share links
- 🌐 IP restrictions
- 🔑 Password-protected folders
- 📋 Comprehensive audit logs
- 📊 Activity tracking
- 🔐 Two-factor authentication
- 🔒 Encryption at rest

### Cloud & Storage
- ☁️ S3/S3-compatible storage
- 📡 FTP/SFTP support
- 💾 Local storage
- 🔗 Multi-storage mount system
- 🔄 Automatic backup (FTP/SFTP/S3)
- 🔗 Signed URLs

### Automation
- ⏰ Auto-backup scheduling
- 🗑️ Cleanup expired files
- ⏱️ Cron-like scheduler
- 🔍 Duplicate file detection
- 🦠 Auto virus scan (ClamAV)
- 🔔 Webhook triggers

### Admin Panel
- 👥 User management
- 💾 Storage quota per user
- 💳 Subscription system
- 📊 Admin dashboard with graphs
- 🔍 File indexing engine
- 📈 Server resource monitoring
- 🏢 Multi-tenant support
- 🔑 API key management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+
- Redis 6+
- (Optional) ClamAV for virus scanning
- (Optional) 7-Zip for 7z archive support

### Installation (Automated)

For supported Linux distributions (Ubuntu, Debian, CentOS, Fedora, Arch):

```bash
apt update && apt upgrade -y
apt install git curl -y
git clone https://github.com/skbdtl00/ATXFileManager.git
cd ATXFileManager
chmod +x install.sh
sudo ./install.sh
```

### Manual Installation

1. **Clone the repository**
```bash
git clone https://github.com/skbdtl00/ATXFileManager.git
cd ATXFileManager
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Set up the database**
```bash
# Create PostgreSQL database
createdb atxfilemanager

# Run migrations
npm run build
npm run migrate

# Seed initial data (creates admin user)
npm run seed
```

6. **Start the services**

Development mode:
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run frontend:dev
```

Production mode:
```bash
# Build
npm run build
npm run frontend:build

# Start
npm start
# Serve frontend (use nginx or similar)
```

## 📖 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key configurations:

- **Database**: PostgreSQL connection details
- **Redis**: Redis connection for caching and sessions
- **JWT**: Secret keys for authentication
- **Storage**: Local storage paths and limits
- **S3**: AWS S3 or compatible storage
- **FTP/SFTP**: Remote storage configuration
- **Email**: SMTP configuration for notifications
- **ClamAV**: Virus scanning configuration

### Default Credentials

After running `npm run seed`, you can login with:
- Email: admin@atxfilemanager.com
- Password: changeme

⚠️ **Important**: Change the admin password immediately after first login!

## 🏗️ Architecture

```
ATXFileManager/
├── src/                    # Backend source code
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── database/          # Database schemas and migrations
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── index.ts           # Application entry point
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   └── public/           # Static assets
├── uploads/              # File storage (local)
├── temp/                 # Temporary files
└── logs/                 # Application logs
```

## 🔌 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-2fa` - Verify two-factor code
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/enable` - Enable 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA
- `POST /api/auth/change-password` - Change password

### Files

- `POST /api/files/upload` - Upload file
- `GET /api/files` - List files
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `POST /api/files/folder` - Create folder
- `PATCH /api/files/:id/rename` - Rename file
- `DELETE /api/files/:id` - Delete file
- `POST /api/files/:id/move` - Move file
- `POST /api/files/:id/copy` - Copy file
- `POST /api/files/:id/star` - Star/unstar file
- `GET /api/files/search` - Search files
- `GET /api/files/:id/size` - Get folder size
- `GET /api/files/:id/tags` - Get file tags
- `POST /api/files/:id/tags` - Add tag
- `DELETE /api/files/:id/tags/:tag` - Remove tag

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- File encryption at rest (optional)
- Two-factor authentication support

## 🧪 Testing

```bash
npm test
```

## 📊 Monitoring

Application logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## 🐳 Docker Support

Docker support coming soon!

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@atxfilemanager.com or open an issue on GitHub.

## 🎯 Roadmap

- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Machine learning for duplicate detection
- [ ] Video transcoding support
- [ ] More cloud storage providers

## 📚 Additional Documentation

- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Admin Guide](docs/ADMIN_GUIDE.md)
- [Development Guide](docs/DEVELOPMENT.md)

---

Built with ❤️ by the ATX File Manager Team
