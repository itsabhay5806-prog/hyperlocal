import express from 'express';
import path from 'path';
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

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    time: new Date()
  });
});

// Connect database
let dbInitialized = false;

async function initializeDB() {
  if (!dbInitialized) {
    await connectDB();
    dbInitialized = true;
  }
}

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

// Production static frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');

  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = Number(process.env.PORT) || 3000;

  initializeDB()
    .then(() => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Fatal Server Startup Error:', err);
    });
}

export default app;
