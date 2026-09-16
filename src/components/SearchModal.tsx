import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, User, Store, Calendar, HeartHandshake, HelpCircle, FileText } from 'lucide-react';
import { api } from '../services/api.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost?: (postId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'businesses' | 'events' | 'help'>('all');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Input Bar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, verified neighbors, local shops, events..."
            className="flex-1 text-sm bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[#005D42]" />}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-12 text-center text-xs text-gray-400 space-y-1">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p>Type anything to search the real community database.</p>
              <p className="text-[11px] text-gray-400">Posts · Verified Neighbors · Shops · Events · Help Requests</p>
            </div>
          ) : loading && !results ? (
            <div className="py-12 text-center text-xs text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#005D42] mx-auto mb-2" />
              <span>Searching real database...</span>
            </div>
          ) : results && results.totalCount === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No community matches found for "{query}".
            </div>
          ) : results ? (
            <div className="space-y-4">
              {/* Posts */}
              {results.posts?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Community Posts ({results.posts.length})
                  </span>
                  {results.posts.map((p: any) => (
                    <div key={p._id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition text-xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1">
                        <span>{p.author?.name || 'Neighbor'} · {p.category}</span>
                        <span>{p.areaName}</span>
                      </div>
                      <p className="text-gray-800 line-clamp-2">{p.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Neighbors / Users */}
              {results.users?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Neighbors ({results.users.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.users.map((u: any) => (
                      <div key={u._id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5 text-xs">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{u.areaName || 'Resident'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Businesses */}
              {results.businesses?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                    Local Shops ({results.businesses.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.businesses.map((b: any) => (
                      <div key={b._id} className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-xs space-y-0.5">
                        <p className="font-bold text-gray-900">{b.businessName}</p>
                        <p className="text-[11px] text-gray-600 truncate">{b.category} · {b.address}</p>
                        <p className="text-[11px] font-semibold text-teal-800">{b.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {results.events?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Events ({results.events.length})
                  </span>
                  {results.events.map((ev: any) => (
                    <div key={ev._id} className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                      <p className="font-bold text-gray-900">{ev.title}</p>
                      <p className="text-[11px] text-gray-600">{ev.date} · {ev.startTime}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Help Requests */}
              {results.helpRequests?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                    Help Requests ({results.helpRequests.length})
                  </span>
                  {results.helpRequests.map((hr: any) => (
                    <div key={hr._id} className="p-2.5 rounded-xl bg-red-50/50 border border-red-100 text-xs">
                      <p className="font-bold text-red-900">{hr.title}</p>
                      <p className="text-[11px] text-gray-600 line-clamp-1">{hr.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
