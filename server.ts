import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './server/config/db.ts';

import authRoutes from './server/controllers/authController.ts';
import userRoutes from './server/controllers/userController.ts';
import postRoutes from './server/controllers/postController.ts';
import businessRoutes from './server/controllers/businessController.ts';
import eventRoutes from './server/controllers/eventController.ts';
import helpRoutes from './server/controllers/helpController.ts';
import lostFoundRoutes from './server/controllers/lostFoundController.ts';
import notificationRoutes from './server/controllers/notificationController.ts';
import searchRoutes from './server/controllers/searchController.ts';
import alertRoutes from './server/controllers/alertController.ts';
import systemRoutes from './server/controllers/systemController.ts';
import uploadRoutes from './server/controllers/uploadController.ts';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Connect to MongoDB before handling API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({
      error: 'Database connection failed',
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/upload', uploadRoutes);

// API 404
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    error: 'API route not found',
  });
});

// API error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API error:', err);

  res.status(err?.status || 500).json({
    error: 'An internal server error occurred.',
  });
});

// Start local server only when running locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

export default app;