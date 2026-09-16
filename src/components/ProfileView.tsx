import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  User,
  ShieldCheck,
  MapPin,
  Database,
  Calendar,
  Layers,
  ArrowLeft,
  Key,
  ExternalLink,
} from 'lucide-react';

interface ProfileViewProps {
  onBack: () => void;
  postsCount: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack, postsCount }) => {
  const { user, userCoords, userArea, systemStatus } = useAuth();
  const dbStatus = systemStatus?.database;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#005D42] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Community Feed</span>
      </button>

      {/* User Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 card-shadow space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xl overflow-hidden border border-emerald-200">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{user?.name?.slice(0, 2).toUpperCase() || 'HL'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 font-headline">{user?.name}</h2>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#005D42] border border-emerald-200">
                {user?.role === 'business' ? 'Verified Merchant' : 'Verified Neighborhood Resident'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-gray-400 font-medium block">Current Locality</span>
            <span className="font-bold text-gray-900 truncate block mt-0.5">{userArea}</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-gray-400 font-medium block">Coordinates (GeoJSON)</span>
            <span className="font-bold text-emerald-700 block mt-0.5">
              {userCoords ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : 'Set Manually'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 col-span-2 sm:col-span-1">
            <span className="text-gray-400 font-medium block">Community Posts</span>
            <span className="font-bold text-gray-900 block mt-0.5">{postsCount} published</span>
          </div>
        </div>
      </div>

      {/* MongoDB Atlas Connectivity Panel */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                dbStatus?.connected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-headline">
                Database Engine Status
              </h3>
              <p className="text-xs text-gray-500">
                {dbStatus?.connected
                  ? 'MongoDB Atlas Cluster Connected'
                  : 'In-Memory Active Buffer (Zero Mock Data)'}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              dbStatus?.connected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {dbStatus?.connected ? 'Atlas Connected' : 'Buffer Mode'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-2 leading-relaxed">
          <p>
            <strong>Storage Architecture:</strong> All user accounts, community posts, comments,
            reactions, businesses, and help requests use standard Mongoose schemas with{' '}
            <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800 font-mono text-[11px]">
              2dsphere
            </code>{' '}
            geospatial indexes.
          </p>

          {!dbStatus?.connected && (
            <div className="pt-2 border-t border-gray-200 space-y-1.5">
              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>To connect your live MongoDB Atlas cluster:</span>
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1">
                <li>Create a free cluster at mongodb.com/atlas.</li>
                <li>Add your connection string to Settings or <code className="bg-gray-200 px-1 rounded text-gray-800 font-mono">.env</code>:</li>
                <code className="block p-2 bg-gray-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                  MONGODB_URI=mongodb+srv://&lt;user&gt;:&lt;password&gt;@cluster0.mongodb.net/hyperlocal
                </code>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
