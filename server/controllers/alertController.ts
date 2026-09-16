import { Router } from 'express';
import { Alert } from '../models/Alert.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { isMongooseConnected } from './authController.ts';

const router = Router();
export const inMemoryAlerts: any[] = [];

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const weatherApiKey = process.env.WEATHER_API_KEY || process.env.GOOGLE_WEATHER_API_KEY;
    let liveWeather = null;
    let weatherAvailable = false;
    const isWeatherConfigured = Boolean(
      weatherApiKey &&
      weatherApiKey !== 'MY_WEATHER_API_KEY' &&
      weatherApiKey.trim() !== ''
    );

    // Check if real weather API is configured
    if (isWeatherConfigured && weatherApiKey) {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
        try {
          // Real OpenWeatherMap or WeatherAPI call if configured
          const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`
          );
          if (weatherRes.ok) {
            const data = await weatherRes.json();
            liveWeather = {
              temp: data.main?.temp,
              description: data.weather?.[0]?.description,
              condition: data.weather?.[0]?.main,
              city: data.name,
            };
            weatherAvailable = true;
          }
        } catch (wErr) {
          console.warn('External weather API fetch failed:', wErr);
        }
      }
    }

    // Retrieve active alerts from database (moderator/admin created only - no fake alerts)
    let dbAlerts: any[] = [];
    if (isMongooseConnected()) {
      dbAlerts = await Alert.find({ isActive: true }).sort({ createdAt: -1 }).limit(10).lean();
    } else {
      dbAlerts = inMemoryAlerts.filter((a) => a.isActive);
    }

    res.json({
      alerts: dbAlerts,
      count: dbAlerts.length,
      liveWeather,
      weatherAvailable,
      weatherConfigured: isWeatherConfigured,
      statusMessage: !isWeatherConfigured
        ? 'Weather service is optional and currently not configured.'
        : dbAlerts.length === 0 && !weatherAvailable
          ? 'Live alerts are currently unavailable.'
          : null,
    });
  } catch (error: any) {
    console.error('Alerts error:', error);
    res.status(500).json({ error: 'Failed to retrieve civic alerts.' });
  }
});

// POST /api/alerts - Create civic alert (for authorized moderators/admins)
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, severity, emergencyProtocol, helpline, areaName } = req.body;
    const role = req.user!.role;

    if (!title || !description || !type) {
      res.status(400).json({ error: 'Title, description, and alert type are required.' });
      return;
    }

    if (role !== 'admin' && role !== 'moderator') {
      res.status(403).json({ error: 'Only community moderators and administrators can publish civic alerts.' });
      return;
    }

    if (isMongooseConnected()) {
      const alert = await Alert.create({
        title: title.trim(),
        description: description.trim(),
        type,
        severity: severity || 'advisory',
        source: 'Municipal Civic Authority',
        emergencyProtocol: emergencyProtocol || '',
        helpline: helpline || '',
        areaName: areaName || 'All Neighborhoods',
        isActive: true,
      });

      res.status(201).json({ alert });
    } else {
      const alert = {
        _id: new Date().getTime().toString(),
        title: title.trim(),
        description: description.trim(),
        type,
        severity: severity || 'advisory',
        source: 'Municipal Civic Authority',
        emergencyProtocol: emergencyProtocol || '',
        helpline: helpline || '',
        areaName: areaName || 'All Neighborhoods',
        isActive: true,
        createdAt: new Date(),
      };
      inMemoryAlerts.unshift(alert);
      res.status(201).json({ alert });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create civic alert.' });
  }
});

export default router;
