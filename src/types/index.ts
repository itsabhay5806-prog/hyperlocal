export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'business' | 'moderator' | 'admin';
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  areaName?: string;
  profilePhoto?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    role: string;
    isVerified: boolean;
    areaName?: string;
  };
  content: string;
  category: string;
  images: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  areaName: string;
  commentsCount: number;
  reactionsCount: number;
  createdAt: string;
  distanceKm?: number | null;
  distanceText?: string;
  userReaction?: string | null;
}

export interface Comment {
  _id: string;
  post: string;
  author: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    isVerified?: boolean;
  };
  content: string;
  createdAt: string;
}

export interface Business {
  _id: string;
  businessName: string;
  owner: any;
  category: string;
  description: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  images: string[];
  openingHours: string;
  isVerified: boolean;
  rating?: number;
  reviewsCount?: number;
  distanceKm?: number | null;
  distanceText?: string;
  createdAt: string;
}

export interface EventItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  organizer: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  areaName: string;
  date: string;
  startTime: string;
  endTime?: string;
  maxParticipants?: number;
  participantsCount: number;
  isUserJoined?: boolean;
  distanceKm?: number | null;
  distanceText?: string;
  createdAt: string;
}

export interface HelpOffer {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  note: string;
  contact?: string;
  createdAt: string;
}

export interface HelpRequestItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    areaName?: string;
    isVerified?: boolean;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  areaName: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  offersCount: number;
  distanceKm?: number | null;
  distanceText?: string;
  createdAt: string;
}

export interface LostFoundItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  areaName: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    areaName?: string;
  };
  status: 'active' | 'resolved';
  contactInfo?: string;
  distanceKm?: number | null;
  distanceText?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  type: string;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CivicAlert {
  _id: string;
  title: string;
  description: string;
  type: string;
  severity: 'advisory' | 'warning' | 'emergency';
  source: string;
  emergencyProtocol?: string;
  helpline?: string;
  areaName: string;
  isActive: boolean;
  createdAt: string;
}

export interface SystemStatus {
  status: string;
  database: {
    connected: boolean;
    configured: boolean;
    engine: string;
    connectionState: string;
  };
  optionalServices?: {
    googleMaps: {
      configured: boolean;
      status: string;
      name: string;
    };
    weather: {
      configured: boolean;
      status: string;
      name: string;
    };
    cloudinary: {
      configured: boolean;
      status: string;
      name: string;
    };
  };
  counts: {
    users: number;
    posts: number;
    businesses: number;
    events: number;
    helpRequests: number;
    lostFound: number;
  };
}
