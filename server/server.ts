import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Server startup logic
const startServer = async () => {
  const useNativeHttps = process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH;

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

  if (useNativeHttps) {
    try {
      const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH!),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH!),
      };
      https.createServer(options, app).listen(PORT, () => {
        console.log(`Native HTTPS Server running on port ${PORT}`);
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
