import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import config from '../config/index.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import healthRoutes from './routes/health.routes.js';
import solanaRoutes from './routes/solana.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { setupWebSocketHandlers } from './websocket/handler.js';

// Validate config
const warnings = config.validate();
warnings.forEach((w) => logger.warn(w));

// Create Express app
const app = express();

// --- Global middleware ---
app.use(helmet({
  contentSecurityPolicy: false, // Allow frontend to connect
}));

// Parse CORS origins (supports comma-separated list)
const corsOrigins = config.corsOrigin.split(',').map((o) => o.trim());

app.use(cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Apply general rate limiter
app.use('/api/', apiLimiter);

// --- Routes ---
app.use('/api/health', healthRoutes);
app.use('/api/wallet', solanaRoutes);
app.use('/api/ai', aiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Solana AI Teacher',
    version: '1.0.0',
    description: 'Voice-controlled Solana teaching terminal backend',
    network: 'devnet',
    endpoints: {
      health: '/api/health',
      wallet: '/api/wallet',
      ai: '/api/ai',
      websocket: `ws://localhost:${config.port}`,
    },
    docs: '/api/health for status',
  });
});

// --- Error handling ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- HTTP + WebSocket Server ---
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocketHandlers(wss);

// --- Start ---
server.listen(config.port, () => {
  logger.info(`🚀 Solana AI Teacher server running on port ${config.port}`);
  logger.info(`   REST API: http://localhost:${config.port}/api`);
  logger.info(`   WebSocket: ws://localhost:${config.port}/ws`);
  logger.info(`   Health: http://localhost:${config.port}/api/health`);
  logger.info(`   Network: devnet (hardcoded)`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  wss.close(() => {
    logger.info('WebSocket server closed');
  });
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`, { stack: error.stack });
  shutdown('uncaughtException');
});

export { app, server, wss };
