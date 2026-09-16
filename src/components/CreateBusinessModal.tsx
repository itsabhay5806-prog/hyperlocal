import React, { useState } from 'react';
import { X, Store, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Business } from '../types/index.ts';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessCreated: (b: Business) => void;
}

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onBusinessCreated,
}) => {
  const { userCoords } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Groceries & Essentials');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('8:00 AM - 9:00 PM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !phone.trim() || !address.trim() || !description.trim()) {
      setError('Business name, phone, address, and description are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        businessName: businessName.trim(),
        category,
        description: description.trim(),
        phone: phone.trim(),
        address: address.trim(),
        openingHours,
      };

      if (userCoords) {
        payload.location = {
          type: 'Point',
          coordinates: [userCoords.lng, userCoords.lat],
        };
      }

      const res = await api.createBusiness(payload);
      onBusinessCreated(res.business);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to list business.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#006A63] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-headline">Register Local Business</h2>
              <p className="text-[11px] text-gray-500">Connect with nearby neighborhood customers</p>
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Green Valley Fresh Organics"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
            >
              <option value="Groceries & Essentials">Groceries & Essentials</option>
              <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
              <option value="Bakery & Cafe">Bakery & Cafe</option>
              <option value="Hardware & Repairs">Hardware & Electrical Repairs</option>
              <option value="Plumbing & Home Care">Plumbing & Home Care</option>
              <option value="Pet Care & Veterinary">Pet Care & Veterinary</option>
              <option value="Salon & Wellness">Salon & Wellness</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0192"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Opening Hours</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="8:00 AM - 9:00 PM"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address / Landmark</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop #12, Market Square, Central Lane"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description & Services</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell neighbors what you offer, delivery options, and specialties..."
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
              disabled={loading || !businessName.trim()}
              className="bg-[#005D42] hover:bg-[#047857] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Register Shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
