import mongoose, { Schema, Document } from 'mongoose';

export type AlertType =
  | 'Rain'
  | 'Thunderstorm'
  | 'Earthquake'
  | 'Heatwave'
  | 'Flood'
  | 'Local emergency'
  | 'Important community announcement';

export interface IAlert extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: AlertType;
  severity: 'advisory' | 'warning' | 'emergency';
  source: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  areaName: string;
  isActive: boolean;
  emergencyProtocol?: string;
  helpline?: string;
  expiresAt?: Date;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'Rain',
        'Thunderstorm',
        'Earthquake',
        'Heatwave',
        'Flood',
        'Local emergency',
        'Important community announcement',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['advisory', 'warning', 'emergency'],
      default: 'advisory',
    },
    source: { type: String, default: 'Civic Authority' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    areaName: { type: String, default: 'All Neighborhoods' },
    isActive: { type: Boolean, default: true, index: true },
    emergencyProtocol: { type: String, default: '' },
    helpline: { type: String, default: '' },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

AlertSchema.index({ location: '2dsphere' });

export const Alert: mongoose.Model<any> =
  mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
