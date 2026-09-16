import { Router } from 'express';
import mongoose from 'mongoose';
import { HelpRequest, HELP_CATEGORIES } from '../models/HelpRequest.ts';
import { Notification } from '../models/Notification.ts';
import { User } from '../models/User.ts';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { isMongooseConnected, inMemoryUsers } from './authController.ts';
import { calculateDistanceKm, formatDistanceString } from '../utils/geo.ts';
import { inMemoryNotifications } from './postController.ts';

const router = Router();
export const inMemoryHelpRequests: any[] = [];

// GET /api/help
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 10;
    const urgency = req.query.urgency as string;
    const status = req.query.status as string;

    const hasCoords =
      lat !== undefined &&
      lng !== undefined &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      (lat !== 0 || lng !== 0);

    if (isMongooseConnected()) {
      const query: any = {};
      if (urgency && urgency !== 'all') query.urgency = urgency;
      if (status && status !== 'all') query.status = status;
      else query.status = { $ne: 'resolved' }; // Default to active

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

      const raw = await HelpRequest.find(query)
        .populate('createdBy', 'name email profilePhoto isVerified areaName')
        .populate('offers.user', 'name email')
        .limit(30)
        .lean();

      const requests = raw.map((hr: any) => {
        let distanceKm: number | null = null;
        let distanceText = '';
        if (hasCoords && hr.location?.coordinates) {
          const [hLng, hLat] = hr.location.coordinates;
          distanceKm = calculateDistanceKm(lat!, lng!, hLat, hLng);
          distanceText = formatDistanceString(distanceKm);
        }
        return {
          ...hr,
          distanceKm,
          distanceText,
          offersCount: hr.offers?.length || 0,
        };
      });

      res.json({ requests, count: requests.length });
    } else {
      let filtered = [...inMemoryHelpRequests];
      if (urgency && urgency !== 'all') {
        filtered = filtered.filter((h) => h.urgency === urgency);
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((h) => h.status === status);
      } else {
        filtered = filtered.filter((h) => h.status !== 'resolved');
      }

      if (hasCoords) {
        filtered = filtered
          .map((hr) => {
            const [hLng, hLat] = hr.location?.coordinates || [0, 0];
            const dist = calculateDistanceKm(lat!, lng!, hLat, hLng);
            return { ...hr, distanceKm: dist, distanceText: formatDistanceString(dist) };
          })
          .filter((hr) => hr.distanceKm <= radiusKm);
      }

      const requests = filtered.map((hr) => {
        const creator = inMemoryUsers.find(
          (u) => u._id === (hr.createdBy?._id || hr.createdBy)
        );
        return {
          ...hr,
          createdBy: creator || hr.createdBy,
          offersCount: hr.offers?.length || 0,
        };
      });

      res.json({ requests, count: requests.length });
    }
  } catch (error: any) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({ error: 'Failed to retrieve help requests.' });
  }
});

// POST /api/help
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, category, urgency, location, areaName } = req.body;
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
      const hr = await HelpRequest.create({
        title: title.trim(),
        description: description.trim(),
        category,
        createdBy: new mongoose.Types.ObjectId(userId),
        location: {
          type: 'Point',
          coordinates: coords,
        },
        areaName: areaName || 'My Neighborhood',
        urgency: urgency || 'high',
        status: 'open',
        offers: [],
      });

      const populated = await HelpRequest.findById(hr._id)
        .populate('createdBy', 'name email profilePhoto isVerified areaName')
        .lean();

      res.status(201).json({ request: populated });
    } else {
      const creator = inMemoryUsers.find((u) => u._id === userId);
      const hr = {
        _id: new mongoose.Types.ObjectId().toString(),
        title: title.trim(),
        description: description.trim(),
        category,
        createdBy: creator || userId,
        location: {
          type: 'Point',
          coordinates: coords,
        },
        areaName: areaName || 'My Neighborhood',
        urgency: urgency || 'high',
        status: 'open',
        offers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryHelpRequests.unshift(hr);
      res.status(201).json({ request: hr });
    }
  } catch (error: any) {
    console.error('Create help request error:', error);
    res.status(500).json({ error: 'Failed to submit help request.' });
  }
});

// POST /api/help/:id/offers
router.post('/:id/offers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const requestId = req.params.id;
    const { note, contact } = req.body;
    const userId = req.user!.userId;

    if (!note || !note.trim()) {
      res.status(400).json({ error: 'Please include a note explaining how you can help.' });
      return;
    }

    if (isMongooseConnected()) {
      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        res.status(400).json({ error: 'Invalid request ID.' });
        return;
      }
      const hr = await HelpRequest.findById(requestId);
      if (!hr) {
        res.status(404).json({ error: 'Help request not found.' });
        return;
      }

      const offer = {
        user: new mongoose.Types.ObjectId(userId),
        note: note.trim(),
        contact: contact ? contact.trim() : '',
        createdAt: new Date(),
      };

      hr.offers.push(offer as any);
      if (hr.status === 'open') {
        hr.status = 'in_progress';
      }
      await hr.save();

      // Notify creator
      if (hr.createdBy.toString() !== userId) {
        const helper = await User.findById(userId);
        await Notification.create({
          recipient: hr.createdBy,
          sender: new mongoose.Types.ObjectId(userId),
          type: 'help_offer',
          message: `${helper?.name || 'A neighbor'} offered help on your request: "${hr.title}"`,
          referenceId: requestId,
        });
      }

      res.status(201).json({ message: 'Offer submitted successfully!', offersCount: hr.offers.length });
    } else {
      const hr = inMemoryHelpRequests.find((h) => h._id === requestId);
      if (!hr) {
        res.status(404).json({ error: 'Help request not found.' });
        return;
      }

      const helper = inMemoryUsers.find((u) => u._id === userId);
      hr.offers.push({
        user: helper || userId,
        note: note.trim(),
        contact: contact ? contact.trim() : '',
        createdAt: new Date(),
      });
      if (hr.status === 'open') hr.status = 'in_progress';

      const creatorId = hr.createdBy?._id || hr.createdBy;
      if (creatorId !== userId) {
        inMemoryNotifications.unshift({
          _id: new mongoose.Types.ObjectId().toString(),
          recipient: creatorId,
          sender: userId,
          type: 'help_offer',
          message: `${helper?.name || 'A neighbor'} offered help on your request: "${hr.title}"`,
          referenceId: requestId,
          isRead: false,
          createdAt: new Date(),
        });
      }

      res.status(201).json({ message: 'Offer submitted successfully!', offersCount: hr.offers.length });
    }
  } catch (error: any) {
    console.error('Submit help offer error:', error);
    res.status(500).json({ error: 'Failed to submit help offer.' });
  }
});

// PATCH /api/help/:id/status
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body;
    const userId = req.user!.userId;

    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }

    if (isMongooseConnected()) {
      const hr = await HelpRequest.findById(requestId);
      if (!hr) {
        res.status(404).json({ error: 'Help request not found.' });
        return;
      }
      if (hr.createdBy.toString() !== userId && req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Only the creator can change the request status.' });
        return;
      }
      hr.status = status as any;
      await hr.save();
      res.json({ status: hr.status });
    } else {
      const hr = inMemoryHelpRequests.find((h) => h._id === requestId);
      if (!hr) {
        res.status(404).json({ error: 'Help request not found.' });
        return;
      }
      const creatorId = hr.createdBy?._id || hr.createdBy;
      if (creatorId !== userId && req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Only the creator can change the request status.' });
        return;
      }
      hr.status = status;
      res.json({ status: hr.status });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update request status.' });
  }
});

export default router;
