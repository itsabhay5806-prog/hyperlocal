import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  organizer: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  areaName: string;
  date: string;
  startTime: string;
  endTime?: string;
  maxParticipants?: number;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: 'Community', trim: true },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
    areaName: { type: String, default: 'Central Area' },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, default: '' },
    maxParticipants: { type: Number, default: 0 },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ location: '2dsphere' });
EventSchema.index({ date: 1 });

export const Event: mongoose.Model<any> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
