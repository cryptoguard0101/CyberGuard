#!/bin/bash

# KMU CyberGuard - Proxmox LXC Setup Script
# This script installs Node.js, builds the application, and sets up a systemd service.
# Run this script inside your Proxmox LXC container (Ubuntu/Debian recommended).

set -e

echo "=== KMU CyberGuard Setup ==="

# 1. Update System
echo "[1/5] Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git build-essential

# 2. Install Node.js 20
echo "[2/5] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node -v
npm -v

# 3. Setup Application Directory
APP_DIR="/opt/kmu-cyberguard"
echo "[3/5] Setting up application in $APP_DIR..."

# If directory doesn't exist, create it. Ideally, you should clone your repo here.
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    echo "Created $APP_DIR. Please copy your application files here."
    # For demo purposes, we assume files are copied manually or via git clone
    # git clone https://github.com/your-repo/kmu-cyberguard.git $APP_DIR
fi

cd "$APP_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in $APP_DIR. Please copy the application files first."
    exit 1
fi

# 4. Install Dependencies & Build
echo "[4/5] Installing dependencies and building..."
npm install
npm run build

# 5. Setup Systemd Service
echo "[5/5] Configuring systemd service..."

# Create .env file if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env template..."
    cat <<EOF > .env
PORT=3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM="KMU CyberGuard <noreply@example.com>"
GEMINI_API_KEY=your_gemini_api_key_here
AUTO_SSL=true
FORCE_HTTPS=true
EOF
    echo "WARNING: Please edit $APP_DIR/.env with your actual configuration!"
fi

# Create service file
cat <<EOF > /etc/systemd/system/kmu-cyberguard.service
[Unit]
Description=KMU CyberGuard Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload and enable service
systemctl daemon-reload
systemctl enable kmu-cyberguard
systemctl start kmu-cyberguard

echo "=== Setup Complete ==="
echo "Application should be running on port 3000."
echo "Check status with: systemctl status kmu-cyberguard"
echo "Don't forget to configure your .env file!"
