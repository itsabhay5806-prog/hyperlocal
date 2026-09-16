import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LocationPermissionModal } from './components/LocationPermissionModal.tsx';
import { Header } from './components/Header.tsx';
import { SidebarLeft, ActiveTab } from './components/SidebarLeft.tsx';
import { SidebarRight } from './components/SidebarRight.tsx';
import { PostCard } from './components/PostCard.tsx';
import { MapView } from './components/MapView.tsx';
import { CreatePostModal } from './components/CreatePostModal.tsx';
import { CreateHelpModal } from './components/CreateHelpModal.tsx';
import { CreateEventModal } from './components/CreateEventModal.tsx';
import { CreateBusinessModal } from './components/CreateBusinessModal.tsx';
import { CreateLostFoundModal } from './components/CreateLostFoundModal.tsx';
import { SupportModal } from './components/SupportModal.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { api } from './services/api.ts';
import {
  Post,
  Business,
  EventItem,
  HelpRequestItem,
  LostFoundItem,
  NotificationItem,
  CivicAlert,
} from './types/index.ts';
import {
  Sparkles,
  Loader2,
  Plus,
  HeartHandshake,
  Calendar,
  Store,
  HelpCircle,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  RefreshCw,
  Home,
  Map,
  Filter,
  CloudSun,
  Info,
} from 'lucide-react';

const FILTER_CHIPS = [
  'All Feeds',
  'Help Needed',
  'Announcements',
  'Sports & Play',
  'Events',
  'Local Shops',
  'Lost & Found',
];

const MainAppContent: React.FC = () => {
  const {
    user,
    isLoading,
    hasLocation,
    userCoords,
    userArea,
    locationPermission,
    refreshSystemStatus,
  } = useAuth();

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [activeFilterChip, setActiveFilterChip] = useState('All Feeds');
  const [radiusKm, setRadiusKm] = useState(5);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createHelpOpen, setCreateHelpOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createBusinessOpen, setCreateBusinessOpen] = useState(false);
  const [createLostFoundOpen, setCreateLostFoundOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [selectedHelpRequest, setSelectedHelpRequest] = useState<HelpRequestItem | null>(null);

  // Data Collections
  const [posts, setPosts] = useState<Post[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequestItem[]>([]);
  const [lostFound, setLostFound] = useState<LostFoundItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [alerts, setAlerts] = useState<CivicAlert[]>([]);
  const [alertsStatusMessage, setAlertsStatusMessage] = useState<string | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<any>(null);
  const [weatherConfigured, setWeatherConfigured] = useState(false);

  // Loading indicator for active tab
  const [tabLoading, setTabLoading] = useState(false);

  // ⌘K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show Location Permission Modal on initial load if logged in but location prompt pending
  useEffect(() => {
    if (user && !hasLocation && locationPermission === 'prompt') {
      setLocationModalOpen(true);
    }
  }, [user, hasLocation, locationPermission]);

  // Fetch Community Feed
  const fetchPosts = useCallback(async () => {
    try {
      const category = activeFilterChip === 'All Feeds' ? undefined : activeFilterChip;
      const res = await api.getPosts({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        radius: radiusKm,
        category,
      });
      setPosts(res.posts || []);
    } catch (e) {
      console.error('Failed to load posts:', e);
    }
  }, [userCoords, radiusKm, activeFilterChip]);

  // Fetch Businesses
  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await api.getBusinesses({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        radius: radiusKm,
      });
      setBusinesses(res.businesses || []);
    } catch (e) {
      console.error('Failed to load businesses:', e);
    }
  }, [userCoords, radiusKm]);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.getEvents({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        radius: radiusKm,
      });
      setEvents(res.events || []);
    } catch (e) {
      console.error('Failed to load events:', e);
    }
  }, [userCoords, radiusKm]);

  // Fetch Help Requests
  const fetchHelpRequests = useCallback(async () => {
    try {
      const res = await api.getHelpRequests({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        radius: radiusKm,
      });
      setHelpRequests(res.requests || []);
    } catch (e) {
      console.error('Failed to load help requests:', e);
    }
  }, [userCoords, radiusKm]);

  // Fetch Lost & Found
  const fetchLostFound = useCallback(async () => {
    try {
      const res = await api.getLostFound({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        radius: radiusKm,
      });
      setLostFound(res.items || []);
    } catch (e) {
      console.error('Failed to load lost-found:', e);
    }
  }, [userCoords, radiusKm]);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadNotificationsCount(res.unreadCount || 0);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, [user]);

  // Fetch Civic Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.getAlerts(userCoords?.lat, userCoords?.lng);
      setAlerts(res.alerts || []);
      setAlertsStatusMessage(res.statusMessage || null);
      setWeatherInfo(res.liveWeather || null);
      setWeatherConfigured(Boolean(res.weatherConfigured));
    } catch (e) {
      console.error('Failed to load alerts:', e);
    }
  }, [userCoords]);

  // Global Reload of all local data
  const reloadAllData = useCallback(async () => {
    setTabLoading(true);
    await Promise.all([
      fetchPosts(),
      fetchBusinesses(),
      fetchEvents(),
      fetchHelpRequests(),
      fetchLostFound(),
      fetchNotifications(),
      fetchAlerts(),
      refreshSystemStatus(),
    ]);
    setTabLoading(false);
  }, [
    fetchPosts,
    fetchBusinesses,
    fetchEvents,
    fetchHelpRequests,
    fetchLostFound,
    fetchNotifications,
    fetchAlerts,
    refreshSystemStatus,
  ]);

  useEffect(() => {
    if (user) {
      reloadAllData();
    }
  }, [user, userCoords, radiusKm, activeFilterChip]);

  // Handling Join Event
  const handleJoinEvent = async (eventId: string) => {
    try {
      const res = await api.joinEvent(eventId);
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId
            ? {
                ...ev,
                isUserJoined: res.joined,
                participantsCount: res.participantsCount,
              }
            : ev
        )
      );
    } catch (e) {
      console.error('Failed to update event RSVP:', e);
    }
  };

  // Handling Resolve Lost & Found
  const handleResolveLostFound = async (id: string) => {
    try {
      await api.resolveLostFound(id);
      setLostFound((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: 'resolved' } : item))
      );
    } catch (e) {
      console.error('Failed to resolve lost-found item:', e);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#005D42] text-white flex items-center justify-center shadow-md animate-pulse mb-4">
          <MapPin className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-gray-800 font-headline">Connecting to HyperLocal...</p>
        <p className="text-xs text-gray-500 mt-1">Verifying resident credentials and database</p>
      </div>
    );
  }

  // 2. Unauthenticated State -> Landing Page
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // 3. Authenticated Application
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <Header
        onOpenCreatePost={() => setCreatePostOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <SidebarLeft
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setIsProfileOpen(false);
              setActiveTab(tab);
            }}
            radiusKm={radiusKm}
            onChangeRadius={(r) => setRadiusKm(r)}
            onOpenCreateBusiness={() => setCreateBusinessOpen(true)}
            onOpenCreateEvent={() => setCreateEventOpen(true)}
          />

          {/* Center Stream / Dynamic Views */}
          <main className="flex-1 min-w-0 space-y-5">
            {isProfileOpen ? (
              <ProfileView
                onBack={() => setIsProfileOpen(false)}
                postsCount={posts.filter((p) => (p.author?._id || p.author) === user._id).length}
              />
            ) : activeTab === 'map' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 font-headline">
                      Live Neighborhood Map
                    </h2>
                    <p className="text-xs text-gray-500">
                      Geographic pins of posts, shops, meetups, and aid requests within {radiusKm}km
                    </p>
                  </div>
                  <button
                    onClick={reloadAllData}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
                <MapView
                  posts={posts}
                  businesses={businesses}
                  events={events}
                  helpRequests={helpRequests}
                  radiusKm={radiusKm}
                />
              </div>
            ) : activeTab === 'help' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 font-headline">
                      Help & Mutual Aid
                    </h2>
                    <p className="text-xs text-gray-500">
                      Emergency blood requirements, medicine delivery, and social assistance
                    </p>
                  </div>
                  <button
                    onClick={() => setCreateHelpOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Request Urgent Help</span>
                  </button>
                </div>

                {helpRequests.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-12 text-center space-y-3">
                    <HeartHandshake className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">No active help requests</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      All neighbors are safe and supported. If you or someone nearby needs emergency aid, post a request.
                    </p>
                    <button
                      onClick={() => setCreateHelpOpen(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Create Request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {helpRequests.map((hr) => (
                      <div
                        key={hr._id}
                        className="bg-white rounded-2xl border border-gray-200 card-shadow p-5 space-y-3 elevation-hover"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  hr.urgency === 'critical'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {hr.urgency} · {hr.category}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium">
                                {hr.distanceText}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mt-1">{hr.title}</h3>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                            {hr.status.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {hr.description}
                        </p>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Posted by <strong>{hr.createdBy?.name || 'Neighbor'}</strong></span>
                            <span>•</span>
                            <span>{hr.offersCount} neighbor offers</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedHelpRequest(hr);
                              setSupportModalOpen(true);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            Offer Help
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'events' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 font-headline">
                      Events & Sports Meetups
                    </h2>
                    <p className="text-xs text-gray-500">
                      Turf cricket, morning fitness, cultural festivals, and clean-up drives
                    </p>
                  </div>
                  <button
                    onClick={() => setCreateEventOpen(true)}
                    className="bg-[#005D42] hover:bg-[#047857] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Host a Meetup</span>
                  </button>
                </div>

                {events.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-12 text-center space-y-3">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">No upcoming events scheduled</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Be the neighbor who starts the movement. Organize a sports match or community walk!
                    </p>
                    <button
                      onClick={() => setCreateEventOpen(true)}
                      className="bg-[#005D42] text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Schedule Event
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {events.map((ev) => (
                      <div
                        key={ev._id}
                        className="bg-white rounded-2xl border border-gray-200 card-shadow p-5 space-y-3 flex flex-col justify-between elevation-hover"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {ev.category}
                            </span>
                            <span className="text-gray-500">{ev.distanceText}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900">{ev.title}</h3>
                          <p className="text-xs text-gray-600 line-clamp-2">{ev.description}</p>
                          <div className="space-y-1 text-xs text-gray-500 pt-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{ev.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>{ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">
                            {ev.participantsCount} attending
                          </span>
                          <button
                            onClick={() => handleJoinEvent(ev._id)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                              ev.isUserJoined
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-[#005D42] hover:bg-[#047857] text-white'
                            }`}
                          >
                            {ev.isUserJoined ? 'Joined (RSVP✓)' : 'Join Event'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'businesses' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 font-headline">
                      Verified Local Businesses
                    </h2>
                    <p className="text-xs text-gray-500">
                      Support shops, pharmacies, bakeries, and artisans in your neighborhood
                    </p>
                  </div>
                  <button
                    onClick={() => setCreateBusinessOpen(true)}
                    className="bg-[#006A63] hover:bg-[#0F766E] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>List Local Business</span>
                  </button>
                </div>

                {businesses.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-12 text-center space-y-3">
                    <Store className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">
                      No local businesses found in your area.
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Are you a neighborhood grocer, technician, or doctor? List your business profile!
                    </p>
                    <button
                      onClick={() => setCreateBusinessOpen(true)}
                      className="bg-[#006A63] text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Register Business
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {businesses.map((b) => (
                      <div
                        key={b._id}
                        className="bg-white rounded-2xl border border-gray-200 card-shadow p-5 space-y-3 flex flex-col justify-between elevation-hover"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-100">
                              {b.category}
                            </span>
                            <span className="text-gray-500">{b.distanceText}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900">{b.businessName}</h3>
                          <p className="text-xs text-gray-600">{b.description}</p>
                          <div className="space-y-1 text-xs text-gray-500 pt-1">
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{b.address}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{b.openingHours}</span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <a
                            href={`tel:${b.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{b.phone}</span>
                          </a>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            Verified Shop✓
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'lostfound' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 font-headline">
                      Lost & Found
                    </h2>
                    <p className="text-xs text-gray-500">
                      Help reunite neighbors with lost pets, keys, wallets, and belongings
                    </p>
                  </div>
                  <button
                    onClick={() => setCreateLostFoundOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Report Item</span>
                  </button>
                </div>

                {lostFound.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-12 text-center space-y-3">
                    <HelpCircle className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">No lost or found reports</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Nothing is reported missing in your neighborhood.
                    </p>
                    <button
                      onClick={() => setCreateLostFoundOpen(true)}
                      className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Report Item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lostFound.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-2xl border border-gray-200 card-shadow p-5 space-y-3 elevation-hover"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                item.category === 'lost'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {item.category === 'lost' ? 'Lost Item' : 'Found Item'}
                            </span>
                            <span className="text-xs text-gray-500">{item.distanceText}</span>
                          </div>
                          {item.status === 'resolved' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                              Resolved✓
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Active Case
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-700 mt-1 whitespace-pre-line">
                            {item.description}
                          </p>
                        </div>

                        {item.contactInfo && (
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                            <strong>Contact:</strong> {item.contactInfo}
                          </div>
                        )}

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <span>Reported by {item.createdBy?.name || 'Neighbor'}</span>
                          {item.status !== 'resolved' &&
                            (user._id === (item.createdBy?._id || item.createdBy) ||
                              user.role === 'admin') && (
                              <button
                                onClick={() => handleResolveLostFound(item._id)}
                                className="text-emerald-700 font-bold hover:underline"
                              >
                                Mark as Recovered/Resolved
                              </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'alerts' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 font-headline">
                      Civic & Safety Alerts
                    </h2>
                    <p className="text-xs text-gray-500">
                      Verified meteorological, municipal, and public safety announcements
                    </p>
                  </div>
                  <button
                    onClick={fetchAlerts}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Check Updates</span>
                  </button>
                </div>

                {/* Weather Integration Status Banner */}
                {weatherConfigured && weatherInfo ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-emerald-100 flex items-center justify-center text-[#005D42]">
                        <CloudSun className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900">Live Weather ({userArea || 'Local'})</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Live API Connected
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {weatherInfo.condition || 'Clear'} · {weatherInfo.temperature}°C · Humidity {weatherInfo.humidity}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                        <CloudSun className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">Google Weather Service</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700">
                            Optional / Not Configured
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1 leading-relaxed text-[11px]">
                          Weather API credentials are not yet configured. The system does NOT generate fake temperatures or synthetic storm forecasts. Real user-submitted community alerts and municipal safety bulletins continue to function below.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {alerts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-12 text-center space-y-3">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">
                      {alertsStatusMessage || 'Live alerts are currently unavailable.'}
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      No critical emergency alerts have been issued by civic authorities for {userArea}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((al) => (
                      <div
                        key={al._id}
                        className={`p-5 rounded-2xl border card-shadow space-y-2 ${
                          al.severity === 'emergency'
                            ? 'bg-red-50 border-red-200 text-red-950'
                            : 'bg-amber-50 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/80 border">
                            {al.severity} · {al.type}
                          </span>
                          <span className="text-[11px] font-semibold">{al.source}</span>
                        </div>
                        <h3 className="text-base font-bold">{al.title}</h3>
                        <p className="text-xs leading-relaxed">{al.description}</p>
                        {al.emergencyProtocol && (
                          <div className="p-3 bg-white/90 rounded-xl text-xs space-y-1">
                            <strong className="text-gray-900">Safety Protocol:</strong>
                            <p className="text-gray-700">{al.emergencyProtocol}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* COMMUNITY FEED (HOME) */
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Civic Alert Banner if active */}
                {alerts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-900">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <strong>{alerts[0].title}:</strong> {alerts[0].description}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="text-xs font-bold text-amber-800 hover:underline shrink-0"
                    >
                      View Details
                    </button>
                  </div>
                )}

                {/* Quick Post Prompt Card */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 card-shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <button
                    onClick={() => setCreatePostOpen(true)}
                    className="flex-1 text-left px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs sm:text-sm text-gray-500 border border-gray-200 transition"
                  >
                    Share what's happening around {userArea}...
                  </button>
                  <button
                    onClick={() => setCreatePostOpen(true)}
                    className="bg-[#005D42] hover:bg-[#047857] text-white p-2.5 rounded-xl shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Chips Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {FILTER_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setActiveFilterChip(chip)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                        activeFilterChip === chip
                          ? 'bg-[#005D42] text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Feed Stream */}
                {tabLoading ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#005D42] mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Retrieving neighborhood feed...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005D42] flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">
                      No posts around you yet. Be the first to post!
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Connect with neighbors in {userArea}. Share a local announcement, organize a weekend match, or ask a question.
                    </p>
                    <button
                      onClick={() => setCreatePostOpen(true)}
                      className="bg-[#005D42] hover:bg-[#047857] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      + Create First Post
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onPostDeleted={(id) => {
                          setPosts((prev) => prev.filter((p) => p._id !== id));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Right Sidebar Widgets */}
          <SidebarRight
            events={events}
            helpRequests={helpRequests}
            businesses={businesses}
            onSelectEventTab={() => {
              setIsProfileOpen(false);
              setActiveTab('events');
            }}
            onSelectHelpTab={() => {
              setIsProfileOpen(false);
              setActiveTab('help');
            }}
            onSelectBusinessTab={() => {
              setIsProfileOpen(false);
              setActiveTab('businesses');
            }}
            onOpenOfferHelp={(hr) => {
              setSelectedHelpRequest(hr);
              setSupportModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => {
            setIsProfileOpen(false);
            setActiveTab('feed');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === 'feed' && !isProfileOpen ? 'text-[#005D42]' : 'text-gray-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Feed</span>
        </button>
        <button
          onClick={() => {
            setIsProfileOpen(false);
            setActiveTab('map');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === 'map' ? 'text-[#005D42]' : 'text-gray-500'
          }`}
        >
          <Map className="w-5 h-5" />
          <span>Map</span>
        </button>
        <button
          onClick={() => setCreatePostOpen(true)}
          className="w-10 h-10 -mt-5 rounded-full bg-[#005D42] text-white flex items-center justify-center shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setIsProfileOpen(false);
            setActiveTab('help');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === 'help' ? 'text-[#005D42]' : 'text-gray-500'
          }`}
        >
          <HeartHandshake className="w-5 h-5" />
          <span>Help</span>
        </button>
        <button
          onClick={() => {
            setIsProfileOpen(false);
            setActiveTab('businesses');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeTab === 'businesses' ? 'text-[#005D42]' : 'text-gray-500'
          }`}
        >
          <Store className="w-5 h-5" />
          <span>Shops</span>
        </button>
      </div>

      {/* Modals Container */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
        }}
      />

      <CreateHelpModal
        isOpen={createHelpOpen}
        onClose={() => setCreateHelpOpen(false)}
        onRequestCreated={(newReq) => {
          setHelpRequests((prev) => [newReq, ...prev]);
        }}
      />

      <CreateEventModal
        isOpen={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        onEventCreated={(newEv) => {
          setEvents((prev) => [newEv, ...prev]);
        }}
      />

      <CreateBusinessModal
        isOpen={createBusinessOpen}
        onClose={() => setCreateBusinessOpen(false)}
        onBusinessCreated={(newBiz) => {
          setBusinesses((prev) => [newBiz, ...prev]);
        }}
      />

      <CreateLostFoundModal
        isOpen={createLostFoundOpen}
        onClose={() => setCreateLostFoundOpen(false)}
        onItemCreated={(newItem) => {
          setLostFound((prev) => [newItem, ...prev]);
        }}
      />

      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => {
          setSupportModalOpen(false);
          setSelectedHelpRequest(null);
        }}
        request={selectedHelpRequest}
        onSuccess={fetchHelpRequests}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onRefreshNotifications={fetchNotifications}
      />

      <LocationPermissionModal
        isOpen={locationModalOpen}
        onSuccess={() => {
          setLocationModalOpen(false);
          reloadAllData();
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
