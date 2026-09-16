import { Router } from 'express';
import mongoose from 'mongoose';
import { Business } from '../models/Business.ts';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { isMongooseConnected, inMemoryUsers } from './authController.ts';
import { calculateDistanceKm, formatDistanceString } from '../utils/geo.ts';

const router = Router();
export const inMemoryBusinesses: any[] = [];

// GET /api/businesses
router.get('/', optionalAuth, async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 5;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const hasCoords =
      lat !== undefined &&
      lng !== undefined &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      (lat !== 0 || lng !== 0);

    if (isMongooseConnected()) {
      const query: any = {};
      if (category && category !== 'all') {
        query.category = category;
      }
      if (search && search.trim()) {
        query.$or = [
          { businessName: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
          { category: { $regex: search.trim(), $options: 'i' } },
        ];
      }
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

      const raw = await Business.find(query).populate('owner', 'name email').limit(40).lean();

      const businesses = raw.map((b: any) => {
        let distanceKm: number | null = null;
        let distanceText = '';
        if (hasCoords && b.location?.coordinates) {
          const [bLng, bLat] = b.location.coordinates;
          distanceKm = calculateDistanceKm(lat!, lng!, bLat, bLng);
          distanceText = formatDistanceString(distanceKm);
        }
        return { ...b, distanceKm, distanceText };
      });

      res.json({ businesses, count: businesses.length });
    } else {
      let filtered = [...inMemoryBusinesses];
      if (category && category !== 'all') {
        filtered = filtered.filter((b) => b.category.toLowerCase() === category.toLowerCase());
      }
      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        filtered = filtered.filter(
          (b) =>
            b.businessName.toLowerCase().includes(s) ||
            b.description.toLowerCase().includes(s) ||
            b.category.toLowerCase().includes(s)
        );
      }
      if (hasCoords) {
        filtered = filtered
          .map((b) => {
            const [bLng, bLat] = b.location?.coordinates || [0, 0];
            const dist = calculateDistanceKm(lat!, lng!, bLat, bLng);
            return { ...b, distanceKm: dist, distanceText: formatDistanceString(dist) };
          })
          .filter((b) => b.distanceKm <= radiusKm);
      }
      res.json({ businesses: filtered, count: filtered.length });
    }
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Failed to retrieve local businesses.' });
  }
});

// POST /api/businesses
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { businessName, category, description, phone, email, website, address, location, images, openingHours } = req.body;
    const userId = req.user!.userId;

    if (!businessName || !category || !description || !phone || !address) {
      res.status(400).json({ error: 'Please provide business name, category, description, phone, and address.' });
      return;
    }

    let coords: [number, number] = [0, 0];
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      coords = [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])];
    }

    if (isMongooseConnected()) {
      const biz = await Business.create({
        businessName: businessName.trim(),
        owner: new mongoose.Types.ObjectId(userId),
        category: category.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        website: website ? website.trim() : '',
        address: address.trim(),
        location: {
          type: 'Point',
          coordinates: coords,
        },
        images: Array.isArray(images) ? images : [],
        openingHours: openingHours || '9:00 AM - 8:00 PM',
        isVerified: true,
      });

      res.status(201).json({ business: biz });
    } else {
      const ownerObj = inMemoryUsers.find((u) => u._id === userId);
      const biz = {
        _id: new mongoose.Types.ObjectId().toString(),
        businessName: businessName.trim(),
        owner: ownerObj || userId,
        category: category.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        website: website ? website.trim() : '',
        address: address.trim(),
        location: {
          type: 'Point',
          coordinates: coords,
        },
        images: Array.isArray(images) ? images : [],
        openingHours: openingHours || '9:00 AM - 8:00 PM',
        isVerified: true,
        rating: 5.0,
        reviewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryBusinesses.unshift(biz);
      res.status(201).json({ business: biz });
    }
  } catch (error: any) {
    console.error('Create business error:', error);
    res.status(500).json({ error: 'Failed to create business listing.' });
  }
});

export default router;
