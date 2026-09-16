import React, { useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Heart,
  HelpCircle,
  Share2,
  Trash2,
  MapPin,
  ShieldCheck,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Post, Comment } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PostCardProps {
  post: Post;
  onPostDeleted: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const [reactionsCount, setReactionsCount] = useState(post.reactionsCount || 0);
  const [userReaction, setUserReaction] = useState<string | null>(post.userReaction || null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const authorId = post.author?._id || (post.author as any);
  const isAuthor = user && user._id === authorId;
  const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');

  const handleToggleReaction = async (type: string = 'like') => {
    setReactionMenuOpen(false);
    try {
      const res = await api.toggleReaction(post._id, type);
      setReactionsCount(res.reactionsCount);
      setUserReaction(res.userReaction);
    } catch (e) {
      console.error('Failed to toggle reaction:', e);
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      setShowComments(true);
      if (comments.length === 0) {
        setLoadingComments(true);
        try {
          const res = await api.getComments(post._id);
          setComments(res.comments || []);
        } catch (e) {
          console.error('Failed to load comments:', e);
        } finally {
          setLoadingComments(false);
        }
      }
    } else {
      setShowComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment(post._id, newCommentText.trim());
      setComments((prev) => [...prev, res.comment]);
      setCommentsCount(res.commentsCount);
      setNewCommentText('');
    } catch (e) {
      console.error('Failed to submit comment:', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this community post?')) return;
    setIsDeleting(true);
    try {
      await api.deletePost(post._id);
      onPostDeleted(post._id);
    } catch (e) {
      console.error('Failed to delete post:', e);
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const timeString = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="bg-white rounded-2xl border border-gray-200 card-shadow p-5 space-y-4 elevation-hover">
      {/* Author & Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-emerald-200">
            {post.author?.profilePhoto ? (
              <img
                src={post.author.profilePhoto}
                alt={post.author.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{post.author?.name?.slice(0, 2).toUpperCase() || 'HL'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-gray-900">{post.author?.name || 'Neighbor'}</h3>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="font-medium text-gray-600">{post.areaName}</span>
              {post.distanceText && (
                <>
                  <span>•</span>
                  <span className="text-[#005D42] font-semibold">{post.distanceText}</span>
                </>
              )}
              <span>•</span>
              <span>{timeString}</span>
            </div>
          </div>
        </div>

        {/* Category Badge and Delete button */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#005D42] border border-emerald-100">
            {post.category}
          </span>
          {(isAuthor || isAdmin) && (
            <button
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{post.content}</p>

      {/* Attached Images */}
      {post.images && post.images.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
          <img
            src={post.images[0]}
            alt="Community post attachment"
            className="w-full max-h-96 object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Engagement Stats and Actions */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 relative">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Reaction Button with Popover */}
          <div className="relative">
            <button
              onClick={() => handleToggleReaction(userReaction || 'like')}
              onMouseEnter={() => setReactionMenuOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
                userReaction
                  ? 'bg-emerald-50 text-[#005D42]'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {userReaction === 'love' ? (
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              ) : (
                <ThumbsUp
                  className={`w-4 h-4 ${
                    userReaction ? 'fill-[#005D42] text-[#005D42]' : 'text-gray-500'
                  }`}
                />
              )}
              <span>{reactionsCount > 0 ? reactionsCount : 'React'}</span>
            </button>

            {/* Hover reaction bar */}
            {reactionMenuOpen && (
              <div
                onMouseLeave={() => setReactionMenuOpen(false)}
                className="absolute bottom-full left-0 mb-1 flex items-center gap-1 bg-white p-1 rounded-full shadow-lg border border-gray-200 z-20 animate-in fade-in zoom-in-95"
              >
                {[
                  { type: 'like', icon: ThumbsUp, label: 'Like', color: 'text-blue-600' },
                  { type: 'love', icon: Heart, label: 'Love', color: 'text-red-500 fill-red-500' },
                  { type: 'helpful', icon: Sparkles, label: 'Helpful', color: 'text-amber-500' },
                  { type: 'support', icon: ShieldCheck, label: 'Support', color: 'text-emerald-600' },
                ].map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleToggleReaction(r.type)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition hover:scale-125"
                    title={r.label}
                  >
                    <r.icon className={`w-4 h-4 ${r.color}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment Button */}
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold hover:bg-gray-100 text-gray-700 transition"
          >
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span>{commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold hover:bg-gray-100 text-gray-600 transition"
        >
          <Share2 className="w-4 h-4" />
          <span>{copiedNotification ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="pt-3 border-t border-gray-100 space-y-3">
          {/* New Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a helpful neighbor comment..."
              className="flex-1 px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20 focus:border-[#005D42] transition"
            />
            <button
              type="submit"
              disabled={submittingComment || !newCommentText.trim()}
              className="bg-[#005D42] hover:bg-[#047857] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center"
            >
              {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="py-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin text-[#005D42] mx-auto" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center py-2 text-xs text-gray-400">
              No comments yet. Start the conversation!
            </p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c._id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 font-bold text-gray-900">
                      <span>{c.author?.name || 'Neighbor'}</span>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-400 text-[10px]">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
