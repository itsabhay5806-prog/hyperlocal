import React from 'react';
import { X, Bell, CheckCheck, MessageSquare, ThumbsUp, HeartHandshake, Calendar } from 'lucide-react';
import { NotificationItem } from '../types/index.ts';
import { api } from '../services/api.ts';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onRefreshNotifications: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefreshNotifications,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      onRefreshNotifications();
    } catch (e) {
      console.error('Failed to mark notifications read:', e);
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      onRefreshNotifications();
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'reaction':
        return <ThumbsUp className="w-4 h-4 text-blue-600" />;
      case 'help_offer':
        return <HeartHandshake className="w-4 h-4 text-red-600" />;
      case 'event_join':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#005D42]" />
            <h2 className="text-base font-bold text-gray-900 font-headline">Civic Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#005D42] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 space-y-2">
              <Bell className="w-8 h-8 text-gray-300 mx-auto" />
              <p>No notifications yet.</p>
              <p className="text-[11px] text-gray-400">
                You'll receive alerts when neighbors comment on your posts or offer help.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleMarkOne(n._id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 text-xs ${
                  n.isRead
                    ? 'bg-white border-gray-100 text-gray-700'
                    : 'bg-emerald-50/50 border-emerald-100 text-gray-900 font-medium'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug">{n.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1 inline-block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
