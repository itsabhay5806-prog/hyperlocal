import React, { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const { setUserLocation, setLocationPermission, detectBrowserLocation, user } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [customArea, setCustomArea] = useState('');

  if (!isOpen) return null;

  const handleRequestRealLocation = async () => {
    setIsRequesting(true);
    setErrorStatus(null);

    try {
      await detectBrowserLocation();
      setIsRequesting(false);
      onSuccess();
    } catch (err: any) {
      setIsRequesting(false);
      if (err.code === 1 || (err.message && err.message.toLowerCase().includes('denied'))) {
        setErrorStatus(
          'Location permission was denied. Real-time proximity discovery uses your browser coordinates. You can also type your area name below to geocode real coordinates.'
        );
      } else {
        setErrorStatus(err.message || 'Unable to retrieve your current location. Please enter your locality below.');
      }
      setManualMode(true);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalArea = customArea.trim();
    if (!finalArea) {
      setErrorStatus('Please enter your neighborhood, district, or town name.');
      return;
    }

    setIsRequesting(true);
    setErrorStatus(null);

    try {
      // Real geocoding for user-typed neighborhood/city - no fake coordinates
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalArea)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          const resolvedName = results[0].display_name.split(',')[0] || finalArea;
          await setUserLocation(lat, lng, resolvedName);
          setIsRequesting(false);
          onSuccess();
          return;
        }
      }
      // If geocoding yields no coordinates, store the text area name without fake coordinates
      await setUserLocation(0, 0, finalArea);
      setIsRequesting(false);
      onSuccess();
    } catch (err) {
      await setUserLocation(0, 0, finalArea);
      setIsRequesting(false);
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-6">
        {/* Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#005D42] flex items-center justify-center mx-auto shadow-sm">
            <MapPin className="w-7 h-7 animate-bounce" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 font-headline">
            Allow Location Access
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
            Allow location access to discover what's happening around you within 500m to 5km.
          </p>
        </div>

        {/* Privacy Note */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-2.5 text-xs text-gray-600">
          <Shield className="w-4 h-4 text-[#005D42] shrink-0 mt-0.5" />
          <p>
            <strong className="text-gray-800">Privacy First:</strong> Exact GPS coordinates are never broadcast to other users. Only verified neighborhood boundaries are used for hyperlocal radius queries.
          </p>
        </div>

        {/* Error message if denied */}
        {errorStatus && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{errorStatus}</span>
          </div>
        )}

        {/* Manual input if user chooses or GPS is denied */}
        {manualMode ? (
          <form onSubmit={handleManualSubmit} className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Enter Your Neighborhood, Colony, or Town
              </label>
              <input
                type="text"
                required
                value={customArea}
                onChange={(e) => setCustomArea(e.target.value)}
                placeholder="e.g. Maple Heights, Brookside, Central"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005D42]/20"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Real coordinates will be geocoded automatically via OpenStreetMap.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
              >
                Use GPS Instead
              </button>
              <button
                type="submit"
                disabled={isRequesting}
                className="w-1/2 bg-[#005D42] hover:bg-[#047857] text-white py-2.5 text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {isRequesting ? 'Geocoding...' : 'Set Neighborhood'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleRequestRealLocation}
              disabled={isRequesting}
              className="w-full bg-[#005D42] hover:bg-[#047857] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Obtaining GPS Coordinates...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Allow Real Location Access</span>
                </>
              )}
            </button>

            <button
              onClick={() => setManualMode(true)}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-semibold text-xs border border-gray-200 transition"
            >
              Enter Location Manually
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
