import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Bell,
  CloudSun,
  ShieldCheck,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Database,
  Radio,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  onOpenCreatePost: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenLocationModal: () => void;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreatePost,
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
  onOpenLocationModal,
  unreadNotificationsCount,
}) => {
  const { user, logout, userArea, systemStatus } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isDbConnected = systemStatus?.database?.connected;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Locality Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#005D42] flex items-center justify-center text-white shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-extrabold text-[#005D42] tracking-tight font-headline">
                  HyperLocal
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-medium text-gray-500 tracking-wide mt-0.5">
                Neighborhood Commons
              </span>
            </div>
          </div>

          {/* Locality Switcher */}
          <button
            onClick={onOpenLocationModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 transition"
            title="Click to change locality"
          >
            <MapPin className="w-3.5 h-3.5 text-[#005D42]" />
            <span className="max-w-[140px] truncate">{userArea || 'Detect Location'}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>

        {/* Center: Search Bar with ⌘K */}
        <div className="flex-1 max-w-lg hidden md:block">
          <div
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer text-xs text-gray-500 transition"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <span>Search posts, neighbors, events, shops...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Search Icon */}
          <button
            onClick={onOpenSearch}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Database State Pill */}
          <div
            title={
              isDbConnected
                ? 'MongoDB Atlas: Connected & 2dsphere Indexed'
                : 'MongoDB In-Memory Active (Configure MONGODB_URI in Settings for Atlas)'
            }
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isDbConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isDbConnected ? 'Atlas Live' : 'In-Memory DB'}</span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:bg-gray-100 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Create Post Button */}
          <button
            onClick={onOpenCreatePost}
            className="bg-[#005D42] hover:bg-[#047857] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Post</span>
          </button>

          {/* User Profile Avatar with dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-white shadow-xs">
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
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {user?.role === 'business' ? 'Verified Local Merchant' : 'Verified Resident'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                >
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span>My Profile & Post History</span>
                </button>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenLocationModal();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                >
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Change Current Locality</span>
                </button>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
