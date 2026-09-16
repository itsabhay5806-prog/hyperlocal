import { Router } from 'express';
import mongoose from 'mongoose';
import { Post, POST_CATEGORIES } from '../models/Post.ts';
import { Comment } from '../models/Comment.ts';
import { Reaction } from '../models/Reaction.ts';
import { Notification } from '../models/Notification.ts';
import { User } from '../models/User.ts';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth.ts';
import { isMongooseConnected, inMemoryUsers } from './authController.ts';
import { calculateDistanceKm, formatDistanceString } from '../utils/geo.ts';

const router = Router();

// In-memory collections fallback when MONGODB_URI is not connected yet
export const inMemoryPosts: any[] = [];
export const inMemoryComments: any[] = [];
export const inMemoryReactions: any[] = [];
export const inMemoryNotifications: any[] = [];

// GET /api/posts
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 5;
    const category = req.query.category as string;
    const sortBy = (req.query.sort as string) || 'recent';
    const currentUserId = req.user?.userId;

    if (isMongooseConnected()) {
      const query: any = {};

      if (category && category !== 'all' && category !== 'All Feeds') {
        query.category = category;
      }

      const hasCoords =
        lat !== undefined &&
        lng !== undefined &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        (lat !== 0 || lng !== 0);

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

      let postsQuery = Post.find(query)
        .populate('author', 'name email profilePhoto role isVerified areaName')
        .lean();

      if (!hasCoords || sortBy === 'recent') {
        postsQuery = postsQuery.sort({ createdAt: -1 });
      }

      const rawPosts = await postsQuery.limit(50);

      // Attach distance information and user reaction
      const postIds = rawPosts.map((p) => p._id);
      let userReactionsMap: Record<string, string> = {};

      if (currentUserId) {
        const reactions = await Reaction.find({
          post: { $in: postIds },
          user: new mongoose.Types.ObjectId(currentUserId),
        }).lean();
        reactions.forEach((r) => {
          userReactionsMap[r.post.toString()] = r.type;
        });
      }

      const posts = rawPosts.map((post: any) => {
        let distanceKm: number | null = null;
        let distanceText = '';
        if (hasCoords && post.location?.coordinates) {
          const [pLng, pLat] = post.location.coordinates;
          distanceKm = calculateDistanceKm(lat!, lng!, pLat, pLng);
          distanceText = formatDistanceString(distanceKm);
        }

        return {
          ...post,
          distanceKm,
          distanceText,
          userReaction: userReactionsMap[post._id.toString()] || null,
        };
      });

      res.json({ posts, count: posts.length });
    } else {
      // In-memory fallback
      let filtered = [...inMemoryPosts];

      if (category && category !== 'all' && category !== 'All Feeds') {
        filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }

      const hasCoords =
        lat !== undefined &&
        lng !== undefined &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        (lat !== 0 || lng !== 0);

      if (hasCoords) {
        filtered = filtered
          .map((p) => {
            const [pLng, pLat] = p.location?.coordinates || [0, 0];
            const dist = calculateDistanceKm(lat!, lng!, pLat, pLng);
            return { ...p, distanceKm: dist, distanceText: formatDistanceString(dist) };
          })
          .filter((p) => p.distanceKm <= radiusKm);
      }

      if (sortBy === 'distance' && hasCoords) {
        filtered.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      } else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const posts = filtered.map((post) => {
        let userReaction = null;
        if (currentUserId) {
          const r = inMemoryReactions.find(
            (rx) => rx.post === post._id && rx.user === currentUserId
          );
          if (r) userReaction = r.type;
        }

        const authorObj = inMemoryUsers.find((u) => u._id === post.author);
        return {
          ...post,
          author: authorObj
            ? {
                _id: authorObj._id,
                name: authorObj.name,
                email: authorObj.email,
                profilePhoto: authorObj.profilePhoto,
                role: authorObj.role,
                isVerified: authorObj.isVerified,
                areaName: authorObj.areaName,
              }
            : post.author,
          userReaction,
        };
      });

      res.json({ posts, count: posts.length });
    }
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to retrieve community feed.' });
  }
});

// POST /api/posts - Create real post
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { content, category, images, location, areaName } = req.body;
    const userId = req.user!.userId;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Post content cannot be empty.' });
      return;
    }

    const postCategory =
      category && POST_CATEGORIES.includes(category) ? category : 'Announcements';

    // Get user's coordinates
    let coords: [number, number] = [0, 0];
    let resolvedArea = areaName || 'My Neighborhood';

    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      coords = [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])];
    } else if (isMongooseConnected()) {
      const u = await User.findById(userId);
      if (u && u.location?.coordinates) {
        coords = u.location.coordinates;
        if (u.areaName) resolvedArea = u.areaName;
      }
    } else {
      const u = inMemoryUsers.find((user) => user._id === userId);
      if (u && u.location?.coordinates) {
        coords = u.location.coordinates;
        if (u.areaName) resolvedArea = u.areaName;
      }
    }

    if (isMongooseConnected()) {
      const newPost = await Post.create({
        author: new mongoose.Types.ObjectId(userId),
        content: content.trim(),
        category: postCategory,
        images: Array.isArray(images) ? images : [],
        location: {
          type: 'Point',
          coordinates: coords, // [lng, lat]
        },
        areaName: resolvedArea,
        commentsCount: 0,
        reactionsCount: 0,
      });

      const populatedPost = await Post.findById(newPost._id)
        .populate('author', 'name email profilePhoto role isVerified areaName')
        .lean();

      res.status(201).json({ post: populatedPost });
    } else {
      const authorObj = inMemoryUsers.find((u) => u._id === userId);
      const post = {
        _id: new mongoose.Types.ObjectId().toString(),
        author: authorObj
          ? {
              _id: authorObj._id,
              name: authorObj.name,
              email: authorObj.email,
              profilePhoto: authorObj.profilePhoto,
              role: authorObj.role,
              isVerified: authorObj.isVerified,
              areaName: authorObj.areaName,
            }
          : userId,
        content: content.trim(),
        category: postCategory,
        images: Array.isArray(images) ? images : [],
        location: {
          type: 'Point',
          coordinates: coords,
        },
        areaName: resolvedArea,
        commentsCount: 0,
        reactionsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryPosts.unshift(post);

      res.status(201).json({ post });
    }
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to publish post.' });
  }
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const postId = req.params.id;

    if (isMongooseConnected()) {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400).json({ error: 'Invalid post ID.' });
        return;
      }
      const post = await Post.findById(postId)
        .populate('author', 'name email profilePhoto role isVerified areaName')
        .lean();

      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      const comments = await Comment.find({ post: postId })
        .populate('author', 'name email profilePhoto role isVerified')
        .sort({ createdAt: 1 })
        .lean();

      let userReaction = null;
      if (req.user?.userId) {
        const rx = await Reaction.findOne({
          post: postId,
          user: new mongoose.Types.ObjectId(req.user.userId),
        });
        if (rx) userReaction = rx.type;
      }

      res.json({ post: { ...post, comments, userReaction } });
    } else {
      const post = inMemoryPosts.find((p) => p._id === postId);
      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }
      const comments = inMemoryComments
        .filter((c) => c.post === postId)
        .map((c) => {
          const authorObj = inMemoryUsers.find((u) => u._id === c.author);
          return {
            ...c,
            author: authorObj
              ? {
                  _id: authorObj._id,
                  name: authorObj.name,
                  email: authorObj.email,
                  profilePhoto: authorObj.profilePhoto,
                  isVerified: authorObj.isVerified,
                }
              : c.author,
          };
        });

      let userReaction = null;
      if (req.user?.userId) {
        const rx = inMemoryReactions.find(
          (r) => r.post === postId && r.user === req.user!.userId
        );
        if (rx) userReaction = rx.type;
      }

      res.json({ post: { ...post, comments, userReaction } });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (isMongooseConnected()) {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400).json({ error: 'Invalid post ID.' });
        return;
      }
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      if (post.author.toString() !== userId && role !== 'admin' && role !== 'moderator') {
        res.status(403).json({ error: 'You do not have permission to delete this post.' });
        return;
      }

      await Post.findByIdAndDelete(postId);
      await Comment.deleteMany({ post: postId });
      await Reaction.deleteMany({ post: postId });

      res.json({ message: 'Post and associated comments removed.' });
    } else {
      const index = inMemoryPosts.findIndex((p) => p._id === postId);
      if (index === -1) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }
      const post = inMemoryPosts[index];
      const authorId = typeof post.author === 'object' ? post.author._id : post.author;
      if (authorId !== userId && role !== 'admin' && role !== 'moderator') {
        res.status(403).json({ error: 'You do not have permission to delete this post.' });
        return;
      }

      inMemoryPosts.splice(index, 1);
      // Remove comments and reactions
      for (let i = inMemoryComments.length - 1; i >= 0; i--) {
        if (inMemoryComments[i].post === postId) inMemoryComments.splice(i, 1);
      }
      for (let i = inMemoryReactions.length - 1; i >= 0; i--) {
        if (inMemoryReactions[i].post === postId) inMemoryReactions.splice(i, 1);
      }

      res.json({ message: 'Post and associated comments removed.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;
    const userId = req.user!.userId;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Comment content cannot be empty.' });
      return;
    }

    if (isMongooseConnected()) {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400).json({ error: 'Invalid post ID.' });
        return;
      }
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      const comment = await Comment.create({
        post: new mongoose.Types.ObjectId(postId),
        author: new mongoose.Types.ObjectId(userId),
        content: content.trim(),
      });

      post.commentsCount = (post.commentsCount || 0) + 1;
      await post.save();

      // Create notification for author if commenter is someone else
      if (post.author.toString() !== userId) {
        const commenter = await User.findById(userId);
        await Notification.create({
          recipient: post.author,
          sender: new mongoose.Types.ObjectId(userId),
          type: 'comment',
          message: `${commenter?.name || 'A neighbor'} commented on your post: "${post.content.slice(0, 40)}..."`,
          referenceId: postId,
        });
      }

      const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'name email profilePhoto role isVerified')
        .lean();

      res.status(201).json({ comment: populatedComment, commentsCount: post.commentsCount });
    } else {
      const post = inMemoryPosts.find((p) => p._id === postId);
      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      const authorObj = inMemoryUsers.find((u) => u._id === userId);
      const newComment = {
        _id: new mongoose.Types.ObjectId().toString(),
        post: postId,
        author: authorObj
          ? {
              _id: authorObj._id,
              name: authorObj.name,
              email: authorObj.email,
              profilePhoto: authorObj.profilePhoto,
              isVerified: authorObj.isVerified,
            }
          : userId,
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryComments.push(newComment);
      post.commentsCount = (post.commentsCount || 0) + 1;

      const postAuthorId = typeof post.author === 'object' ? post.author._id : post.author;
      if (postAuthorId !== userId) {
        inMemoryNotifications.unshift({
          _id: new mongoose.Types.ObjectId().toString(),
          recipient: postAuthorId,
          sender: userId,
          type: 'comment',
          message: `${authorObj?.name || 'A neighbor'} commented on your post`,
          referenceId: postId,
          isRead: false,
          createdAt: new Date(),
        });
      }

      res.status(201).json({ comment: newComment, commentsCount: post.commentsCount });
    }
  } catch (error: any) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;

    if (isMongooseConnected()) {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400).json({ error: 'Invalid post ID.' });
        return;
      }
      const comments = await Comment.find({ post: postId })
        .populate('author', 'name email profilePhoto role isVerified')
        .sort({ createdAt: 1 })
        .lean();

      res.json({ comments });
    } else {
      const comments = inMemoryComments
        .filter((c) => c.post === postId)
        .map((c) => {
          const authorObj = inMemoryUsers.find((u) => u._id === c.author || u._id === c.author?._id);
          return {
            ...c,
            author: authorObj
              ? {
                  _id: authorObj._id,
                  name: authorObj.name,
                  email: authorObj.email,
                  profilePhoto: authorObj.profilePhoto,
                  isVerified: authorObj.isVerified,
                }
              : c.author,
          };
        });
      res.json({ comments });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// POST /api/posts/:id/reactions
router.post('/:id/reactions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = req.params.id;
    const { type } = req.body;
    const userId = req.user!.userId;

    const validTypes = ['like', 'love', 'helpful', 'support'];
    const rxType = validTypes.includes(type) ? type : 'like';

    if (isMongooseConnected()) {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        res.status(400).json({ error: 'Invalid post ID.' });
        return;
      }
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      const existingRx = await Reaction.findOne({
        post: new mongoose.Types.ObjectId(postId),
        user: new mongoose.Types.ObjectId(userId),
      });

      let userReaction: string | null = null;

      if (existingRx) {
        if (existingRx.type === rxType) {
          // Toggle off (remove)
          await Reaction.findByIdAndDelete(existingRx._id);
          post.reactionsCount = Math.max(0, (post.reactionsCount || 1) - 1);
          userReaction = null;
        } else {
          // Change type
          existingRx.type = rxType as any;
          await existingRx.save();
          userReaction = rxType;
        }
      } else {
        // Create new reaction
        await Reaction.create({
          post: new mongoose.Types.ObjectId(postId),
          user: new mongoose.Types.ObjectId(userId),
          type: rxType as any,
        });
        post.reactionsCount = (post.reactionsCount || 0) + 1;
        userReaction = rxType;

        if (post.author.toString() !== userId) {
          const reactor = await User.findById(userId);
          await Notification.create({
            recipient: post.author,
            sender: new mongoose.Types.ObjectId(userId),
            type: 'reaction',
            message: `${reactor?.name || 'A neighbor'} reacted with ${rxType} to your post.`,
            referenceId: postId,
          });
        }
      }

      await post.save();
      res.json({ reactionsCount: post.reactionsCount, userReaction });
    } else {
      const post = inMemoryPosts.find((p) => p._id === postId);
      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      const existingIndex = inMemoryReactions.findIndex(
        (r) => r.post === postId && r.user === userId
      );

      let userReaction: string | null = null;

      if (existingIndex > -1) {
        if (inMemoryReactions[existingIndex].type === rxType) {
          inMemoryReactions.splice(existingIndex, 1);
          post.reactionsCount = Math.max(0, (post.reactionsCount || 1) - 1);
          userReaction = null;
        } else {
          inMemoryReactions[existingIndex].type = rxType;
          userReaction = rxType;
        }
      } else {
        inMemoryReactions.push({
          _id: new mongoose.Types.ObjectId().toString(),
          post: postId,
          user: userId,
          type: rxType,
          createdAt: new Date(),
        });
        post.reactionsCount = (post.reactionsCount || 0) + 1;
        userReaction = rxType;

        const postAuthorId = typeof post.author === 'object' ? post.author._id : post.author;
        if (postAuthorId !== userId) {
          const reactor = inMemoryUsers.find((u) => u._id === userId);
          inMemoryNotifications.unshift({
            _id: new mongoose.Types.ObjectId().toString(),
            recipient: postAuthorId,
            sender: userId,
            type: 'reaction',
            message: `${reactor?.name || 'A neighbor'} reacted to your post`,
            referenceId: postId,
            isRead: false,
            createdAt: new Date(),
          });
        }
      }

      res.json({ reactionsCount: post.reactionsCount, userReaction });
    }
  } catch (error: any) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Failed to update reaction.' });
  }
});

export default router;
