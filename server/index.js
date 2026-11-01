import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import apiRouter from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');
const publicPath = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
app.use(cors());

// Webhook endpoint needs raw body before express.json() parses it
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// 1. API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Diwali Essentials Booking Server'
  });
});

// 2. Serve static assets from public and dist
app.use(express.static(publicPath));
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// 3. Fallback: Serve single-page website on all unhandled frontend GET routes (Express 5 compatible)
app.use((req, res) => {
  if (req.method === 'GET') {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.redirect('http://localhost:5173');
  }
  res.status(404).send('Not Found');
});

// Start server after DB initialization
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🪔 Diwali Essentials website & backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database and start server:', err);
    process.exit(1);
  }
}

startServer();
