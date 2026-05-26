import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { getRedisClient } from './utils/redis';
import { initWebSocketServer } from './utils/websocket';
import { startWorker } from './services/queueService';
import assignmentRoutes from './routes/assignments';

const app = express();
const PORT = parseInt(process.env.PORT || '4000');
const WS_PORT = parseInt(process.env.WS_PORT || '4001');

// Ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Middleware ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ── Routes ──
app.use('/api/assignments', assignmentRoutes);

app.get('/api/health', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  let redisOk = false;
  try {
    await getRedisClient().ping();
    redisOk = true;
  } catch {}

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoOk ? 'connected' : 'disconnected',
      redis: redisOk ? 'connected' : 'disconnected',
    },
  });
});

// ── Error handler ──
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

async function start() {
  // MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connected');

  // Redis (lazy init, connection errors are non-fatal)
  try {
    getRedisClient();
  } catch (e) {
    console.warn('Redis not available, caching disabled');
  }

  // WebSocket server
  initWebSocketServer(WS_PORT);

  // BullMQ Worker
  startWorker();

  // HTTP server
  app.listen(PORT, () => {
    console.log(`🚀 VedaAI Backend running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket running on ws://localhost:${WS_PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
