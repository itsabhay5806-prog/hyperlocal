import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db.ts';

// Import route controllers
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security and request parsing
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Connect to MongoDB Atlas (if MONGODB_URI is provided)
  await connectDB();

  // Explicit health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // API Routes FIRST
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

  // Global API error handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(err.status || 500).json({
      error: 'An internal server error occurred.',
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HyperLocal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
});
