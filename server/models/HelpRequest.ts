import mongoose, { Schema, Document } from 'mongoose';

export const HELP_CATEGORIES = [
  'Blood donation',
  'Medicine',
  'Food',
  'Emergency assistance',
  'Volunteer help',
  'Financial/community support',
  'Other',
] as const;

export type HelpCategory = typeof HELP_CATEGORIES[number];

export interface IHelpOffer {
  user: mongoose.Types.ObjectId;
  note: string;
  contact?: string;
  createdAt: Date;
}

export interface IHelpRequest extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: HelpCategory;
  createdBy: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  areaName: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  offers: IHelpOffer[];
  createdAt: Date;
  updatedAt: Date;
}

const HelpRequestSchema = new Schema<IHelpRequest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: HELP_CATEGORIES,
      default: 'Emergency assistance',
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
    urgency: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'high',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
      index: true,
    },
    offers: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        note: { type: String, required: true },
        contact: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

HelpRequestSchema.index({ location: '2dsphere' });
HelpRequestSchema.index({ status: 1, urgency: 1 });

export const HelpRequest: mongoose.Model<any> =
  mongoose.models.HelpRequest || mongoose.model<IHelpRequest>('HelpRequest', HelpRequestSchema);
