import React, { useState } from 'react';
import { X, Image as ImageIcon, MapPin, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Post } from '../types/index.ts';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

const CATEGORIES = [
  'Announcements',
  'Help Needed',
  'Sports & Play',
  'Events',
  'Local Shops',
  'Lost & Found',
  'Recommendations',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user, userCoords, userArea } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Announcements');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large. Please select an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write some content for your post.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        content: content.trim(),
        category,
        images: imageUrl ? [imageUrl] : [],
        areaName: userArea || user?.areaName || 'My Neighborhood',
      };

      if (userCoords) {
        payload.location = {
          type: 'Point',
          coordinates: [userCoords.lng, userCoords.lat],
        };
      }

      const res = await api.createPost(payload);
      onPostCreated(res.post);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#005D42] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-headline">Create Neighborhood Post</h2>
              <p className="text-[11px] text-gray-500">Visible to neighbors within your active radius</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    category === cat
                      ? 'bg-[#005D42] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Message</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in our neighborhood? Share announcements, organize a game, or ask a question..."
              className="w-full p-3.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20 focus:border-[#005D42] transition"
            />
          </div>

          {/* Image URL or Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Add Photo (Optional)
            </label>
            <div className="space-y-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL (https://...)"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition">
                  <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span>Upload local image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
            {imageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 max-h-36">
                <img src={imageUrl} alt="Preview" className="w-full h-36 object-cover" />
              </div>
            )}
          </div>

          {/* Location Anchor Note */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
            <MapPin className="w-4 h-4 text-[#005D42] shrink-0" />
            <span className="truncate">
              Anchored to: <strong>{userArea}</strong>
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-[#005D42] hover:bg-[#047857] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Post</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
