import { Router } from 'express';
import { Post } from '../models/Post.ts';
import { User } from '../models/User.ts';
import { Business } from '../models/Business.ts';
import { Event } from '../models/Event.ts';
import { HelpRequest } from '../models/HelpRequest.ts';
import { LostFound } from '../models/LostFound.ts';
import { isMongooseConnected, inMemoryUsers } from './authController.ts';
import { inMemoryPosts } from './postController.ts';
import { inMemoryBusinesses } from './businessController.ts';
import { inMemoryEvents } from './eventController.ts';
import { inMemoryHelpRequests } from './helpController.ts';
import { inMemoryLostFound } from './lostFoundController.ts';

const router = Router();

// GET /api/search?q=keyword
router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? (req.query.q as string).trim() : '';

    if (!q) {
      res.json({
        query: '',
        posts: [],
        users: [],
        businesses: [],
        events: [],
        helpRequests: [],
        lostFound: [],
        totalCount: 0,
      });
      return;
    }

    const regex = new RegExp(q, 'i');

    if (isMongooseConnected()) {
      const [posts, users, businesses, events, helpRequests, lostFound] = await Promise.all([
        Post.find({ content: regex })
          .populate('author', 'name email profilePhoto role isVerified')
          .limit(10)
          .lean(),
        User.find({
          $or: [{ name: regex }, { email: regex }, { areaName: regex }],
        })
          .select('-passwordHash')
          .limit(10)
          .lean(),
        Business.find({
          $or: [{ businessName: regex }, { description: regex }, { category: regex }],
        })
          .limit(10)
          .lean(),
        Event.find({
          $or: [{ title: regex }, { description: regex }, { category: regex }],
        })
          .populate('organizer', 'name')
          .limit(10)
          .lean(),
        HelpRequest.find({
          $or: [{ title: regex }, { description: regex }, { category: regex }],
          status: { $ne: 'resolved' },
        })
          .limit(10)
          .lean(),
        LostFound.find({
          $or: [{ title: regex }, { description: regex }, { category: regex }],
        })
          .limit(10)
          .lean(),
      ]);

      const totalCount =
        posts.length +
        users.length +
        businesses.length +
        events.length +
        helpRequests.length +
        lostFound.length;

      res.json({
        query: q,
        posts,
        users,
        businesses,
        events,
        helpRequests,
        lostFound,
        totalCount,
      });
    } else {
      const lower = q.toLowerCase();
      const posts = inMemoryPosts
        .filter((p) => p.content.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower))
        .slice(0, 10);
      const users = inMemoryUsers
        .filter((u) => u.name.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower))
        .map(({ passwordHash, ...u }) => u)
        .slice(0, 10);
      const businesses = inMemoryBusinesses
        .filter(
          (b) =>
            b.businessName.toLowerCase().includes(lower) ||
            b.description.toLowerCase().includes(lower) ||
            b.category.toLowerCase().includes(lower)
        )
        .slice(0, 10);
      const events = inMemoryEvents
        .filter((e) => e.title.toLowerCase().includes(lower) || e.description.toLowerCase().includes(lower))
        .slice(0, 10);
      const helpRequests = inMemoryHelpRequests
        .filter(
          (h) =>
            h.title.toLowerCase().includes(lower) ||
            h.description.toLowerCase().includes(lower) ||
            h.category.toLowerCase().includes(lower)
        )
        .slice(0, 10);
      const lostFound = inMemoryLostFound
        .filter((l) => l.title.toLowerCase().includes(lower) || l.description.toLowerCase().includes(lower))
        .slice(0, 10);

      res.json({
        query: q,
        posts,
        users,
        businesses,
        events,
        helpRequests,
        lostFound,
        totalCount:
          posts.length +
          users.length +
          businesses.length +
          events.length +
          helpRequests.length +
          lostFound.length,
      });
    }
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search operation failed.' });
  }
});

export default router;
