import React, { useState } from 'react';
import { X, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { LostFoundItem } from '../types/index.ts';

interface CreateLostFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: (item: LostFoundItem) => void;
}

export const CreateLostFoundModal: React.FC<CreateLostFoundModalProps> = ({
  isOpen,
  onClose,
  onItemCreated,
}) => {
  const { userCoords, userArea } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'lost' | 'found'>('lost');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        contactInfo: contactInfo.trim(),
        areaName: userArea,
      };

      if (userCoords) {
        payload.location = {
          type: 'Point',
          coordinates: [userCoords.lng, userCoords.lat],
        };
      }

      const res = await api.createLostFound(payload);
      onItemCreated(res.item);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-headline">Report Lost or Found Item</h2>
              <p className="text-[11px] text-gray-500">Alert neighbors to help recover lost belongings</p>
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
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('lost')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  category === 'lost'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setCategory('found')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  category === 'found'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                I Found Something
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Item Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Golden Retriever Puppy with Red Collar, or Set of Car Keys"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description & Location Seen
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact color, marks, where it was lost or found, and any identifying details..."
              className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Contact Info (Phone or Email)
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g. Call 555-0182 or message through comments"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
            />
          </div>

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
              disabled={loading || !title.trim()}
              className="bg-[#005D42] hover:bg-[#047857] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
