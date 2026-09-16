import React, { useState } from 'react';
import { X, HeartHandshake, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { HelpRequestItem } from '../types/index.ts';
import { api } from '../services/api.ts';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: HelpRequestItem | null;
  onSuccess: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess,
}) => {
  const [note, setNote] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please provide a message explaining how you can assist.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.offerHelp(request._id, {
        note: note.trim(),
        contact: contact.trim(),
      });
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit offer of assistance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-headline">Offer Neighbor Assistance</h2>
              <p className="text-[11px] text-gray-500">Respond to: {request.title}</p>
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

        {successMessage ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">Thank You, Neighbor!</h3>
            <p className="text-xs text-gray-600">
              Your offer has been delivered directly to {request.createdBy?.name || 'the requester'}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 space-y-1">
              <p className="font-bold text-gray-900">{request.title}</p>
              <p className="text-gray-600">{request.description}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 pt-1 font-semibold">
                <span className="uppercase text-red-600">Urgency: {request.urgency}</span>
                <span>•</span>
                <span>{request.areaName}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                How Can You Help?
              </label>
              <textarea
                rows={3}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I am O-positive blood donor and can visit City Hospital at 4 PM, or I have a spare generator..."
                className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20 focus:border-[#005D42] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contact Number or WhatsApp (Optional)
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20 focus:border-[#005D42] transition"
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
                disabled={loading || !note.trim()}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Offer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
