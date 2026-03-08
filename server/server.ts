import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

import selfsigned from 'selfsigned';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ensure SSL certificates exist
const ensureSslCertificates = async () => {
  const sslDir = path.join(__dirname, '../.ssl');
  const defaultKeyPath = path.join(sslDir, 'server.key');
  const defaultCertPath = path.join(sslDir, 'server.crt');
  
  const keyPath = process.env.SSL_KEY_PATH || defaultKeyPath;
  const certPath = process.env.SSL_CERT_PATH || defaultCertPath;

  console.log(`[SSL] Checking for certificates at: ${keyPath}`);

  // Check if provided paths exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('[SSL] Existing certificates found.');
    return { keyPath, certPath };
  }

  // If AUTO_SSL is enabled, generate self-signed
  if (process.env.AUTO_SSL === 'true') {
    console.log('[SSL] AUTO_SSL is enabled. Attempting to generate certificates...');
    
    try {
      const targetDir = path.dirname(keyPath);
      if (!fs.existsSync(targetDir)) {
        console.log(`[SSL] Creating directory: ${targetDir}`);
        fs.mkdirSync(targetDir, { recursive: true });
      }

      console.log('[SSL] selfsigned module type:', typeof selfsigned);
      console.log('[SSL] selfsigned keys:', Object.keys(selfsigned || {}));

      console.log('[SSL] Generating self-signed SSL certificates...');
      const attrs = [{ name: 'commonName', value: 'KMU CyberGuard' }];
      
      // Try to get the generate function correctly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const generateFn = (selfsigned as any).generate || selfsigned;
      if (typeof generateFn !== 'function') {
        throw new Error(`selfsigned.generate is not a function. Type: ${typeof generateFn}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pems: any = generateFn(attrs, { days: 365 });
      
      // Check if it's a promise
      if (pems && typeof pems.then === 'function') {
        console.log('[SSL] Detected Promise from generate function, awaiting...');
        pems = await pems;
      }
      
      console.log('[SSL] Debug - pems type:', typeof pems);
      if (pems) {
        console.log('[SSL] Debug - pems keys:', Object.keys(pems));
        // Log a bit of the content to see if it's there
        if (pems.private || pems.privateKey || pems.key) console.log('[SSL] Private key data found');
        if (pems.cert || pems.certificate) console.log('[SSL] Certificate data found');
      }
      
      // Support different property names (private/privateKey and cert/certificate)
      const privateKey = pems?.private || pems?.privateKey || pems?.key;
      const certificate = pems?.cert || pems?.certificate;

      if (!privateKey || !certificate) {
        throw new Error('Generated certificates are missing private key or certificate data.');
      }
      
      fs.writeFileSync(keyPath, privateKey, 'utf8');
      fs.writeFileSync(certPath, certificate, 'utf8');
      console.log(`[SSL] Self-signed certificates successfully generated at: ${keyPath}`);
      return { keyPath, certPath };
    } catch (err) {
      console.error('[SSL] Failed to generate self-signed certificates:', err);
      return null;
    }
  }

  console.log('[SSL] No certificates found and AUTO_SSL is disabled.');
  return null;
};

app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// HTTPS Redirect Middleware (for production/proxy environments)
app.use((req, res, next) => {
  // Check x-forwarded-proto header which is set by most reverse proxies
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  if (process.env.FORCE_HTTPS === 'true' && !isSecure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// API endpoint to send email
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"KMU CyberGuard" <noreply@example.com>',
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Admin API: Read .env file
app.get('/api/admin/env', (req, res) => {
  try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      res.json({ content });
    } else {
      // If .env doesn't exist, try .env.example or return empty
      const examplePath = path.join(__dirname, '../.env.example');
      if (fs.existsSync(examplePath)) {
        const content = fs.readFileSync(examplePath, 'utf8');
        res.json({ content });
      } else {
        res.json({ content: '' });
      }
    }
  } catch (error) {
    console.error('Error reading .env:', error);
    res.status(500).json({ error: 'Failed to read .env' });
  }
});

// Admin API: Save .env file
app.post('/api/admin/env', (req, res) => {
  try {
    const { content } = req.body;
    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const envPath = path.join(__dirname, '../.env');
    fs.writeFileSync(envPath, content, 'utf8');
    
    // Reload environment variables in current process (optional, but helpful)
    // Note: This only updates process.env, it doesn't restart the server
    const buf = Buffer.from(content);
    const config = dotenv.parse(buf);
    for (const k in config) {
      process.env[k] = config[k];
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving .env:', error);
    res.status(500).json({ error: 'Failed to save .env' });
  }
});

// Server startup logic
const startServer = async () => {
  console.log('-------------------------------------------------------');
  console.log(`[CyberGuard] Startvorgang eingeleitet...`);
  console.log(`[CyberGuard] Modus: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[CyberGuard] Ziel-Port: ${PORT}`);
  
  const sslConfig = await ensureSslCertificates();

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  if (sslConfig) {
    try {
      const options = {
        key: fs.readFileSync(sslConfig.keyPath),
        cert: fs.readFileSync(sslConfig.certPath),
      };
      
      const httpsServer = https.createServer(options, app);
      
      httpsServer.on('error', (e: Error & { code?: string }) => {
        if (e.code === 'EADDRINUSE') {
          console.error(`[FEHLER] Port ${PORT} wird bereits von einem anderen Programm belegt!`);
        } else if (e.code === 'EACCES') {
          console.error(`[FEHLER] Keine Berechtigung für Port ${PORT}. (Versuchen Sie sudo oder einen Port > 1024)`);
        } else {
          console.error(`[FEHLER] HTTPS-Server konnte nicht starten:`, e);
        }
      });

      httpsServer.listen(PORT, '0.0.0.0', () => {
        console.log(`[ERFOLG] HTTPS-Server aktiv!`);
        console.log(`[INFO] Lokal:    https://localhost:${PORT}`);
        console.log(`[INFO] Netzwerk: https://192.168.0.34:${PORT} (Beispiel-IP)`);
        console.log(`[WARN] Falls die Seite nicht lädt: Prüfen Sie Ihre Firewall für Port ${PORT}!`);
        console.log('-------------------------------------------------------');
      });
      return;
    } catch (error) {
      console.error('[SSL] Kritischer Fehler beim Laden der Zertifikate:', error);
    }
  }

  // Fallback to HTTP
  console.log(`[INFO] Starte im HTTP-Modus (kein SSL aktiv)...`);
  const httpServer = http.createServer(app);
  
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ERFOLG] HTTP-Server aktiv auf Port ${PORT}`);
    console.log(`[INFO] Adresse: http://0.0.0.0:${PORT}`);
    console.log('-------------------------------------------------------');
  });
};

startServer();
