#!/bin/bash

# ATX File Manager Installation Script
# Supports: Ubuntu, Debian, CentOS, Fedora, Arch Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

log_info "Starting ATX File Manager installation..."

# Detect Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    log_error "Cannot detect Linux distribution"
    exit 1
fi

log_info "Detected OS: $OS $VER"

# Install Node.js
install_nodejs() {
    log_info "Installing Node.js 18..."
    
    case $OS in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            yum install -y nodejs
            ;;
        arch)
            pacman -S --noconfirm nodejs npm
            ;;
        *)
            log_error "Unsupported distribution for automatic Node.js installation"
            log_info "Please install Node.js 18+ manually"
            exit 1
            ;;
    esac
    
    log_info "Node.js installed: $(node --version)"
}

# Install PostgreSQL
install_postgresql() {
    log_info "Installing PostgreSQL..."
    
    case $OS in
        ubuntu|debian)
            apt-get install -y postgresql postgresql-contrib
            systemctl start postgresql
            systemctl enable postgresql
            ;;
        centos|rhel)
            yum install -y postgresql-server postgresql-contrib
            postgresql-setup --initdb
            systemctl start postgresql
            systemctl enable postgresql
            ;;
        fedora)
            dnf install -y postgresql-server postgresql-contrib
            postgresql-setup --initdb
            systemctl start postgresql
            systemctl enable postgresql
            ;;
        arch)
            pacman -S --noconfirm postgresql
            sudo -u postgres initdb -D /var/lib/postgres/data
            systemctl start postgresql
            systemctl enable postgresql
            ;;
        *)
            log_error "Unsupported distribution for automatic PostgreSQL installation"
            exit 1
            ;;
    esac
    
    log_info "PostgreSQL installed and started"
}

# Install Redis
install_redis() {
    log_info "Installing Redis..."
    
    case $OS in
        ubuntu|debian)
            apt-get install -y redis-server
            systemctl start redis-server
            systemctl enable redis-server
            ;;
        centos|rhel|fedora)
            yum install -y redis
            systemctl start redis
            systemctl enable redis
            ;;
        arch)
            pacman -S --noconfirm redis
            systemctl start redis
            systemctl enable redis
            ;;
        *)
            log_error "Unsupported distribution for automatic Redis installation"
            exit 1
            ;;
    esac
    
    log_info "Redis installed and started"
}

# Install optional dependencies
install_optional() {
    log_info "Installing optional dependencies..."
    
    # ClamAV for virus scanning
    case $OS in
        ubuntu|debian)
            apt-get install -y clamav clamav-daemon
            systemctl start clamav-daemon
            systemctl enable clamav-daemon
            ;;
        centos|rhel|fedora)
            yum install -y clamav clamav-update clamd
            systemctl start clamd
            systemctl enable clamd
            ;;
        arch)
            pacman -S --noconfirm clamav
            systemctl start clamav-daemon
            systemctl enable clamav-daemon
            ;;
    esac
    
    # 7-Zip for archive support
    case $OS in
        ubuntu|debian)
            apt-get install -y p7zip-full
            ;;
        centos|rhel|fedora)
            yum install -y p7zip p7zip-plugins
            ;;
        arch)
            pacman -S --noconfirm p7zip
            ;;
    esac
    
    # FFmpeg for video processing
    case $OS in
        ubuntu|debian)
            apt-get install -y ffmpeg
            ;;
        centos|rhel|fedora)
            yum install -y ffmpeg
            ;;
        arch)
            pacman -S --noconfirm ffmpeg
            ;;
    esac
    
    log_info "Optional dependencies installed"
}

# Setup database
setup_database() {
    log_info "Setting up PostgreSQL database..."
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE atxfilemanager;" 2>/dev/null || log_warn "Database may already exist"
    sudo -u postgres psql -c "CREATE USER atxuser WITH PASSWORD 'atxpassword';" 2>/dev/null || log_warn "User may already exist"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE atxfilemanager TO atxuser;" 2>/dev/null
    
    log_info "Database setup complete"
}

# Setup application
setup_application() {
    log_info "Setting up application..."
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    npm install
    
    log_info "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        cp .env.example .env
        
        # Update database credentials in .env
        sed -i 's/POSTGRES_PASSWORD=postgres/POSTGRES_PASSWORD=atxpassword/' .env
        sed -i 's/POSTGRES_USER=postgres/POSTGRES_USER=atxuser/' .env
    fi
    
    # Build application
    log_info "Building application..."
    npm run build
    
    # Run migrations
    log_info "Running database migrations..."
    npm run migrate
    
    # Seed database
    log_info "Seeding database..."
    npm run seed
    
    log_info "Application setup complete"
}

# Create systemd service
create_service() {
    log_info "Creating systemd service..."
    
    INSTALL_DIR=$(pwd)
    
    cat > /etc/systemd/system/atxfilemanager.service <<EOF
[Unit]
Description=ATX File Manager
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=atxfilemanager
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable atxfilemanager
    
    log_info "Systemd service created"
}

# Main installation flow
main() {
    log_info "================================"
    log_info "ATX File Manager Installer"
    log_info "================================"
    echo
    
    # Update package manager
    log_info "Updating package manager..."
    case $OS in
        ubuntu|debian)
            apt-get update
            ;;
        centos|rhel|fedora)
            yum update -y
            ;;
        arch)
            pacman -Syu --noconfirm
            ;;
    esac
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        install_nodejs
    else
        log_info "Node.js already installed: $(node --version)"
    fi
    
    # Check if PostgreSQL is installed
    if ! command -v psql &> /dev/null; then
        install_postgresql
    else
        log_info "PostgreSQL already installed"
    fi
    
    # Check if Redis is installed
    if ! command -v redis-cli &> /dev/null; then
        install_redis
    else
        log_info "Redis already installed"
    fi
    
    # Ask about optional dependencies
    read -p "Install optional dependencies (ClamAV, 7-Zip, FFmpeg)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_optional
    fi
    
    # Setup database
    setup_database
    
    # Setup application
    setup_application
    
    # Ask about systemd service
    read -p "Create systemd service for automatic startup? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_service
    fi
    
    echo
    log_info "================================"
    log_info "Installation Complete!"
    log_info "================================"
    echo
    log_info "Default admin credentials:"
    log_info "  Email: admin@atxfilemanager.com"
    log_info "  Password: changeme"
    echo
    log_warn "IMPORTANT: Change the admin password after first login!"
    echo
    log_info "To start the application:"
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "  sudo systemctl start atxfilemanager"
        log_info "  sudo systemctl status atxfilemanager"
    else
        log_info "  npm start"
    fi
    echo
    log_info "Backend will run on: http://localhost:3001"
    log_info "Frontend should be served separately (see README)"
    echo
}

# Run main installation
main
