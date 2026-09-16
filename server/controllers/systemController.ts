import { Router } from 'express';
import mongoose from 'mongoose';
import { isDbConnected } from '../config/db.ts';
import { inMemoryUsers } from './authController.ts';
import { inMemoryPosts } from './postController.ts';
import { inMemoryBusinesses } from './businessController.ts';
import { inMemoryEvents } from './eventController.ts';
import { inMemoryHelpRequests } from './helpController.ts';
import { inMemoryLostFound } from './lostFoundController.ts';
import { User } from '../models/User.ts';
import { Post } from '../models/Post.ts';
import { Business } from '../models/Business.ts';
import { Event } from '../models/Event.ts';
import { HelpRequest } from '../models/HelpRequest.ts';
import { LostFound } from '../models/LostFound.ts';

const router = Router();

router.get('/status', async (req, res) => {
  const isMongoose = mongoose.connection.readyState === 1;
  const mongoUriConfigured = Boolean(
    process.env.MONGODB_URI &&
      process.env.MONGODB_URI.trim() !== '' &&
      !process.env.MONGODB_URI.includes('example')
  );

  let counts = {
    users: 0,
    posts: 0,
    businesses: 0,
    events: 0,
    helpRequests: 0,
    lostFound: 0,
  };

  try {
    if (isMongoose) {
      const [u, p, b, e, h, l] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Business.countDocuments(),
        Event.countDocuments(),
        HelpRequest.countDocuments(),
        LostFound.countDocuments(),
      ]);
      counts = { users: u, posts: p, businesses: b, events: e, helpRequests: h, lostFound: l };
    } else {
      counts = {
        users: inMemoryUsers.length,
        posts: inMemoryPosts.length,
        businesses: inMemoryBusinesses.length,
        events: inMemoryEvents.length,
        helpRequests: inMemoryHelpRequests.length,
        lostFound: inMemoryLostFound.length,
      };
    }
  } catch (err) {
    // Ignore count error
  }

  const isMapsConfigured = Boolean(
    (process.env.MAP_API_KEY && process.env.MAP_API_KEY.trim() !== '') ||
    (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY.trim() !== '')
  );
  const isWeatherConfigured = Boolean(
    (process.env.WEATHER_API_KEY && process.env.WEATHER_API_KEY.trim() !== '') ||
    (process.env.GOOGLE_WEATHER_API_KEY && process.env.GOOGLE_WEATHER_API_KEY.trim() !== '')
  );
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_CLOUD_NAME.trim() !== '' &&
    process.env.CLOUDINARY_API_KEY.trim() !== ''
  );

  res.json({
    status: 'ok',
    database: {
      connected: isMongoose,
      configured: mongoUriConfigured,
      engine: isMongoose ? 'MongoDB Atlas' : 'In-Memory DB Buffer (Active)',
      connectionState: mongoose.STATES[mongoose.connection.readyState] || 'disconnected',
    },
    optionalServices: {
      googleMaps: {
        configured: isMapsConfigured,
        status: isMapsConfigured ? 'configured' : 'not_configured',
        name: 'Google Maps & Places',
      },
      weather: {
        configured: isWeatherConfigured,
        status: isWeatherConfigured ? 'configured' : 'not_configured',
        name: 'Google Weather & Meteorological Radar',
      },
      cloudinary: {
        configured: isCloudinaryConfigured,
        status: isCloudinaryConfigured ? 'configured' : 'not_configured',
        name: 'Cloudinary Media CDN',
      },
    },
    counts,
    timestamp: new Date().toISOString(),
  });
});

export default router;
