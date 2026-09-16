import mongoose, { Schema, Document } from 'mongoose';

export type ReactionType = 'like' | 'love' | 'helpful' | 'support';

export interface IReaction extends Document {
  _id: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['like', 'love', 'helpful', 'support'],
      default: 'like',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index to prevent duplicate reactions from the same user on the same post
ReactionSchema.index({ post: 1, user: 1 }, { unique: true });

export const Reaction: mongoose.Model<any> =
  mongoose.models.Reaction || mongoose.model<IReaction>('Reaction', ReactionSchema);
