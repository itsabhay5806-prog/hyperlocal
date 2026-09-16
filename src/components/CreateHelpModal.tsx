import React, { useState } from 'react';
import { X, HeartHandshake, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { HelpRequestItem } from '../types/index.ts';

interface CreateHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated: (req: HelpRequestItem) => void;
}

const URGENCY_LEVELS = [
  { id: 'critical', label: 'Critical / Life-Saving' },
  { id: 'high', label: 'High / Today' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low / General' },
];

export const CreateHelpModal: React.FC<CreateHelpModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated,
}) => {
  const { userCoords, userArea } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Medical Emergency');
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
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
        urgency,
        areaName: userArea,
      };

      if (userCoords) {
        payload.location = {
          type: 'Point',
          coordinates: [userCoords.lng, userCoords.lat],
        };
      }

      const res = await api.createHelpRequest(payload);
      onRequestCreated(res.request);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit help request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-headline">Request Community Help</h2>
              <p className="text-[11px] text-gray-500">Mutual assistance and neighborhood support</p>
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Help Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
            >
              <option value="Blood Donation">Blood Donation</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Elderly Support">Elderly Support</option>
              <option value="Food & Grocery">Food & Grocery</option>
              <option value="Emergency Transport">Emergency Transport</option>
              <option value="Volunteer Help">Volunteer Help</option>
              <option value="Community Welfare">Community Welfare</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Urgency Level</label>
            <div className="grid grid-cols-2 gap-1.5">
              {URGENCY_LEVELS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUrgency(u.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center ${
                    urgency === u.id
                      ? u.id === 'critical'
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-emerald-700 border-emerald-700 text-white'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Title / Brief</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need urgent O+ blood donor at Metro Hospital"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description & Details</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact hospital/location details, contact number, or how neighbors can assist directly..."
              className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
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
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
