import mongoose, { Schema, Document } from 'mongoose';

export const POST_CATEGORIES = [
  'Sports',
  'Help Needed',
  'Announcements',
  'Business',
  'Events',
  'Social Work',
  'Lost & Found',
  'Jobs',
  'Other',
] as const;

export type PostCategory = typeof POST_CATEGORIES[number];

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  images: string[];
  category: PostCategory;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  areaName: string;
  commentsCount: number;
  reactionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    images: [{ type: String }],
    category: {
      type: String,
      enum: POST_CATEGORIES,
      default: 'Announcements',
      index: true,
    },
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
    areaName: { type: String, default: 'My Neighborhood' },
    commentsCount: { type: Number, default: 0 },
    reactionsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ location: '2dsphere' });
PostSchema.index({ createdAt: -1 });

export const Post: mongoose.Model<any> =
  mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
