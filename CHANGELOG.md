# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-12-03

### Added

#### Core Features
- File upload, download, view, move, and copy operations
- Rename and delete file operations
- Create nested folder structures
- Smart search with full-text indexing
- Sort and filter capabilities
- Drag and drop file upload support

#### Advanced File Tools
- ZIP and TAR archive creation
- Archive extraction (ZIP, TAR, 7z)
- File hashing (MD5, SHA256)
- Multi-select file operations
- Clipboard for copy/cut/paste operations
- Recursive folder size calculator
- File tagging system
- Automatic image thumbnail generation
- Text/code editor with syntax highlighting
- PDF viewer integration

#### Security & Permissions
- Role-based access control (RBAC) with admin, moderator, and user roles
- Per-file permission system
- Expiring share links with download limits
- IP-based access restrictions
- Password-protected share links
- Comprehensive audit logging
- Activity tracking for all operations
- Two-factor authentication (TOTP)
- File encryption at rest support

#### Cloud & Storage
- AWS S3 and S3-compatible storage integration
- FTP and SFTP remote storage support
- Local file system storage
- Multi-storage provider system
- Signed URL generation for secure access

#### Automation
- Scheduled job system with cron-like syntax
- Automatic file cleanup for deleted items
- Duplicate file detection
- Job execution logging
- Webhook support for event notifications

#### Admin Features
- User management dashboard
- Storage quota management per user
- Subscription system framework
- System statistics and analytics
- Storage usage reports
- Audit log viewer
- API key management system

#### Infrastructure
- PostgreSQL database with full schema
- Redis caching and session management
- RESTful API with comprehensive endpoints
- JWT-based authentication
- Rate limiting on all endpoints
- Request validation and sanitization
- Error handling and logging
- Next.js frontend with modern UI
- Docker support with docker-compose
- Automated installation script for Linux distributions

#### Documentation
- Comprehensive README
- API documentation
- User guide
- Admin guide
- Quick start guide
- Contributing guidelines
- Installation scripts

### Technical Details

#### Backend Stack
- Node.js with TypeScript
- Express.js web framework
- PostgreSQL database
- Redis for caching
- JWT authentication
- bcrypt password hashing
- Winston logging
- Multer file uploads
- Sharp image processing
- Archiver for archives
- AWS SDK for S3
- SSH2 SFTP client
- Node Schedule for jobs

#### Frontend Stack
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components
- Framer Motion animations
- Monaco Editor for code
- Shadcn/ui components

#### Database Schema
- Users and authentication
- Files and folders with hierarchy
- Storage providers
- File permissions
- Share links
- Tags
- Audit and activity logs
- Jobs and scheduling
- Webhooks
- Subscriptions
- API keys
- Thumbnails
- File versions
- Clipboard operations

#### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Two-factor authentication (TOTP)
- Rate limiting
- CORS protection
- Helmet.js security headers
- Input validation
- SQL injection prevention
- XSS protection

### Installation Support
- Ubuntu/Debian automated installation
- CentOS/RHEL/Fedora automated installation
- Arch Linux automated installation
- Docker and Docker Compose configuration
- Manual installation guide
- Systemd service configuration

### API Endpoints

#### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/verify-2fa
- GET /api/auth/profile
- POST /api/auth/2fa/setup
- POST /api/auth/2fa/enable
- POST /api/auth/2fa/disable
- POST /api/auth/change-password

#### Files
- POST /api/files/upload
- GET /api/files
- GET /api/files/:id
- GET /api/files/:id/download
- POST /api/files/folder
- PATCH /api/files/:id/rename
- DELETE /api/files/:id
- POST /api/files/:id/move
- POST /api/files/:id/copy
- POST /api/files/:id/star
- GET /api/files/search
- GET /api/files/:id/size
- GET /api/files/:id/tags
- POST /api/files/:id/tags
- DELETE /api/files/:id/tags/:tag

#### Admin
- GET /api/admin/dashboard
- GET /api/admin/users
- PATCH /api/admin/users/:id
- DELETE /api/admin/users/:id
- GET /api/admin/audit-logs
- GET /api/admin/stats
- GET /api/admin/storage-report

### Known Limitations

- File converter and photo editor features are framework-ready but not fully implemented
- Video transcoding requires manual FFmpeg installation
- ClamAV virus scanning is optional and requires separate installation
- Mobile apps are planned for future release
- Real-time collaboration features are planned for future release

### Breaking Changes
- None (initial release)

### Deprecated
- None (initial release)

### Fixed
- None (initial release)

### Security
- All passwords are hashed using bcrypt
- JWT tokens expire after configured time
- Rate limiting prevents brute force attacks
- File uploads are validated for type and size
- SQL injection protection through parameterized queries

---

For more information, see the [README](README.md) or visit our [documentation](docs/).
