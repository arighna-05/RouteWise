import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Search, 
  Loader2 
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { POPULAR_DESTINATIONS } from '../../services/mockDestinations';
import { searchCities } from '../../services/weatherApi';
import type { City } from '../../types/travel';

export const NewTripModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { createNewTrip } = useTrip();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City>(POPULAR_DESTINATIONS[0]);
  const [tripTitle, setTripTitle] = useState('');
  const [daysCount, setDaysCount] = useState<number>(4);
  const [budget, setBudget] = useState<number>(1500);

  if (!isOpen) return null;

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim() || val.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchCities(val);
      setSearchResults(res);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = tripTitle.trim() || `Adventure to ${selectedCity.name}`;
    createNewTrip(selectedCity, daysCount, finalTitle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card rounded-3xl w-full max-w-lg p-6 border border-slate-700/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl gradient-accent text-white shadow-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Travel Plan</h2>
              <p className="text-xs text-slate-400">Set up your next unforgettable journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Destination City
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search any destination city..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-sky-400 animate-spin absolute right-3 top-2.5" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-36 overflow-y-auto bg-slate-900/95 border border-slate-800 rounded-xl mb-3 p-1">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCity(c);
                      setSearchResults([]);
                      setSearchQuery(c.name);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                  >
                    <span>{c.name}, {c.country}</span>
                    <span className="font-mono text-[10px] text-slate-400">{c.countryCode}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {POPULAR_DESTINATIONS.slice(0, 4).map((c) => {
                const isSelected = selectedCity.name === c.name;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCity(c)}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 shadow-sm'
                        : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <img 
                      src={c.image} 
                      alt={c.name} 
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <span className="text-[11px] font-semibold text-white truncate w-full">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <img 
              src={selectedCity.image} 
              alt={selectedCity.name} 
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">
                {selectedCity.name}, {selectedCity.country}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {selectedCity.description}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Trip Title
            </label>
            <input
              type="text"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              placeholder={`Trip to ${selectedCity.name}`}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={daysCount}
                onChange={(e) => setDaysCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Budget Goal ($)
              </label>
              <input
                type="number"
                min="100"
                step="50"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 500)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl gradient-accent text-white text-xs font-bold shadow-glow hover:opacity-95 transition-transform active:scale-95"
            >
              Create Trip & Itinerary
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
