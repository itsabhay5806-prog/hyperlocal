import React from 'react';
import {
  Calendar,
  HeartHandshake,
  Store,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';
import { EventItem, HelpRequestItem, Business } from '../types/index.ts';

interface SidebarRightProps {
  events: EventItem[];
  helpRequests: HelpRequestItem[];
  businesses: Business[];
  onSelectEventTab: () => void;
  onSelectHelpTab: () => void;
  onSelectBusinessTab: () => void;
  onOpenOfferHelp: (req: HelpRequestItem) => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  events,
  helpRequests,
  businesses,
  onSelectEventTab,
  onSelectHelpTab,
  onSelectBusinessTab,
  onOpenOfferHelp,
}) => {
  return (
    <aside className="w-80 shrink-0 space-y-5 hidden lg:block">
      {/* Urgent Community Needs */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 card-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-headline">
              Urgent Community Needs
            </h3>
          </div>
          <button
            onClick={onSelectHelpTab}
            className="text-[11px] font-semibold text-[#005D42] hover:underline"
          >
            View all
          </button>
        </div>

        {helpRequests.length === 0 ? (
          <div className="p-3 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
            No active urgent requests in your neighborhood right now.
          </div>
        ) : (
          <div className="space-y-2.5">
            {helpRequests.slice(0, 3).map((req) => (
              <div
                key={req._id}
                className="p-3 rounded-xl bg-red-50/50 border border-red-100 hover:border-red-200 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700">
                    {req.category}
                  </span>
                  {req.distanceText && (
                    <span className="text-[10px] text-gray-500 font-medium">
                      {req.distanceText}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{req.title}</h4>
                <p className="text-[11px] text-gray-600 line-clamp-2">{req.description}</p>
                <button
                  onClick={() => onOpenOfferHelp(req)}
                  className="w-full mt-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-1.5 rounded-lg shadow-xs transition"
                >
                  Offer Help
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Happening Nearby */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 card-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#005D42] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-headline">
              Happening Nearby
            </h3>
          </div>
          <button
            onClick={onSelectEventTab}
            className="text-[11px] font-semibold text-[#005D42] hover:underline"
          >
            View all
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-3 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
            No upcoming events scheduled. Be the first neighbor to organize a meetup!
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.slice(0, 3).map((ev) => (
              <div
                key={ev._id}
                onClick={onSelectEventTab}
                className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#005D42] uppercase tracking-wide">
                    {ev.category}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {ev.distanceText || ev.date}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{ev.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-0.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{ev.startTime}</span>
                  <span>·</span>
                  <span>{ev.participantsCount} attending</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Verified Shops */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 card-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#006A63] flex items-center justify-center">
              <Store className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-headline">
              Verified Local Shops
            </h3>
          </div>
          <button
            onClick={onSelectBusinessTab}
            className="text-[11px] font-semibold text-[#005D42] hover:underline"
          >
            Explore
          </button>
        </div>

        {businesses.length === 0 ? (
          <div className="p-3 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
            No local businesses listed yet. Register your neighborhood shop!
          </div>
        ) : (
          <div className="space-y-2.5">
            {businesses.slice(0, 3).map((biz) => (
              <div
                key={biz._id}
                onClick={onSelectBusinessTab}
                className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-bold text-gray-900">{biz.businessName}</h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-gray-500">{biz.distanceText}</span>
                </div>
                <p className="text-[11px] text-gray-600 line-clamp-1">{biz.category} · {biz.address}</p>
                <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-medium">
                  <Phone className="w-3 h-3" />
                  <span>{biz.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
