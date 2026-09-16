import React from 'react';
import { MapPin, ShieldCheck, HeartHandshake, Store, Calendar, Radio, Users, ChevronRight, Lock } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-gray-200/80 bg-white/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#005D42] flex items-center justify-center text-white shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-extrabold text-[#005D42] tracking-tight font-headline">HyperLocal</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[11px] font-medium text-gray-500 tracking-wide mt-0.5">Your Area. Your People.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#005D42] px-3 py-2 rounded-xl transition"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="bg-[#005D42] hover:bg-[#047857] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
            >
              Join My Neighborhood
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#005D42] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#005D42]" />
            <span>Verified Neighborhood Commons · Real Geolocation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight font-headline leading-[1.15]">
            Connect with your <span className="text-[#005D42]">real geographical</span> community.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed">
            HyperLocal is a production-grade digital commons. Discover nearby urgent requests, join local sports matches, support neighborhood shops, and stay safe with authentic civic notices.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto bg-[#005D42] hover:bg-[#047857] text-white px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            >
              <span>Get Started with Your Local Area</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 px-6 py-3.5 rounded-xl font-semibold text-sm transition"
            >
              I already have an account
            </button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>JWT Authentication & bcrypt Hashing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real Geolocation & 2dsphere Indexes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="bg-white border-t border-gray-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-gray-900 font-headline">Engineered for Real Neighbors</h2>
            <p className="text-sm text-gray-600 mt-2">Zero mock data. Everything is published by real residents and stored securely in MongoDB.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FBFBFA] border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Urgent Help & Social Work</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Connect directly with nearby blood donors, medicine deliveries, emergency assistance, and mutual community aid.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFBFA] border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#005D42] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Sports & Meetups</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Find players for turf cricket, tennis matches, weekend jogging, tree plantation drives, and local cultural celebrations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFBFA] border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#006A63] flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Verified Local Shops</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Discover pharmacies, organic grocers, bakeries, and repair services within walking distance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 bg-white text-center text-xs text-gray-500">
        <p>© 2025 HyperLocal Platform. Built with Express, MongoDB Atlas, and Real Geolocation.</p>
      </footer>
    </div>
  );
};
