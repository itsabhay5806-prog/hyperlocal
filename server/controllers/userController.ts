import { Router } from 'express';
import { User } from '../models/User.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { isMongooseConnected, inMemoryUsers } from './authController.ts';

const router = Router();

// PUT /api/users/location
router.put('/location', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude, areaName } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({
        error: 'Invalid geographical coordinates. Latitude must be -90..90 and Longitude must be -180..180.',
      });
      return;
    }

    const userId = req.user!.userId;
    const cleanAreaName = (areaName && areaName.trim()) || 'My Neighborhood';

    if (isMongooseConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      user.location = {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON order: [longitude, latitude]
      };
      user.areaName = cleanAreaName;
      user.lastActiveAt = new Date();
      await user.save();

      res.json({
        message: 'Location updated successfully.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          areaName: user.areaName,
          profilePhoto: user.profilePhoto,
          isVerified: user.isVerified,
        },
      });
    } else {
      const user = inMemoryUsers.find((u) => u._id === userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      user.location = {
        type: 'Point',
        coordinates: [lng, lat],
      };
      user.areaName = cleanAreaName;
      user.lastActiveAt = new Date();

      const { passwordHash, ...safeUser } = user;
      res.json({
        message: 'Location updated successfully.',
        user: safeUser,
      });
    }
  } catch (error: any) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update user location.' });
  }
});

// GET /api/users/profile
router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    if (isMongooseConnected()) {
      const user = await User.findById(userId).select('-passwordHash');
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json({ user });
    } else {
      const user = inMemoryUsers.find((u) => u._id === userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      const { passwordHash, ...safeUser } = user;
      res.json({ user: safeUser });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

export default router;
