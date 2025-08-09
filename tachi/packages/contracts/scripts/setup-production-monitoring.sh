#!/bin/bash

# Tachi Protocol - Production Monitoring Setup Script
# This script configures the complete monitoring infrastructure

set -e

echo "🚀 Setting up Tachi Protocol Production Monitoring..."

# Configuration
MONITORING_DIR="/opt/tachi/monitoring"
LOG_DIR="/var/log/tachi"
SERVICE_USER="tachi"
NODE_VERSION="18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root or with sudo"
        exit 1
    fi
}

# Install system dependencies
install_dependencies() {
    print_step "Installing system dependencies..."
    
    # Update package list
    apt update
    
    # Install required packages
    apt install -y \
        curl \
        wget \
        git \
        build-essential \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban \
        htop \
        iotop \
        netstat-nat \
        jq \
        logrotate
    
    print_status "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    print_step "Installing Node.js ${NODE_VERSION}..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2@latest pnpm@latest
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_status "Node.js ${node_version} and npm ${npm_version} installed"
}

# Create monitoring user
create_user() {
    print_step "Creating monitoring service user..."
    
    # Create user if it doesn't exist
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -d $MONITORING_DIR $SERVICE_USER
        print_status "User $SERVICE_USER created"
    else
        print_warning "User $SERVICE_USER already exists"
    fi
}

# Setup directories
setup_directories() {
    print_step "Setting up directory structure..."
    
    # Create directories
    mkdir -p $MONITORING_DIR/{config,scripts,logs,backup}
    mkdir -p $LOG_DIR
    mkdir -p /etc/tachi
    
    # Set permissions
    chown -R $SERVICE_USER:$SERVICE_USER $MONITORING_DIR
    chown -R $SERVICE_USER:$SERVICE_USER $LOG_DIR
    chown -R root:$SERVICE_USER /etc/tachi
    
    chmod 755 $MONITORING_DIR
    chmod 755 $LOG_DIR
    chmod 750 /etc/tachi
    
    print_status "Directory structure created"
}

# Configure log rotation
setup_logrotate() {
    print_step "Configuring log rotation..."
    
    cat > /etc/logrotate.d/tachi << EOF
$LOG_DIR/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload tachi-monitoring || true
    endscript
}
EOF
    
    print_status "Log rotation configured"
}

# Setup firewall
configure_firewall() {
    print_step "Configuring firewall..."
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp comment 'SSH'
    
    # Allow monitoring dashboard
    ufw allow 3001/tcp comment 'Tachi Monitoring Dashboard'
    
    # Allow HTTP/HTTPS for web dashboard
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Enable firewall
    ufw --force enable
    
    print_status "Firewall configured and enabled"
}

# Configure fail2ban
setup_fail2ban() {
    print_step "Configuring fail2ban..."
    
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = 80,443
logpath = /var/log/nginx/error.log

[tachi-monitoring]
enabled = true
port = 3001
logpath = $LOG_DIR/security.log
filter = tachi-monitoring
maxretry = 3
bantime = 7200

EOF

    # Create custom filter for monitoring
    cat > /etc/fail2ban/filter.d/tachi-monitoring.conf << EOF
[Definition]
failregex = ^.*\[SECURITY\].*Failed authentication attempt from <HOST>.*$
            ^.*\[SECURITY\].*Suspicious activity from <HOST>.*$
            ^.*\[SECURITY\].*Rate limit exceeded from <HOST>.*$
ignoreregex =
EOF
    
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    print_status "Fail2ban configured and started"
}

# Install monitoring dependencies
install_monitoring_deps() {
    print_step "Installing monitoring application dependencies..."
    
    cd $MONITORING_DIR
    
    # Create package.json
    cat > package.json << EOF
{
  "name": "tachi-production-monitoring",
  "version": "1.0.0",
  "description": "Tachi Protocol Production Monitoring System",
  "main": "dist/monitoring/start-monitoring.js",
  "scripts": {
    "start": "node dist/monitoring/start-monitoring.js",
    "build": "tsc",
    "dev": "ts-node src/monitoring/start-monitoring.ts",
    "test": "jest",
    "health": "curl -s http://localhost:3001/api/health | jq"
  },
  "dependencies": {
    "@slack/web-api": "^6.8.1",
    "@sentry/node": "^7.60.1",
    "axios": "^1.4.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "ethers": "^6.7.1",
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "rate-limiter-flexible": "^2.4.2",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/morgan": "^1.9.4",
    "@types/node": "^20.4.5",
    "jest": "^29.6.2",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
    
    # Install dependencies
    chown $SERVICE_USER:$SERVICE_USER package.json
    sudo -u $SERVICE_USER npm install
    
    print_status "Monitoring dependencies installed"
}

# Create systemd service
create_service() {
    print_step "Creating systemd service..."
    
    cat > /etc/systemd/system/tachi-monitoring.service << EOF
[Unit]
Description=Tachi Protocol Production Monitoring
After=network.target
Wants=network.target

[Service]
Type=forking
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$MONITORING_DIR
ExecStart=$MONITORING_DIR/node_modules/.bin/pm2 start ecosystem.config.js --env production
ExecReload=$MONITORING_DIR/node_modules/.bin/pm2 restart all
ExecStop=$MONITORING_DIR/node_modules/.bin/pm2 kill
PIDFile=$MONITORING_DIR/.pm2/pm2.pid
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=tachi-monitoring
Environment=NODE_ENV=production
Environment=PM2_HOME=$MONITORING_DIR/.pm2

[Install]
WantedBy=multi-user.target
EOF
    
    # Create PM2 ecosystem file
    cat > $MONITORING_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tachi-monitoring',
    script: 'dist/monitoring/start-monitoring.js',
    cwd: '$MONITORING_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '$LOG_DIR/combined.log',
    out_file: '$LOG_DIR/out.log',
    error_file: '$LOG_DIR/error.log',
    time: true,
    max_memory_restart: '500M',
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s'
  }, {
    name: 'tachi-dashboard',
    script: 'dist/monitoring/dashboard-server.js',
    cwd: '$MONITORING_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    log_file: '$LOG_DIR/dashboard.log',
    out_file: '$LOG_DIR/dashboard-out.log',
    error_file: '$LOG_DIR/dashboard-error.log',
    time: true
  }]
}
EOF
    
    chown $SERVICE_USER:$SERVICE_USER $MONITORING_DIR/ecosystem.config.js
    
    # Enable service
    systemctl daemon-reload
    systemctl enable tachi-monitoring
    
    print_status "Systemd service created and enabled"
}

# Configure nginx reverse proxy
setup_nginx() {
    print_step "Configuring Nginx reverse proxy..."
    
    cat > /etc/nginx/sites-available/tachi-monitoring << EOF
server {
    listen 80;
    server_name monitoring.tachi.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=monitoring:10m rate=10r/s;
    limit_req zone=monitoring burst=20 nodelay;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Additional security for API endpoints
        auth_basic "Tachi Monitoring";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
    
    # Health check endpoint (no auth required)
    location /api/health {
        proxy_pass http://127.0.0.1:3001/api/health;
        auth_basic off;
    }
}
EOF
    
    # Create htpasswd file (user will need to set password)
    touch /etc/nginx/.htpasswd
    chmod 640 /etc/nginx/.htpasswd
    chown root:www-data /etc/nginx/.htpasswd
    
    # Enable site
    ln -sf /etc/nginx/sites-available/tachi-monitoring /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    nginx -t
    
    systemctl reload nginx
    
    print_status "Nginx reverse proxy configured"
}

# Setup SSL certificate
setup_ssl() {
    print_step "Setting up SSL certificate..."
    
    print_warning "SSL certificate setup requires a valid domain name."
    print_warning "Please ensure monitoring.tachi.com points to this server's IP."
    
    read -p "Do you want to proceed with SSL certificate setup? (y/N): " setup_ssl_confirm
    
    if [[ $setup_ssl_confirm =~ ^[Yy]$ ]]; then
        # Obtain certificate
        certbot --nginx -d monitoring.tachi.com --non-interactive --agree-tos --email admin@tachi.com
        print_status "SSL certificate configured"
    else
        print_warning "SSL certificate setup skipped"
    fi
}

# Create configuration templates
create_config_templates() {
    print_step "Creating configuration templates..."
    
    # Production environment template
    cat > /etc/tachi/production.env.template << EOF
# Tachi Protocol Production Monitoring Configuration
# Copy this to $MONITORING_DIR/.env.production and update with actual values

NODE_ENV=production
NETWORK=base

# Base Mainnet Configuration
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_PRODUCTION_ALCHEMY_API_KEY
BASESCAN_API_KEY=YOUR_PRODUCTION_BASESCAN_API_KEY

# Contract Addresses (Update after deployment)
MULTISIG_CONTRACT_ADDRESS=0x_PRODUCTION_MULTISIG_ADDRESS_HERE
CRAWL_NFT_ADDRESS=0x_CRAWL_NFT_ADDRESS_HERE
PAYMENT_PROCESSOR_ADDRESS=0x_PAYMENT_PROCESSOR_ADDRESS_HERE
PROOF_OF_CRAWL_LEDGER_ADDRESS=0x_PROOF_OF_CRAWL_LEDGER_ADDRESS_HERE

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CRITICAL_CHANNEL=#tachi-critical
SLACK_SECURITY_CHANNEL=#tachi-security
SLACK_OPERATIONS_CHANNEL=#tachi-ops

# PagerDuty Integration
PAGERDUTY_INTEGRATION_KEY=your-pagerduty-integration-key

# Sentry Configuration
SENTRY_DSN=https://your-production-sentry-dsn@sentry.io/project-id

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=monitoring@tachi.com
SMTP_PASS=your-app-specific-password
EMAIL_CRITICAL_RECIPIENTS=ceo@tachi.com,cto@tachi.com,security@tachi.com
EMAIL_SECURITY_RECIPIENTS=security@tachi.com,ops@tachi.com
EMAIL_OPERATIONS_RECIPIENTS=ops@tachi.com

# Monitoring Configuration
MONITORING_INTERVAL_MS=30000
GAS_WARNING_THRESHOLD=20
GAS_CRITICAL_THRESHOLD=50
RPC_WARNING_THRESHOLD=1000
RPC_CRITICAL_THRESHOLD=5000

# Dashboard Configuration
DASHBOARD_PORT=3001
DASHBOARD_AUTH_USERNAME=admin
DASHBOARD_AUTH_PASSWORD=your-secure-password

# Metrics Configuration
METRICS_ENDPOINT=https://your-metrics-service.com/api/metrics
METRICS_API_KEY=your-metrics-api-key
EOF
    
    chmod 600 /etc/tachi/production.env.template
    
    print_status "Configuration templates created"
}

# Create monitoring scripts
create_scripts() {
    print_step "Creating monitoring utility scripts..."
    
    # Status check script
    cat > $MONITORING_DIR/scripts/status.sh << 'EOF'
#!/bin/bash
echo "🔍 Tachi Protocol Monitoring Status"
echo "=================================="
echo
echo "📊 System Status:"
systemctl is-active tachi-monitoring
echo
echo "📈 Service Health:"
curl -s http://localhost:3001/api/health | jq -r '.status // "ERROR"'
echo
echo "💾 Memory Usage:"
free -h
echo
echo "📋 Recent Logs:"
tail -5 /var/log/tachi/combined.log
EOF

    # Restart script
    cat > $MONITORING_DIR/scripts/restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting Tachi Protocol Monitoring..."
systemctl restart tachi-monitoring
sleep 5
systemctl status tachi-monitoring
curl -s http://localhost:3001/api/health | jq
EOF
    
    # Backup script
    cat > $MONITORING_DIR/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/tachi/monitoring/backup"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/tachi-monitoring-backup-$DATE.tar.gz"

echo "📦 Creating backup: $BACKUP_FILE"
tar -czf $BACKUP_FILE \
    --exclude='node_modules' \
    --exclude='.pm2' \
    --exclude='backup' \
    /opt/tachi/monitoring \
    /var/log/tachi \
    /etc/tachi

echo "✅ Backup created successfully"
ls -lh $BACKUP_FILE
EOF
    
    # Make scripts executable
    chmod +x $MONITORING_DIR/scripts/*.sh
    chown -R $SERVICE_USER:$SERVICE_USER $MONITORING_DIR/scripts
    
    print_status "Monitoring scripts created"
}

# Setup monitoring alerts
setup_monitoring_alerts() {
    print_step "Setting up system monitoring alerts..."
    
    # Create a simple health check cron job
    cat > /etc/cron.d/tachi-monitoring << EOF
# Tachi Protocol Monitoring Health Checks
*/5 * * * * $SERVICE_USER /usr/bin/curl -s http://localhost:3001/api/health > /dev/null || echo "Monitoring service down" | logger -t tachi-monitoring
0 */6 * * * root $MONITORING_DIR/scripts/backup.sh > /dev/null 2>&1
EOF
    
    print_status "Monitoring alerts configured"
}

# Final setup and validation
finalize_setup() {
    print_step "Finalizing setup and performing validation..."
    
    # Create initial environment file
    if [ ! -f "$MONITORING_DIR/.env.production" ]; then
        cp /etc/tachi/production.env.template $MONITORING_DIR/.env.production
        chown $SERVICE_USER:$SERVICE_USER $MONITORING_DIR/.env.production
        chmod 600 $MONITORING_DIR/.env.production
    fi
    
    # Test configuration
    print_status "Setup completed successfully!"
    echo
    echo "📋 Next Steps:"
    echo "1. Update configuration: $MONITORING_DIR/.env.production"
    echo "2. Build the monitoring application:"
    echo "   cd $MONITORING_DIR && npm run build"
    echo "3. Start the service:"
    echo "   systemctl start tachi-monitoring"
    echo "4. Set up dashboard authentication:"
    echo "   htpasswd -c /etc/nginx/.htpasswd admin"
    echo "5. Configure SSL certificate (optional):"
    echo "   certbot --nginx -d monitoring.tachi.com"
    echo
    echo "🔗 Access URLs:"
    echo "   Dashboard: http://localhost:3001"
    echo "   API Health: http://localhost:3001/api/health"
    echo "   Status Check: $MONITORING_DIR/scripts/status.sh"
    echo
    print_warning "Remember to update the configuration file with your actual API keys and addresses!"
}

# Main execution
main() {
    print_status "Starting Tachi Protocol Production Monitoring Setup"
    
    check_root
    install_dependencies
    install_nodejs
    create_user
    setup_directories
    setup_logrotate
    configure_firewall
    setup_fail2ban
    install_monitoring_deps
    create_service
    setup_nginx
    setup_ssl
    create_config_templates
    create_scripts
    setup_monitoring_alerts
    finalize_setup
    
    print_status "🎉 Tachi Protocol Production Monitoring setup complete!"
}

# Run main function
main "$@"
