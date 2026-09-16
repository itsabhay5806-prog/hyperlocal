import { Router } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { isMongooseConnected } from './authController.ts';
import { inMemoryNotifications } from './postController.ts';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    if (isMongooseConnected()) {
      const notifications = await Notification.find({
        recipient: new mongoose.Types.ObjectId(userId),
      })
        .populate('sender', 'name email profilePhoto')
        .sort({ createdAt: -1 })
        .limit(40)
        .lean();

      const unreadCount = await Notification.countDocuments({
        recipient: new mongoose.Types.ObjectId(userId),
        isRead: false,
      });

      res.json({ notifications, unreadCount });
    } else {
      const userNotifs = inMemoryNotifications.filter(
        (n) => (n.recipient?._id || n.recipient) === userId
      );
      const unreadCount = userNotifs.filter((n) => !n.isRead).length;
      res.json({ notifications: userNotifs, unreadCount });
    }
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const notifId = req.params.id;
    const userId = req.user!.userId;

    if (isMongooseConnected()) {
      const notif = await Notification.findOneAndUpdate(
        { _id: notifId, recipient: new mongoose.Types.ObjectId(userId) },
        { isRead: true },
        { new: true }
      );
      res.json({ notification: notif });
    } else {
      const notif = inMemoryNotifications.find(
        (n) => n._id === notifId && (n.recipient?._id || n.recipient) === userId
      );
      if (notif) notif.isRead = true;
      res.json({ notification: notif });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    if (isMongooseConnected()) {
      await Notification.updateMany(
        { recipient: new mongoose.Types.ObjectId(userId), isRead: false },
        { isRead: true }
      );
      res.json({ message: 'All notifications marked as read.' });
    } else {
      inMemoryNotifications.forEach((n) => {
        if ((n.recipient?._id || n.recipient) === userId) {
          n.isRead = true;
        }
      });
      res.json({ message: 'All notifications marked as read.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

export default router;
