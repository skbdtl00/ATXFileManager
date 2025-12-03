# Security Policy

## Security Features

ATX File Manager implements multiple layers of security to protect your files and data:

### Authentication & Authorization

- **JWT Authentication**: Stateless authentication using JSON Web Tokens
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA using authenticator apps
- **Password Security**: bcrypt hashing with salt rounds (default: 10)
- **Role-Based Access Control (RBAC)**: Three roles (admin, moderator, user)
- **Session Management**: Redis-backed session management
- **Token Expiration**: Configurable JWT expiration (default: 7 days)
- **Refresh Tokens**: Separate refresh tokens with longer expiration

### API Security

- **Rate Limiting**: Configurable rate limits on all endpoints
  - Authentication: 5 requests / 15 minutes
  - Uploads: 50 requests / hour
  - General API: 100 requests / 15 minutes
- **CORS Protection**: Configurable allowed origins
- **Helmet.js**: Security headers to prevent common attacks
- **Input Validation**: express-validator for all user inputs
- **SQL Injection Prevention**: Parameterized queries throughout
- **XSS Protection**: Input sanitization and CSP headers
- **Command Injection Prevention**: Path sanitization in shell commands

### Data Security

- **Encryption at Rest**: Framework for file encryption
- **Password Hashing**: bcrypt with automatic salt generation
- **File Hashing**: MD5 and SHA256 checksums for integrity
- **Secure File Upload**: Type and size validation
- **Path Traversal Prevention**: Input sanitization

### Audit & Compliance

- **Audit Logs**: Comprehensive logging of all security events
- **Activity Logs**: Detailed user activity tracking
- **IP Tracking**: IP address logging for all requests
- **User Agent Tracking**: Browser/client identification

### File Security

- **Storage Quota**: Per-user storage limits
- **File Permissions**: Granular access control
- **Share Links**: Password-protected, expiring share links
- **IP Restrictions**: Limit access by IP address
- **Download Limits**: Configurable download count limits

## Security Best Practices

### For Administrators

1. **Change Default Credentials**: Immediately change admin password after installation
2. **Use Strong Passwords**: Enforce password complexity (min 8 characters)
3. **Enable 2FA**: Require two-factor authentication for admin accounts
4. **Regular Updates**: Keep dependencies and system updated
5. **Monitor Logs**: Regularly review audit and error logs
6. **Backup Strategy**: Implement automated, encrypted backups
7. **SSL/TLS**: Always use HTTPS in production
8. **Firewall Rules**: Configure firewall to limit access
9. **Database Security**: Use strong database passwords, limit access
10. **Environment Variables**: Never commit secrets to version control

### For Developers

1. **Code Review**: All code changes should be reviewed
2. **Dependency Scanning**: Regularly scan for vulnerable dependencies
3. **Static Analysis**: Use ESLint and TypeScript strict mode
4. **Input Validation**: Always validate and sanitize user input
5. **Parameterized Queries**: Never concatenate user input in SQL
6. **Error Handling**: Don't expose internal errors to users
7. **Secrets Management**: Use environment variables for sensitive data
8. **Logging**: Log security events, but never log passwords or tokens

### For Users

1. **Strong Passwords**: Use unique, complex passwords
2. **Enable 2FA**: Add an extra layer of security
3. **Secure Sharing**: Use password-protected share links
4. **Regular Review**: Check shared files and permissions regularly
5. **Logout**: Always logout from shared computers
6. **Report Issues**: Report suspicious activity immediately

## Known Security Considerations

### CSRF Protection

The application uses JWT authentication (stateless), which is not susceptible to traditional CSRF attacks. However, if you implement cookie-based authentication:
- Implement CSRF tokens
- Use SameSite cookie attribute
- Validate Origin/Referer headers

### Current Limitations

- **ClamAV Integration**: Virus scanning requires manual ClamAV setup
- **Rate Limiting**: In-memory rate limiting doesn't work across multiple instances
  - Use Redis-based rate limiting for distributed deployments
- **File Encryption**: Encryption at rest is framework-ready but not enforced by default

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security details to: security@atxfilemanager.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will:
- Acknowledge receipt within 48 hours
- Provide a detailed response within 7 days
- Work on a fix and keep you informed
- Credit you in the security advisory (if desired)

## Security Checklist for Production

Before deploying to production:

### Infrastructure
- [ ] SSL/TLS certificates configured
- [ ] Reverse proxy (nginx/Apache) configured
- [ ] Firewall rules in place
- [ ] Database access restricted
- [ ] Redis access restricted
- [ ] File system permissions set correctly
- [ ] Backup system configured and tested

### Application
- [ ] Default admin password changed
- [ ] Strong JWT secrets configured
- [ ] Session secrets configured
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain
- [ ] Error messages don't expose internals
- [ ] Logging configured (not debugging in production)
- [ ] File upload limits set appropriately
- [ ] Storage quotas configured

### Database
- [ ] Strong database password
- [ ] Database access limited to application
- [ ] Regular backup schedule
- [ ] Connection pooling configured
- [ ] Query timeouts set

### Monitoring
- [ ] Log monitoring setup
- [ ] Alerting for suspicious activity
- [ ] Performance monitoring
- [ ] Disk space monitoring
- [ ] Database monitoring

### Compliance
- [ ] Privacy policy in place
- [ ] Terms of service defined
- [ ] Data retention policy
- [ ] GDPR compliance (if applicable)
- [ ] Audit log retention policy

## Security Updates

Subscribe to security updates:
- GitHub Security Advisories
- npm audit notifications
- PostgreSQL security announcements
- Redis security announcements

## Dependencies Security

Regularly update and audit dependencies:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

## Secure Configuration Examples

### Environment Variables

```env
# Strong secrets (use random generators)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Secure database
POSTGRES_PASSWORD=<strong-random-password>

# Production settings
NODE_ENV=production
RATE_LIMIT_ENABLED=true
```

### nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Contact

For security concerns:
- Email: security@atxfilemanager.com
- GitHub Security: Use GitHub Security Advisory feature

---

Last Updated: 2024-12-03
