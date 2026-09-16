import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, SystemStatus } from '../types/index.ts';
import { api, getAuthToken, setAuthToken } from '../services/api.ts';

interface Coords {
  lat: number;
  lng: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasLocation: boolean;
  locationPermission: 'granted' | 'denied' | 'prompt';
  userCoords: Coords | null;
  userArea: string;
  systemStatus: SystemStatus | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  detectBrowserLocation: () => Promise<{ lat: number; lng: number; areaName: string }>;
  setUserLocation: (lat: number, lng: number, areaName?: string) => Promise<void>;
  setLocationPermission: (perm: 'granted' | 'denied' | 'prompt') => void;
  setUserArea: (area: string) => void;
  refreshUser: () => Promise<void>;
  refreshSystemStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Real Geolocation states - no hardcoded locations
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [userArea, setUserArea] = useState<string>('');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const refreshSystemStatus = useCallback(async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (e) {
      console.warn('System status check failed:', e);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = getAuthToken();
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
        if (data.user.location?.coordinates && data.user.location.coordinates[0] !== 0) {
          const [lng, lat] = data.user.location.coordinates;
          setUserCoords({ lat, lng });
          setLocationPermission('granted');
        }
        if (data.user.areaName) {
          setUserArea(data.user.areaName);
        }
      }
    } catch (err) {
      console.warn('Session verification failed, logging out');
      setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    refreshSystemStatus();
  }, [refreshUser, refreshSystemStatus]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.user.location?.coordinates && res.user.location.coordinates[0] !== 0) {
      const [lng, lat] = res.user.location.coordinates;
      setUserCoords({ lat, lng });
      setLocationPermission('granted');
    }
    if (res.user.areaName) {
      setUserArea(res.user.areaName);
    }
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.user.location?.coordinates && res.user.location.coordinates[0] !== 0) {
      const [lng, lat] = res.user.location.coordinates;
      setUserCoords({ lat, lng });
      setLocationPermission('granted');
    }
    if (res.user.areaName) {
      setUserArea(res.user.areaName);
    }
  };

  const logout = () => {
    api.logout().catch(() => {});
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setUserCoords(null);
    setUserArea('');
    setLocationPermission('prompt');
  };

  const setUserLocation = async (lat: number, lng: number, areaName?: string) => {
    const resolvedArea = areaName || userArea || 'Local Area';
    setUserCoords({ lat, lng });
    setUserArea(resolvedArea);
    setLocationPermission('granted');

    if (token) {
      try {
        const res = await api.updateLocation({
          latitude: lat,
          longitude: lng,
          areaName: resolvedArea,
        });
        if (res.user) {
          setUser(res.user);
        }
      } catch (e) {
        console.error('Failed to sync location to backend:', e);
      }
    }
  };

  const detectBrowserLocation = useCallback(async (): Promise<{ lat: number; lng: number; areaName: string }> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const err = new Error('Browser Geolocation API is not supported on this device/browser.');
        setLocationPermission('denied');
        reject(err);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let resolvedArea = '';

          // Real reverse geocoding via OpenStreetMap Nominatim
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (res.ok) {
              const data = await res.json();
              if (data.address) {
                resolvedArea =
                  data.address.suburb ||
                  data.address.neighbourhood ||
                  data.address.quarter ||
                  data.address.residential ||
                  data.address.village ||
                  data.address.city_district ||
                  data.address.town ||
                  data.address.city ||
                  '';
              }
            }
          } catch (geoErr) {
            console.warn('Reverse geocoding error:', geoErr);
          }

          if (!resolvedArea) {
            resolvedArea = `Area (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`;
          }

          await setUserLocation(lat, lng, resolvedArea);
          resolve({ lat, lng, areaName: resolvedArea });
        },
        (err) => {
          console.warn('Browser geolocation denied or error:', err.message);
          setLocationPermission('denied');
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        }
      );
    });
  }, [token, userArea]);

  // Attempt real browser geolocation if permission was already granted in browser
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && (navigator as any).permissions?.query) {
      (navigator as any).permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus: any) => {
          if (permissionStatus.state === 'granted') {
            detectBrowserLocation().catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [detectBrowserLocation]);

  const hasLocation = Boolean(
    userCoords && userCoords.lat !== 0 && userCoords.lng !== 0 && locationPermission === 'granted'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        hasLocation,
        locationPermission,
        userCoords,
        userArea,
        systemStatus,
        login,
        register,
        logout,
        detectBrowserLocation,
        setUserLocation,
        setLocationPermission,
        setUserArea,
        refreshUser,
        refreshSystemStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
