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
const ensureSslCertificates = () => {
  const sslDir = path.join(__dirname, '../.ssl');
  const keyPath = process.env.SSL_KEY_PATH || path.join(sslDir, 'server.key');
  const certPath = process.env.SSL_CERT_PATH || path.join(sslDir, 'server.crt');

  // Check if provided paths exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { keyPath, certPath };
  }

  // If AUTO_SSL is enabled, generate self-signed
  if (process.env.AUTO_SSL === 'true') {
    if (!fs.existsSync(sslDir)) {
      fs.mkdirSync(sslDir, { recursive: true });
    }

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.log('Generating self-signed SSL certificates...');
      const attrs = [{ name: 'commonName', value: 'KMU CyberGuard' }];
      const pems = selfsigned.generate(attrs, { days: 365 });
      
      fs.writeFileSync(keyPath, pems.private, 'utf8');
      fs.writeFileSync(certPath, pems.cert, 'utf8');
      console.log(`Self-signed certificates generated at: ${sslDir}`);
    }
    return { keyPath, certPath };
  }

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
  const sslConfig = ensureSslCertificates();

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from the React app in production
    app.use(express.static(path.join(__dirname, '../dist')));
    
    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
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
      https.createServer(options, app).listen(PORT, () => {
        console.log(`Native HTTPS Server running on port ${PORT}`);
        if (process.env.AUTO_SSL === 'true') {
          console.log('Note: Using self-signed certificates. Browsers will show a warning.');
        }
      });
      return;
    } catch (error) {
      console.error('Failed to start native HTTPS server, falling back to HTTP:', error);
    }
  }

  // Fallback to HTTP (standard for environments with external SSL termination like this one)
  http.createServer(app).listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT} (SSL handled by proxy)`);
  });
};

startServer();
