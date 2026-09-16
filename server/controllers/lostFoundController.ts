import { Router } from 'express';
import mongoose from 'mongoose';
import { LostFound, LOST_FOUND_CATEGORIES } from '../models/LostFound.ts';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { isMongooseConnected, inMemoryUsers } from './authController.ts';
import { calculateDistanceKm, formatDistanceString } from '../utils/geo.ts';

const router = Router();
export const inMemoryLostFound: any[] = [];

// GET /api/lost-found
router.get('/', optionalAuth, async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 10;
    const category = req.query.category as string;
    const status = req.query.status as string;

    const hasCoords =
      lat !== undefined &&
      lng !== undefined &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      (lat !== 0 || lng !== 0);

    if (isMongooseConnected()) {
      const query: any = {};
      if (category && category !== 'all') query.category = category;
      if (status && status !== 'all') query.status = status;
      else query.status = 'active';

      if (hasCoords) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radiusKm * 1000,
          },
        };
      }

      const raw = await LostFound.find(query)
        .populate('createdBy', 'name email profilePhoto isVerified areaName')
        .limit(30)
        .lean();

      const items = raw.map((item: any) => {
        let distanceKm: number | null = null;
        let distanceText = '';
        if (hasCoords && item.location?.coordinates) {
          const [iLng, iLat] = item.location.coordinates;
          distanceKm = calculateDistanceKm(lat!, lng!, iLat, iLng);
          distanceText = formatDistanceString(distanceKm);
        }
        return { ...item, distanceKm, distanceText };
      });

      res.json({ items, count: items.length });
    } else {
      let filtered = [...inMemoryLostFound];
      if (category && category !== 'all') {
        filtered = filtered.filter((i) => i.category === category);
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((i) => i.status === status);
      } else {
        filtered = filtered.filter((i) => i.status === 'active');
      }

      if (hasCoords) {
        filtered = filtered
          .map((i) => {
            const [iLng, iLat] = i.location?.coordinates || [0, 0];
            const dist = calculateDistanceKm(lat!, lng!, iLat, iLng);
            return { ...i, distanceKm: dist, distanceText: formatDistanceString(dist) };
          })
          .filter((i) => i.distanceKm <= radiusKm);
      }

      const items = filtered.map((i) => {
        const creator = inMemoryUsers.find(
          (u) => u._id === (i.createdBy?._id || i.createdBy)
        );
        return { ...i, createdBy: creator || i.createdBy };
      });

      res.json({ items, count: items.length });
    }
  } catch (error: any) {
    console.error('Error fetching lost & found:', error);
    res.status(500).json({ error: 'Failed to retrieve lost & found reports.' });
  }
});

// POST /api/lost-found
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, category, images, location, areaName, contactInfo } = req.body;
    const userId = req.user!.userId;

    if (!title || !description || !category) {
      res.status(400).json({ error: 'Title, description, and category are required.' });
      return;
    }

    let coords: [number, number] = [0, 0];
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      coords = [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])];
    }

    if (isMongooseConnected()) {
      const item = await LostFound.create({
        title: title.trim(),
        description: description.trim(),
        category,
        images: Array.isArray(images) ? images : [],
        location: {
          type: 'Point',
          coordinates: coords,
        },
        areaName: areaName || 'My Neighborhood',
        createdBy: new mongoose.Types.ObjectId(userId),
        contactInfo: contactInfo ? contactInfo.trim() : '',
        status: 'active',
      });

      const populated = await LostFound.findById(item._id)
        .populate('createdBy', 'name email profilePhoto isVerified areaName')
        .lean();

      res.status(201).json({ item: populated });
    } else {
      const creator = inMemoryUsers.find((u) => u._id === userId);
      const item = {
        _id: new mongoose.Types.ObjectId().toString(),
        title: title.trim(),
        description: description.trim(),
        category,
        images: Array.isArray(images) ? images : [],
        location: {
          type: 'Point',
          coordinates: coords,
        },
        areaName: areaName || 'My Neighborhood',
        createdBy: creator || userId,
        contactInfo: contactInfo ? contactInfo.trim() : '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryLostFound.unshift(item);
      res.status(201).json({ item });
    }
  } catch (error: any) {
    console.error('Create lost-found error:', error);
    res.status(500).json({ error: 'Failed to create report.' });
  }
});

// PATCH /api/lost-found/:id/resolve
router.patch('/:id/resolve', requireAuth, async (req: AuthRequest, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user!.userId;

    if (isMongooseConnected()) {
      const item = await LostFound.findById(itemId);
      if (!item) {
        res.status(404).json({ error: 'Report not found.' });
        return;
      }
      if (item.createdBy.toString() !== userId && req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized.' });
        return;
      }
      item.status = 'resolved';
      await item.save();
      res.json({ message: 'Marked as resolved.', status: 'resolved' });
    } else {
      const item = inMemoryLostFound.find((i) => i._id === itemId);
      if (!item) {
        res.status(404).json({ error: 'Report not found.' });
        return;
      }
      item.status = 'resolved';
      res.json({ message: 'Marked as resolved.', status: 'resolved' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update report status.' });
  }
});

export default router;
