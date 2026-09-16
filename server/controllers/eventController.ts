import { Router } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event.ts';
import { Notification } from '../models/Notification.ts';
import { User } from '../models/User.ts';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { isMongooseConnected, inMemoryUsers } from './authController.ts';
import { calculateDistanceKm, formatDistanceString } from '../utils/geo.ts';
import { inMemoryNotifications } from './postController.ts';

const router = Router();
export const inMemoryEvents: any[] = [];

// GET /api/events
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 10;
    const currentUserId = req.user?.userId;

    const hasCoords =
      lat !== undefined &&
      lng !== undefined &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      (lat !== 0 || lng !== 0);

    if (isMongooseConnected()) {
      const query: any = {};
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

      const raw = await Event.find(query)
        .populate('organizer', 'name email profilePhoto isVerified')
        .populate('participants', 'name email')
        .sort({ date: 1 })
        .limit(30)
        .lean();

      const events = raw.map((ev: any) => {
        let distanceKm: number | null = null;
        let distanceText = '';
        if (hasCoords && ev.location?.coordinates) {
          const [eLng, eLat] = ev.location.coordinates;
          distanceKm = calculateDistanceKm(lat!, lng!, eLat, eLng);
          distanceText = formatDistanceString(distanceKm);
        }

        const isUserJoined = currentUserId
          ? ev.participants.some(
              (p: any) => (p._id ? p._id.toString() : p.toString()) === currentUserId
            )
          : false;

        return {
          ...ev,
          distanceKm,
          distanceText,
          isUserJoined,
          participantsCount: ev.participants?.length || 0,
        };
      });

      res.json({ events, count: events.length });
    } else {
      let filtered = [...inMemoryEvents];

      if (hasCoords) {
        filtered = filtered
          .map((ev) => {
            const [eLng, eLat] = ev.location?.coordinates || [0, 0];
            const dist = calculateDistanceKm(lat!, lng!, eLat, eLng);
            return { ...ev, distanceKm: dist, distanceText: formatDistanceString(dist) };
          })
          .filter((ev) => ev.distanceKm <= radiusKm);
      }

      const events = filtered.map((ev) => {
        const isUserJoined = currentUserId
          ? ev.participants?.some((p: any) => (p._id || p) === currentUserId)
          : false;

        const organizerObj = inMemoryUsers.find(
          (u) => u._id === (ev.organizer?._id || ev.organizer)
        );

        return {
          ...ev,
          organizer: organizerObj || ev.organizer,
          isUserJoined,
          participantsCount: ev.participants?.length || 0,
        };
      });

      res.json({ events, count: events.length });
    }
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to retrieve community events.' });
  }
});

// POST /api/events
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, category, location, areaName, date, startTime, endTime, maxParticipants } = req.body;
    const userId = req.user!.userId;

    if (!title || !description || !date || !startTime) {
      res.status(400).json({ error: 'Title, description, date, and start time are required.' });
      return;
    }

    let coords: [number, number] = [0, 0];
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      coords = [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])];
    }

    if (isMongooseConnected()) {
      const event = await Event.create({
        title: title.trim(),
        description: description.trim(),
        category: category || 'Community',
        organizer: new mongoose.Types.ObjectId(userId),
        location: {
          type: 'Point',
          coordinates: coords,
        },
        areaName: areaName || 'My Neighborhood',
        date,
        startTime,
        endTime: endTime || '',
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 0,
        participants: [new mongoose.Types.ObjectId(userId)], // Organizer auto-joins
      });

      const populated = await Event.findById(event._id)
        .populate('organizer', 'name email profilePhoto isVerified')
        .lean();

      res.status(201).json({ event: populated });
    } else {
      const organizerObj = inMemoryUsers.find((u) => u._id === userId);
      const ev = {
        _id: new mongoose.Types.ObjectId().toString(),
        title: title.trim(),
        description: description.trim(),
        category: category || 'Community',
        organizer: organizerObj || userId,
        location: {
          type: 'Point',
          coordinates: coords,
        },
        areaName: areaName || 'My Neighborhood',
        date,
        startTime,
        endTime: endTime || '',
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 0,
        participants: [userId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryEvents.unshift(ev);
      res.status(201).json({ event: ev });
    }
  } catch (error: any) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

// POST /api/events/:id/join
router.post('/:id/join', requireAuth, async (req: AuthRequest, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user!.userId;

    if (isMongooseConnected()) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400).json({ error: 'Invalid event ID.' });
        return;
      }

      const event = await Event.findById(eventId);
      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const index = event.participants.findIndex(
        (p: any) => p.toString() === userId
      );

      let joined = false;
      if (index > -1) {
        // Leave event
        event.participants.splice(index, 1);
        joined = false;
      } else {
        // Check capacity
        if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
          res.status(400).json({ error: 'This event has reached full capacity.' });
          return;
        }
        event.participants.push(userObjectId);
        joined = true;

        // Notify organizer if joiner != organizer
        if (event.organizer.toString() !== userId) {
          const user = await User.findById(userId);
          await Notification.create({
            recipient: event.organizer,
            sender: userObjectId,
            type: 'event_join',
            message: `${user?.name || 'A neighbor'} RSVP'd to your event: "${event.title}"`,
            referenceId: eventId,
          });
        }
      }

      await event.save();
      res.json({ joined, participantsCount: event.participants.length });
    } else {
      const event = inMemoryEvents.find((e) => e._id === eventId);
      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      const idx = event.participants.findIndex((p: any) => (p._id || p) === userId);
      let joined = false;
      if (idx > -1) {
        event.participants.splice(idx, 1);
        joined = false;
      } else {
        if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
          res.status(400).json({ error: 'This event has reached full capacity.' });
          return;
        }
        event.participants.push(userId);
        joined = true;

        const organizerId = event.organizer?._id || event.organizer;
        if (organizerId !== userId) {
          const user = inMemoryUsers.find((u) => u._id === userId);
          inMemoryNotifications.unshift({
            _id: new mongoose.Types.ObjectId().toString(),
            recipient: organizerId,
            sender: userId,
            type: 'event_join',
            message: `${user?.name || 'A neighbor'} RSVP'd to your event "${event.title}"`,
            referenceId: eventId,
            isRead: false,
            createdAt: new Date(),
          });
        }
      }

      res.json({ joined, participantsCount: event.participants.length });
    }
  } catch (error: any) {
    console.error('Join event error:', error);
    res.status(500).json({ error: 'Failed to update RSVP status.' });
  }
});

export default router;
