import mongoose, { Schema, Document } from 'mongoose';

export const LOST_FOUND_CATEGORIES = [
  'Lost item',
  'Found item',
  'Lost pet',
  'Found pet',
  'Documents',
  'Other',
] as const;

export type LostFoundCategory = typeof LOST_FOUND_CATEGORIES[number];

export interface ILostFound extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: LostFoundCategory;
  images: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  areaName: string;
  createdBy: mongoose.Types.ObjectId;
  status: 'active' | 'resolved';
  contactInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LostFoundSchema = new Schema<ILostFound>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: LOST_FOUND_CATEGORIES,
      required: true,
      index: true,
    },
    images: [{ type: String }],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    areaName: { type: String, default: 'Neighborhood' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
      index: true,
    },
    contactInfo: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

LostFoundSchema.index({ location: '2dsphere' });

export const LostFound: mongoose.Model<any> =
  mongoose.models.LostFound || mongoose.model<ILostFound>('LostFound', LostFoundSchema);
