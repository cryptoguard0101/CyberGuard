# KMU CyberGuard - Proxmox Deployment Guide

This guide explains how to deploy the KMU CyberGuard application as a Proxmox LXC container.

## Prerequisites

- A Proxmox VE server.
- An Ubuntu 22.04 or Debian 12 LXC template.
- SSH access to the container.

## Step 1: Create an LXC Container

1.  In Proxmox, create a new LXC container.
2.  Choose an Ubuntu 22.04 or Debian 12 template.
3.  Allocate sufficient resources (e.g., 2GB RAM, 2 vCPUs, 10GB disk).
4.  Start the container.

## Step 2: Prepare the Container

1.  SSH into the container: `ssh root@<container-ip>`
2.  Update the system: `apt update && apt upgrade -y`
3.  Install Git and Curl: `apt install -y git curl`

## Step 3: Deploy the Application

1.  Copy the application files to the container. You can use `scp` or `git clone`.
    -   If using `scp`: `scp -r /path/to/kmu-cyberguard root@<container-ip>:/opt/`
    -   If using `git`: `git clone <your-repo-url> /opt/kmu-cyberguard`

2.  Run the setup script:
    ```bash
    cd /opt/kmu-cyberguard
    chmod +x setup_proxmox.sh
    ./setup_proxmox.sh
    ```

## Step 4: Configure Environment Variables

1.  Edit the `.env` file in `/opt/kmu-cyberguard`:
    ```bash
    nano /opt/kmu-cyberguard/.env
    ```
2.  Set your configuration:
    -   `PORT`: Port to listen on (default 3000).
    -   `SMTP_HOST`: Your SMTP server address (e.g., smtp.gmail.com).
    -   `SMTP_PORT`: SMTP port (e.g., 587).
    -   `SMTP_USER`: Your email address.
    -   `SMTP_PASS`: Your email password or app password.
    -   `SMTP_FROM`: Sender name and address.
    -   `GEMINI_API_KEY`: Your Google Gemini API key.

3.  Restart the service to apply changes:
    ```bash
    systemctl restart kmu-cyberguard
    ```

## Step 5: Access the Application

Open your browser and navigate to `http://<container-ip>:3000`.

## Troubleshooting

-   Check service status: `systemctl status kmu-cyberguard`
-   Check logs: `journalctl -u kmu-cyberguard -f`
-   Check application logs: `cat /opt/kmu-cyberguard/logs/app.log` (if configured)

## Docker Alternative (Optional)

If you prefer using Docker inside the LXC container (requires nesting enabled):

1.  Enable "Nesting" in Proxmox LXC Options -> Features.
2.  Install Docker inside the container.
3.  Run `docker-compose up -d`.
