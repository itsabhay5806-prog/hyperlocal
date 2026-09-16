import React from 'react';
import {
  Home,
  Map,
  HeartHandshake,
  Calendar,
  Store,
  HelpCircle,
  AlertTriangle,
  ShieldCheck,
  Compass,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type ActiveTab =
  | 'feed'
  | 'map'
  | 'help'
  | 'events'
  | 'businesses'
  | 'lostfound'
  | 'alerts';

interface SidebarLeftProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  radiusKm: number;
  onChangeRadius: (radius: number) => void;
  onOpenCreateBusiness: () => void;
  onOpenCreateEvent: () => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  activeTab,
  onSelectTab,
  radiusKm,
  onChangeRadius,
  onOpenCreateBusiness,
  onOpenCreateEvent,
}) => {
  const { user, userArea } = useAuth();

  const navItems = [
    { id: 'feed', label: 'Community Feed', icon: Home },
    { id: 'map', label: 'Live Local Map', icon: Map },
    { id: 'help', label: 'Help & Mutual Aid', icon: HeartHandshake },
    { id: 'events', label: 'Events & Sports', icon: Calendar },
    { id: 'businesses', label: 'Verified Local Shops', icon: Store },
    { id: 'lostfound', label: 'Lost & Found', icon: HelpCircle },
    { id: 'alerts', label: 'Civic & Weather Alerts', icon: AlertTriangle },
  ];

  return (
    <aside className="w-64 shrink-0 space-y-5 hidden md:block">
      {/* Active Neighborhood Card */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 card-shadow space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Active Zone
            </span>
            <h3 className="text-sm font-bold text-gray-900 truncate mt-0.5">{userArea}</h3>
          </div>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#005D42] flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Resident Verified by Phone/ID</span>
        </div>

        {/* Proximity Scope Slider / Buttons */}
        <div className="pt-2 border-t border-gray-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
            <span>Radius Scope</span>
            <span className="text-[#005D42] font-bold">{radiusKm} km</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0.5, 1.2, 2.5, 5].map((r) => (
              <button
                key={r}
                onClick={() => onChangeRadius(r)}
                className={`py-1 rounded-lg text-[11px] font-bold transition ${
                  radiusKm === r
                    ? 'bg-[#005D42] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r < 1 ? '500m' : `${r}km`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="bg-white rounded-2xl p-2 border border-gray-200 card-shadow space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as ActiveTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-emerald-50 text-[#005D42] font-extrabold'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-[#005D42]' : 'text-gray-500'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Community Actions */}
      <div className="bg-white rounded-2xl p-3 border border-gray-200 card-shadow space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
          Local Initiators
        </span>
        <button
          onClick={onOpenCreateEvent}
          className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#005D42] transition flex items-center gap-2"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Host a Local Meetup</span>
        </button>
        <button
          onClick={onOpenCreateBusiness}
          className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#005D42] transition flex items-center gap-2"
        >
          <Store className="w-3.5 h-3.5 text-emerald-600" />
          <span>List Local Business</span>
        </button>
      </div>

      {/* Neighborhood Trust Charter */}
      <div className="p-3.5 rounded-2xl bg-[#005D42]/5 border border-[#005D42]/15 text-[11px] text-gray-600 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-[#005D42]">
          <Award className="w-3.5 h-3.5" />
          <span>HyperLocal Trust Charter</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Public comments only. No unsolicited private DMs. All items and requests are anchored in real neighborhood proximity.
        </p>
      </div>
    </aside>
  );
};
