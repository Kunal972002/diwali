import cors from 'cors';
import express from 'express';
import apiRouter from '../server/routes/api.js';

const app = express();

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

// Mount API router under /api
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Bhaskar Banana Farm Vercel Serverless API'
  });
});

export default app;
