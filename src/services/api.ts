const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('hyperlocal_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('hyperlocal_token', token);
  } else {
    localStorage.removeItem('hyperlocal_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // User
  updateLocation: (data: { latitude: number; longitude: number; areaName?: string }) =>
    request<any>('/users/location', { method: 'PUT', body: JSON.stringify(data) }),
  getProfile: () => request<any>('/users/profile'),

  // Posts
  getPosts: (params?: { lat?: number; lng?: number; radius?: number; category?: string; sort?: string }) => {
    const q = new URLSearchParams();
    if (params?.lat !== undefined) q.append('lat', params.lat.toString());
    if (params?.lng !== undefined) q.append('lng', params.lng.toString());
    if (params?.radius) q.append('radius', params.radius.toString());
    if (params?.category) q.append('category', params.category);
    if (params?.sort) q.append('sort', params.sort);
    return request<any>(`/posts?${q.toString()}`);
  },
  createPost: (data: any) => request<any>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  getPost: (id: string) => request<any>(`/posts/${id}`),
  deletePost: (id: string) => request<any>(`/posts/${id}`, { method: 'DELETE' }),
  addComment: (postId: string, content: string) =>
    request<any>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  getComments: (postId: string) => request<any>(`/posts/${postId}/comments`),
  toggleReaction: (postId: string, type: string) =>
    request<any>(`/posts/${postId}/reactions`, { method: 'POST', body: JSON.stringify({ type }) }),

  // Businesses
  getBusinesses: (params?: { lat?: number; lng?: number; radius?: number; category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.lat !== undefined) q.append('lat', params.lat.toString());
    if (params?.lng !== undefined) q.append('lng', params.lng.toString());
    if (params?.radius) q.append('radius', params.radius.toString());
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    return request<any>(`/businesses?${q.toString()}`);
  },
  createBusiness: (data: any) => request<any>('/businesses', { method: 'POST', body: JSON.stringify(data) }),

  // Events
  getEvents: (params?: { lat?: number; lng?: number; radius?: number }) => {
    const q = new URLSearchParams();
    if (params?.lat !== undefined) q.append('lat', params.lat.toString());
    if (params?.lng !== undefined) q.append('lng', params.lng.toString());
    if (params?.radius) q.append('radius', params.radius.toString());
    return request<any>(`/events?${q.toString()}`);
  },
  createEvent: (data: any) => request<any>('/events', { method: 'POST', body: JSON.stringify(data) }),
  joinEvent: (id: string) => request<any>(`/events/${id}/join`, { method: 'POST' }),

  // Help
  getHelpRequests: (params?: { lat?: number; lng?: number; radius?: number; urgency?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.lat !== undefined) q.append('lat', params.lat.toString());
    if (params?.lng !== undefined) q.append('lng', params.lng.toString());
    if (params?.radius) q.append('radius', params.radius.toString());
    if (params?.urgency) q.append('urgency', params.urgency);
    if (params?.status) q.append('status', params.status);
    return request<any>(`/help?${q.toString()}`);
  },
  createHelpRequest: (data: any) => request<any>('/help', { method: 'POST', body: JSON.stringify(data) }),
  offerHelp: (id: string, data: { note: string; contact?: string }) =>
    request<any>(`/help/${id}/offers`, { method: 'POST', body: JSON.stringify(data) }),

  // Lost & Found
  getLostFound: (params?: { lat?: number; lng?: number; radius?: number; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.lat !== undefined) q.append('lat', params.lat.toString());
    if (params?.lng !== undefined) q.append('lng', params.lng.toString());
    if (params?.radius) q.append('radius', params.radius.toString());
    if (params?.category) q.append('category', params.category);
    if (params?.status) q.append('status', params.status);
    return request<any>(`/lost-found?${q.toString()}`);
  },
  createLostFound: (data: any) => request<any>('/lost-found', { method: 'POST', body: JSON.stringify(data) }),
  resolveLostFound: (id: string) => request<any>(`/lost-found/${id}/resolve`, { method: 'PATCH' }),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),

  // Search
  search: (keyword: string) => request<any>(`/search?q=${encodeURIComponent(keyword)}`),

  // Alerts
  getAlerts: (lat?: number, lng?: number) => {
    const q = new URLSearchParams();
    if (lat !== undefined) q.append('lat', lat.toString());
    if (lng !== undefined) q.append('lng', lng.toString());
    return request<any>(`/alerts?${q.toString()}`);
  },
  createAlert: (data: any) => request<any>('/alerts', { method: 'POST', body: JSON.stringify(data) }),

  // System
  getSystemStatus: () => request<any>('/system/status'),
};
