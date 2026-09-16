import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  _id: mongoose.Types.ObjectId;
  businessName: string;
  owner: mongoose.Types.ObjectId;
  category: string;
  description: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  images: string[];
  openingHours: string;
  isVerified: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    businessName: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    address: { type: String, required: true, trim: true },
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
    images: [{ type: String }],
    openingHours: { type: String, default: '9:00 AM - 8:00 PM' },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

BusinessSchema.index({ location: '2dsphere' });
BusinessSchema.index({ businessName: 'text', description: 'text', category: 'text' });

export const Business: mongoose.Model<any> =
  mongoose.models.Business || mongoose.model<IBusiness>('Business', BusinessSchema);
