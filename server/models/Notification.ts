import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'comment'
  | 'reaction'
  | 'event_join'
  | 'help_offer'
  | 'alert'
  | 'business_ad'
  | 'general';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['comment', 'reaction', 'event_join', 'help_offer', 'alert', 'business_ad', 'general'],
      default: 'general',
    },
    message: { type: String, required: true },
    referenceId: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification: mongoose.Model<any> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
