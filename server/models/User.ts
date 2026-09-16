import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  profilePhoto?: string;
  role: 'user' | 'business' | 'moderator' | 'admin';
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  areaName?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profilePhoto: { type: String, default: '' },
    role: { type: String, enum: ['user', 'business', 'moderator', 'admin'], default: 'user' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    areaName: { type: String, default: 'Neighborhood' },
    isVerified: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ location: '2dsphere' });

export const User: mongoose.Model<any> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
