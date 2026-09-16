import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  isReported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    isReported: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ post: 1, createdAt: 1 });

export const Comment: mongoose.Model<any> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
