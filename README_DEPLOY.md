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

## Schritt 3: Bereitstellung mit Git (Empfohlen)

Diese Methode ist am einfachsten, um Updates einzuspielen.

### A. Code in ein Git-Repository bringen (Einmalig)

Da Sie den Code aktuell in einer Web-Umgebung haben:
1.  Laden Sie den Code herunter (als ZIP oder über die Export-Funktion).
2.  Erstellen Sie ein neues Repository auf GitHub, GitLab oder Bitbucket.
3.  Laden Sie den Code dort hoch:
    ```bash
    # Lokal auf Ihrem Rechner
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <Ihre-Repo-URL>
    git push -u origin main
    ```

### B. Code auf den Proxmox-Container klonen

1.  Verbinden Sie sich per SSH mit Ihrem Proxmox-Container:
    ```bash
    ssh root@<container-ip>
    ```

2.  (Optional) Falls Ihr Repository privat ist, müssen Sie sich authentifizieren.
    *   **HTTPS:** Sie werden beim Klonen nach Benutzername und "Personal Access Token" gefragt.
    *   **SSH:** Generieren Sie einen Key (`ssh-keygen`) und hinterlegen Sie den Public Key (`cat ~/.ssh/id_rsa.pub`) in Ihrem Git-Profil.

3.  Klonen Sie das Repository in das Zielverzeichnis `/opt/kmu-cyberguard`:
    ```bash
    # Beispiel mit HTTPS
    git clone https://github.com/IhrUsername/kmu-cyberguard.git /opt/kmu-cyberguard
    
    # ODER Beispiel mit SSH
    git clone git@github.com:IhrUsername/kmu-cyberguard.git /opt/kmu-cyberguard
    ```

4.  Wechseln Sie in das Verzeichnis:
    ```bash
    cd /opt/kmu-cyberguard
    ```

## Schritt 4: Installation & Start

Führen Sie das Installationsskript aus. Dieses Skript installiert Node.js, baut die Anwendung und richtet den Autostart ein.

```bash
chmod +x setup_proxmox.sh
./setup_proxmox.sh
```

## Schritt 5: Konfiguration (.env)

Das Skript hat eine `.env` Datei erstellt. Diese müssen Sie nun anpassen:

1.  Öffnen Sie die Datei:
    ```bash
    nano /opt/kmu-cyberguard/.env
    ```
2.  Tragen Sie Ihre echten Daten ein:
    *   `SMTP_...`: Zugangsdaten für den E-Mail-Versand (z.B. von Gmail, GMX, Office365).
    *   `GEMINI_API_KEY`: Ihr Google AI API Key.

3.  Starten Sie den Dienst neu, um die Änderungen zu übernehmen:
    ```bash
    systemctl restart kmu-cyberguard
    ```

## Updates einspielen

Wenn Sie später Änderungen am Code vornehmen und ins Git pushen, können Sie den Container einfach aktualisieren:

```bash
cd /opt/kmu-cyberguard
git pull
npm install
npm run build
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
