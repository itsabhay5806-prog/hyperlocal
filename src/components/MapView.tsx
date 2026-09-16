import React, { useEffect, useRef, useState } from 'react';
import { Post, Business, EventItem, HelpRequestItem } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { MapPin, Navigation, Info, AlertCircle, Loader2 } from 'lucide-react';
import L from 'leaflet';

interface MapViewProps {
  posts: Post[];
  businesses: Business[];
  events: EventItem[];
  helpRequests: HelpRequestItem[];
  radiusKm: number;
}

export const MapView: React.FC<MapViewProps> = ({
  posts,
  businesses,
  events,
  helpRequests,
  radiusKm,
}) => {
  const { userCoords, userArea, detectBrowserLocation, systemStatus } = useAuth();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const hasRealCoords = Boolean(
    userCoords &&
    typeof userCoords.lat === 'number' &&
    typeof userCoords.lng === 'number' &&
    (userCoords.lat !== 0 || userCoords.lng !== 0) &&
    !isNaN(userCoords.lat) &&
    !isNaN(userCoords.lng)
  );

  const handleEnableLocation = async () => {
    setIsDetecting(true);
    setDetectError(null);
    try {
      await detectBrowserLocation();
    } catch (err: any) {
      setDetectError(err.message || 'Unable to access browser geolocation. Please allow location permissions in your browser.');
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    if (!hasRealCoords || !mapContainerRef.current || !userCoords) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userCoords.lat, userCoords.lng],
        zoom: radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(
        [userCoords.lat, userCoords.lng],
        radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : 13
      );
    }

    return () => {
      // Clean up map instance when unmounting
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hasRealCoords, userCoords?.lat, userCoords?.lng]);

  // Update markers and circle whenever coordinates or real items change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !hasRealCoords || !userCoords) return;

    markersLayerRef.current.clearLayers();

    // Real user location pulsing marker and radius circle
    const userMarkerIcon = L.divIcon({
      className: 'custom-user-pin',
      html: `<div style="background-color: #005D42; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,93,66,0.5);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userMarkerIcon }).bindPopup(
      `<div style="font-family: inherit; font-size: 12px;"><strong>Your Real Location</strong><br/>${userArea || 'Current GPS Coords'}</div>`
    );
    markersLayerRef.current.addLayer(userMarker);

    const radiusCircle = L.circle([userCoords.lat, userCoords.lng], {
      radius: radiusKm * 1000,
      color: '#005D42',
      weight: 1.5,
      fillColor: '#005D42',
      fillOpacity: 0.08,
    });
    markersLayerRef.current.addLayer(radiusCircle);

    // Add Post Markers (only if real coordinates exist)
    posts.forEach((p) => {
      if (p.location?.coordinates && p.location.coordinates[0] !== 0) {
        const [pLng, pLat] = p.location.coordinates;
        const postIcon = L.divIcon({
          className: 'custom-post-pin',
          html: `<div style="background-color: #047857; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">P</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const m = L.marker([pLat, pLng], { icon: postIcon }).bindPopup(
          `<div style="font-family: inherit; font-size: 12px; max-width: 200px;">
            <strong>${p.category}</strong><br/>
            ${p.content.slice(0, 80)}...<br/>
            <small style="color: #666;">By ${p.author?.name || 'Neighbor'}</small>
          </div>`
        );
        markersLayerRef.current?.addLayer(m);
      }
    });

    // Add Business Markers (only real user-created businesses)
    businesses.forEach((b) => {
      if (b.location?.coordinates && b.location.coordinates[0] !== 0) {
        const [bLng, bLat] = b.location.coordinates;
        const bizIcon = L.divIcon({
          className: 'custom-biz-pin',
          html: `<div style="background-color: #006A63; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">S</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const m = L.marker([bLat, bLng], { icon: bizIcon }).bindPopup(
          `<div style="font-family: inherit; font-size: 12px; max-width: 200px;">
            <strong>${b.businessName}</strong><br/>
            ${b.category} · ${b.address}<br/>
            <small style="color: #006A63;">${b.phone}</small>
          </div>`
        );
        markersLayerRef.current?.addLayer(m);
      }
    });

    // Add Event Markers (only real events)
    events.forEach((ev) => {
      if (ev.location?.coordinates && ev.location.coordinates[0] !== 0) {
        const [eLng, eLat] = ev.location.coordinates;
        const evIcon = L.divIcon({
          className: 'custom-event-pin',
          html: `<div style="background-color: #2563EB; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">E</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const m = L.marker([eLat, eLng], { icon: evIcon }).bindPopup(
          `<div style="font-family: inherit; font-size: 12px; max-width: 200px;">
            <strong>${ev.title}</strong><br/>
            ${ev.date} at ${ev.startTime}<br/>
            <small style="color: #2563EB;">${ev.participantsCount} attending</small>
          </div>`
        );
        markersLayerRef.current?.addLayer(m);
      }
    });

    // Add Urgent Help Markers (only real help requests)
    helpRequests.forEach((hr) => {
      if (hr.location?.coordinates && hr.location.coordinates[0] !== 0) {
        const [hLng, hLat] = hr.location.coordinates;
        const helpIcon = L.divIcon({
          className: 'custom-help-pin',
          html: `<div style="background-color: #DC2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">!</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const m = L.marker([hLat, hLng], { icon: helpIcon }).bindPopup(
          `<div style="font-family: inherit; font-size: 12px; max-width: 200px;">
            <strong style="color: #DC2626;">HELP: ${hr.title}</strong><br/>
            ${hr.description.slice(0, 80)}...
          </div>`
        );
        markersLayerRef.current?.addLayer(m);
      }
    });
  }, [posts, businesses, events, helpRequests, radiusKm, hasRealCoords, userCoords?.lat, userCoords?.lng, userArea]);

  const isGoogleMapsConfigured = Boolean(systemStatus?.optionalServices?.googleMaps?.configured);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 card-shadow overflow-hidden flex flex-col h-[560px]">
      {/* Map Control Bar */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#005D42]" />
          <span className="font-bold text-gray-800">
            {hasRealCoords ? `Community Map: ${userArea || 'Current Coordinates'}` : 'Community Map'}
          </span>
          {hasRealCoords && (
            <span className="text-gray-500">({radiusKm} km radius circle)</span>
          )}
        </div>

        {/* Integration Status Badge */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#005D42] border border-emerald-200 font-medium">
            Radar: OpenStreetMap Active
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
            Google Maps: {isGoogleMapsConfigured ? 'Configured' : 'Optional (Not Configured)'}
          </span>
        </div>

        {/* Legend */}
        {hasRealCoords && (
          <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#005D42]" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Posts</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span>Shops</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Events</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>Help</span>
            </div>
          </div>
        )}
      </div>

      {/* Map or Unconfigured Location Placeholder */}
      {!hasRealCoords ? (
        <div className="flex-1 w-full bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#005D42] flex items-center justify-center shadow-sm">
            <Navigation className="w-8 h-8 animate-pulse" />
          </div>

          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-bold text-gray-900 font-headline">Real Browser Location Required</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              In accordance with strict privacy and accuracy standards, this map does not use fake or simulated coordinates.
              Please enable your real browser location via <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] text-gray-800">navigator.geolocation.getCurrentPosition()</code> to render your neighborhood radar and discover posts within {radiusKm}km.
            </p>
          </div>

          {detectError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 max-w-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{detectError}</span>
            </div>
          )}

          <button
            onClick={handleEnableLocation}
            disabled={isDetecting}
            className="bg-[#005D42] hover:bg-[#047857] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Requesting Browser Geolocation...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Detect Real Browser Location</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div ref={mapContainerRef} className="flex-1 w-full relative z-10" />
      )}

      {/* Bottom Privacy Disclaimer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-gray-500">
        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span>Pins show verified coordinates stored as GeoJSON in MongoDB. No fake locations or mock entities are displayed.</span>
      </div>
    </div>
  );
};
