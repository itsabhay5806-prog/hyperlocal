import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.ts';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.ts';
import mongoose from 'mongoose';

const router = Router();

// In-memory store fallback when MongoDB Atlas URI is not yet connected
export const inMemoryUsers: any[] = [];

export function isMongooseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, profilePhoto, role } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMongooseConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        profilePhoto: profilePhoto || '',
        role: role === 'business' ? 'business' : 'user',
        isVerified: true,
      });

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          areaName: user.areaName,
          profilePhoto: user.profilePhoto,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    } else {
      // In-memory fallback
      const exists = inMemoryUsers.find((u) => u.email === normalizedEmail);
      if (exists) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        profilePhoto: profilePhoto || '',
        role: role === 'business' ? 'business' : 'user',
        location: { type: 'Point', coordinates: [0, 0] },
        areaName: 'Neighborhood',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryUsers.push(newUser);

      const token = generateToken({
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      });

      res.status(201).json({
        token,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          location: newUser.location,
          areaName: newUser.areaName,
          profilePhoto: newUser.profilePhoto,
          isVerified: newUser.isVerified,
          createdAt: newUser.createdAt,
        },
        notice: 'Registered in active session. Configure MONGODB_URI to persist to MongoDB Atlas.',
      });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMongooseConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      user.lastActiveAt = new Date();
      await user.save();

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          areaName: user.areaName,
          profilePhoto: user.profilePhoto,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    } else {
      // In-memory fallback
      const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }
      user.lastActiveAt = new Date();

      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          areaName: user.areaName,
          profilePhoto: user.profilePhoto,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    if (isMongooseConnected()) {
      const user = await User.findById(userId).select('-passwordHash');
      if (!user) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }
      res.json({ user });
    } else {
      const user = inMemoryUsers.find((u) => u._id === userId);
      if (!user) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }
      const { passwordHash, ...safeUser } = user;
      res.json({ user: safeUser });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve current user session.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

export default router;
