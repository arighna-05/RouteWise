import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  X,
  Users,
  DollarSign,
  Compass,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { useViewMode } from '../../context/ViewModeContext';
import { searchCities, detectCurrency } from '../../services/weatherApi';
import { POPULAR_DESTINATIONS } from '../../services/mockDestinations';
import { NordicDatePicker } from '../common/NordicDatePicker';
import { FamilyMembersSelector, DEFAULT_FAMILY_MEMBERS, getDerivedAgeGroup } from '../common/FamilyMembersSelector';
import { AITourPlanNotesModal } from '../itinerary/AITourPlanNotesModal';
import type { City, TravelerGroupProfile, FamilyMember } from '../../types/travel';

const TRENDING_DESTINATIONS = [
  {
    id: 'darjeeling-quick',
    name: 'Darjeeling',
    country: 'India',
    countryCode: 'IN',
    latitude: 27.0410,
    longitude: 88.2663,
    currency: 'INR (₹)',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    description: 'Queen of the Hills: Tiger Hill sunrise, Mall Road, toy train, and lush Himalayan tea gardens.',
  },
  {
    id: 'sikkim-quick',
    name: 'Sikkim',
    country: 'India',
    countryCode: 'IN',
    latitude: 27.5330,
    longitude: 88.5122,
    currency: 'INR (₹)',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    description: 'Alpine lakes, sacred monasteries, and snow-capped Himalayan peaks in Northeast India.',
  },
  {
    id: 'arunachal-quick',
    name: 'Arunachal Pradesh',
    country: 'India',
    countryCode: 'IN',
    latitude: 28.2180,
    longitude: 94.7278,
    currency: 'INR (₹)',
    image: 'https://images.unsplash.com/photo-1626014303757-6466336e8494?auto=format&fit=crop&w=800&q=80',
    description: 'The Land of Dawn-Lit Mountains with historic Tawang Monastery and pristine river valleys.',
  },
  ...POPULAR_DESTINATIONS.slice(0, 3),
];


const TRAVEL_STYLES = [
  'Sightseeing & Culture',
  'Relaxed & Leisurely',
  'Adventure & Nature',
  'Food & Culinary Heritage'
];

export const DestinationSearchHero: React.FC = () => {
  const { startPlanningForCity, activeTrip, weather, setIsSearchMode } = useTrip();
  const { isMobileView } = useViewMode();

  // Search state
  const [query, setQuery] = useState<string>(activeTrip?.city?.name || 'Darjeeling');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<City>(
    activeTrip?.city || TRENDING_DESTINATIONS[0] as City
  );
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Planning mode modal state
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<'manual' | 'ai'>('manual');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);

  // Common planning parameters
  const [origin, setOrigin] = useState<string>(activeTrip?.origin || 'Kolkata');
  const [startDate, setStartDate] = useState<string>(
    activeTrip?.startDate || new Date().toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState<number>(activeTrip?.daysCount || 3);

  // Family members & exact ages
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    activeTrip?.groupProfile?.members || DEFAULT_FAMILY_MEMBERS
  );

  // AI-specific parameters
  const isINR = (selectedCity.currency || 'INR').includes('INR');
  const [budget, setBudget] = useState<number>(isINR ? 25000 : 1500);
  const [travelStyle, setTravelStyle] = useState<string>('Sightseeing & Culture');

  // Debounced search for worldwide cities & regions
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(trimmed);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setQuery(city.name);
    setShowDropdown(false);
    // Update budget default based on currency
    const currIsINR = (city.currency || '').includes('INR');
    setBudget(currIsINR ? 25000 : 1500);
  };

  const handleClearQuery = () => {
    setQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Step 1 Submit: Open Mode Selection Modal
  const handleOpenModeSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setIsModeModalOpen(true);
      return;
    }

    // Check if match in search results
    if (searchResults.length > 0) {
      const topMatch = searchResults.find(r => r.name.toLowerCase() === trimmed.toLowerCase()) || searchResults[0];
      setSelectedCity(topMatch);
      setIsModeModalOpen(true);
      return;
    }

    // Check if selectedCity matches
    if (selectedCity && selectedCity.name.toLowerCase() === trimmed.toLowerCase()) {
      setIsModeModalOpen(true);
      return;
    }

    // Geocode directly if not found
    setIsSearching(true);
    try {
      const liveResults = await searchCities(trimmed);
      if (liveResults && liveResults.length > 0) {
        const best = liveResults.find(r => r.name.toLowerCase() === trimmed.toLowerCase()) || liveResults[0];
        setSelectedCity(best);
        setIsModeModalOpen(true);
        return;
      }
    } catch (err) {
      console.warn('Direct geocoding on submit failed:', err);
    } finally {
      setIsSearching(false);
    }

    // Fallback custom city
    const customCity: City = {
      id: `place-${trimmed.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: trimmed,
      country: selectedCity?.country || 'Global Destination',
      countryCode: selectedCity?.countryCode || '',
      latitude: selectedCity?.latitude || 27.0410,
      longitude: selectedCity?.longitude || 88.2663,
      currency: detectCurrency(selectedCity?.countryCode, trimmed),
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      description: `Explore the attractions, culture, and sights of ${trimmed}.`,
    };
    setSelectedCity(customCity);
    setIsModeModalOpen(true);
  };

  // Step 2A: Start Manual Planning
  const handleStartManualPlan = () => {
    const derivedAgeGroup = getDerivedAgeGroup(familyMembers);
    const profile: TravelerGroupProfile = {
      numberOfHeads: familyMembers.length,
      ageGroup: derivedAgeGroup,
      travelStyle,
      members: familyMembers,
    };
    startPlanningForCity(
      selectedCity,
      startDate,
      durationDays,
      origin,
      'manual',
      profile,
      undefined,
      budget
    );
    setIsModeModalOpen(false);
  };

  // Step 2B: Open AI Tour Plan Notes Modal
  const handleGenerateAIPlan = () => {
    setIsModeModalOpen(false);
    setIsNotesModalOpen(true);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-2 sm:px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Background ambient Nordic glow (desktop only) */}
      {!isMobileView && (
        <>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#88C0D0]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#81A1C1]/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      <div className="max-w-3xl w-full mx-auto relative z-10 space-y-6 sm:space-y-8 text-center">
        
        {/* Tagline */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm border ${
          isMobileView
            ? 'bg-[#EEF0FF] border-[#5D5FEF]/20 text-[#5D5FEF]'
            : 'bg-[#88C0D0]/15 border-[#88C0D0]/30 text-[#88C0D0]'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-[#EBCB8B] animate-pulse" />
          <span>Simple Travel Planner & Gemini Suggestions</span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className={`text-3xl sm:text-6xl font-black tracking-tight leading-tight ${
            isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'
          }`}>
            Where are you <span className={isMobileView ? 'text-[#5D5FEF]' : 'gradient-text'}>traveling next?</span>
          </h1>
          <p className={`text-sm sm:text-lg max-w-xl mx-auto font-normal ${
            isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
          }`}>
            Choose your destination, then pick between a personal note-taking planner or a complete AI-generated tour plan.
          </p>
        </div>

        {/* Quick Resume In-Progress Trip Banner (if an active trip exists) */}
        {activeTrip && (
          <div className={`w-full max-w-xl mx-auto p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm border transition-all ${
            isMobileView
              ? 'bg-white border-[#E2E6F0] text-[#1A1D2E]'
              : 'bg-[#242933] border-[#3B4252] text-[#ECEFF4]'
          }`}>
            <div className="flex items-center gap-2.5 text-left min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isMobileView ? 'bg-[#EEF0FF] text-[#5D5FEF]' : 'bg-[#88C0D0]/20 text-[#88C0D0]'
              }`}>
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">
                  Active Plan: <span className={isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}>{activeTrip.cityName}</span> ({activeTrip.daysCount} Days)
                </div>
                <div className={`text-[10px] truncate ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/70'}`}>
                  {activeTrip.items.length} activities scheduled • {activeTrip.origin} ➔ {activeTrip.cityName}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSearchMode(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${
                isMobileView
                  ? 'bg-[#5D5FEF] text-white hover:bg-[#4D4FD9]'
                  : 'bg-[#88C0D0] text-[#1A1E24] hover:bg-[#81A1C1]'
              }`}
            >
              <span>Resume Trip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Setup Card */}
        <form 
          onSubmit={handleOpenModeSelection}
          className={`rounded-3xl p-5 sm:p-8 text-left space-y-6 border ${
            isMobileView
              ? 'bg-white border-[#E8ECF5] shadow-[0_4px_25px_rgba(20,30,50,0.06)]'
              : 'glass-card border-[#3B4252] shadow-2xl'
          }`}
        >
          {/* Destination Search Bar */}
          <div className="space-y-2 relative" ref={searchRef}>
            <label className={`block text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isMobileView ? 'text-[#1A1D2E]' : 'text-[#D8DEE9]'
            }`}>
              <MapPin className={`w-3.5 h-3.5 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
              <span>Destination City, State, or Region</span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 ${isMobileView ? 'text-[#94A3B8]' : 'text-[#4C566A]'}`} />
              </div>
              
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (query.trim().length >= 2) setShowDropdown(true);
                }}
                placeholder="Search places like Darjeeling, Sikkim, Paris, Tokyo..."
                className={`w-full pl-12 pr-24 py-3.5 rounded-2xl border text-sm sm:text-base font-medium shadow-inner focus:outline-none transition-all ${
                  isMobileView
                    ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#5D5FEF] focus:border-transparent'
                    : 'bg-[#242933] border-[#3B4252] text-[#ECEFF4] placeholder-[#4C566A] focus:ring-2 focus:ring-[#88C0D0] focus:border-transparent'
                }`}
              />

              {/* Action buttons inside search bar: Spinner and Clear (X) */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                {isSearching && (
                  <Loader2 className={`w-5 h-5 animate-spin ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                )}
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className={`p-1 rounded-lg transition-colors ${
                      isMobileView
                        ? 'text-[#94A3B8] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                        : 'text-[#4C566A] hover:text-[#ECEFF4] hover:bg-[#3B4252]'
                    }`}
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className={`absolute z-50 left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl shadow-2xl divide-y p-1 border ${
                isMobileView
                  ? 'bg-white border-[#E2E6F0] divide-[#F1F3F9] text-[#1A1D2E]'
                  : 'bg-[#242933] border-[#3B4252] divide-[#2E3440] text-[#ECEFF4]'
              }`}>
                {searchResults.length > 0 ? (
                  searchResults.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`w-full px-4 py-3 text-left rounded-xl flex items-center justify-between transition-colors group ${
                        isMobileView ? 'hover:bg-[#F4F6FB]' : 'hover:bg-[#3B4252]/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg font-bold transition-colors ${
                          isMobileView
                            ? 'bg-[#EEF0FF] text-[#5D5FEF] group-hover:bg-[#5D5FEF] group-hover:text-white'
                            : 'bg-[#88C0D0]/15 text-[#88C0D0] group-hover:bg-[#88C0D0] group-hover:text-[#1A1E24]'
                        }`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-semibold text-sm ${
                            isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4] group-hover:text-white'
                          }`}>
                            {city.name}
                          </div>
                          <div className={`text-xs ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/70'}`}>
                            {city.country}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold ${
                        isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'
                      }`}>
                        {city.currency || 'INR (₹)'}
                      </span>
                    </button>
                  ))
                ) : !isSearching && query.trim().length >= 2 ? (
                  <div className={`p-3 text-center text-xs space-y-2 ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]'}`}>
                    <p>No automatic match found for "{query}".</p>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCity({
                          id: `custom-${query.trim().toLowerCase().replace(/\s+/g, '-')}`,
                          name: query.trim(),
                          country: 'Destination',
                          countryCode: '',
                          latitude: 27.0410,
                          longitude: 88.2663,
                          currency: 'INR (₹)',
                          description: `Explore the wonders of ${query.trim()}.`
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                        isMobileView
                          ? 'bg-[#EEF0FF] text-[#5D5FEF] hover:bg-[#5D5FEF] hover:text-white'
                          : 'bg-[#88C0D0]/20 text-[#88C0D0] hover:bg-[#88C0D0] hover:text-[#1A1E24]'
                      }`}
                    >
                      Plan custom itinerary for "{query.trim()}"
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Home Screen Travel Options: Starting From, Start Date, and Family Members & Ages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
            {/* 1. Starting From */}
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
              }`}>
                <MapPin className={`w-3 h-3 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                <span>Starting From</span>
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Kolkata, Delhi"
                className={`w-full px-3 py-2 rounded-xl text-xs focus:ring-2 border transition-all ${
                  isMobileView
                    ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] placeholder-[#94A3B8] focus:ring-[#5D5FEF] shadow-sm'
                    : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-[#88C0D0]'
                }`}
              />
            </div>

            {/* 2. Start Date */}
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
              }`}>
                <Calendar className={`w-3 h-3 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                <span>Start Date</span>
              </label>
              <NordicDatePicker
                value={startDate}
                onChange={setStartDate}
              />
            </div>

            {/* 3. Family Members & Their Ages */}
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
              }`}>
                <Users className={`w-3 h-3 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                <span>Family Members & Ages</span>
              </label>
              <FamilyMembersSelector
                members={familyMembers}
                onChange={setFamilyMembers}
              />
            </div>
          </div>

          {/* Proceed Button */}
          <button
            type="submit"
            className={`w-full py-4 rounded-2xl font-extrabold text-base tracking-wide flex items-center justify-center gap-2 transition-all ${
              isMobileView
                ? 'bg-[#5D5FEF] hover:bg-[#4D4FD9] text-white shadow-lg shadow-[#5D5FEF]/25 active:scale-[0.99]'
                : 'gradient-accent hover:opacity-95 text-[#1A1E24] shadow-glow'
            }`}
          >
            <span>Proceed to Plan ({selectedCity.name})</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

      </div>

      {/* ========================================================= */}
      {/* 2-OPTION PLANNING MODE SELECTION MODAL                    */}
      {/* ========================================================= */}
      {isModeModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md animate-fade-in overflow-y-auto ${
          isMobileView ? 'bg-black/60' : 'bg-[#1A1E24]/85'
        }`}>
          <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl p-5 sm:p-8 space-y-5 text-left border ${
            isMobileView
              ? 'bg-white border-[#E2E6F0] text-[#1A1D2E]'
              : 'bg-[#242933] border-[#3B4252] text-[#ECEFF4]'
          }`}>
            
            {/* Modal Header */}
            <div className={`flex items-start justify-between gap-4 pb-4 border-b ${
              isMobileView ? 'border-[#E8ECF5]' : 'border-[#2E3440]'
            }`}>
              <div>
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1 ${
                  isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'
                }`}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Destination: {selectedCity.name}, {selectedCity.country}</span>
                </div>
                <h3 className={`text-xl sm:text-2xl font-black ${
                  isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'
                }`}>
                  How would you like to plan your trip?
                </h3>
                <p className={`text-xs mt-0.5 ${
                  isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]'
                }`}>
                  Choose between building your own personal day-wise notes or letting AI design the entire tour plan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModeModalOpen(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isMobileView
                    ? 'text-[#7E859B] hover:text-[#1A1D2E] hover:bg-[#EEF0FF]'
                    : 'text-[#D8DEE9] hover:text-white hover:bg-[#3B4252]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selection Tabs (2 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              {/* Option A: Plan Manually */}
              <button
                type="button"
                onClick={() => setSelectedMode('manual')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative space-y-3 ${
                  selectedMode === 'manual'
                    ? isMobileView
                      ? 'bg-[#EEF0FF] border-[#5D5FEF] text-[#1A1D2E] shadow-sm ring-2 ring-[#5D5FEF]/20'
                      : 'bg-[#88C0D0]/15 border-[#88C0D0] shadow-glow text-white'
                    : isMobileView
                      ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#4F566B] hover:border-[#CBD5E1]'
                      : 'bg-[#1A1E24]/60 border-[#3B4252] text-[#D8DEE9] hover:border-[#4C566A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${
                    isMobileView ? 'bg-white text-[#5D5FEF] shadow-sm' : 'bg-[#88C0D0]/20 text-[#88C0D0]'
                  }`}>
                    <Edit3 className="w-5 h-5" />
                  </div>
                  {selectedMode === 'manual' && (
                    <CheckCircle2 className={`w-5 h-5 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                  )}
                </div>
                <div>
                  <h4 className={`font-extrabold text-base ${isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'}`}>Plan Manually</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]'}`}>
                    Add spots, schedule day-wise plans, customize timings, and explore AI recommendations.
                  </p>
                </div>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isMobileView ? 'bg-[#5D5FEF]/10 text-[#5D5FEF]' : 'bg-[#88C0D0]/20 text-[#88C0D0]'
                }`}>
                  Full Freedom
                </span>
              </button>

              {/* Option B: AI Tour Planner */}
              <button
                type="button"
                onClick={() => setSelectedMode('ai')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative space-y-3 ${
                  selectedMode === 'ai'
                    ? isMobileView
                      ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#1A1D2E] shadow-sm ring-2 ring-[#7C3AED]/20'
                      : 'bg-[#B48EAD]/15 border-[#B48EAD] shadow-glow text-white'
                    : isMobileView
                      ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#4F566B] hover:border-[#CBD5E1]'
                      : 'bg-[#1A1E24]/60 border-[#3B4252] text-[#D8DEE9] hover:border-[#4C566A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${
                    isMobileView ? 'bg-white text-[#7C3AED] shadow-sm' : 'bg-[#B48EAD]/20 text-[#B48EAD]'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {selectedMode === 'ai' && (
                    <CheckCircle2 className={`w-5 h-5 ${isMobileView ? 'text-[#7C3AED]' : 'text-[#B48EAD]'}`} />
                  )}
                </div>
                <div>
                  <h4 className={`font-extrabold text-base ${isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'}`}>AI Tour Planner</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]'}`}>
                    Gemini crafts a customized day-by-day plan with travel times, weather advice, and budget management for your group.
                  </p>
                </div>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isMobileView ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'bg-[#B48EAD]/20 text-[#B48EAD]'
                }`}>
                  Tailored by Gemini
                </span>
              </button>

            </div>

            {/* Configuration Form for Selected Mode */}
            <div className="space-y-4 pt-2">
              
              {/* Origin & Dates row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Starting From Where (Origin) */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                    isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
                  }`}>
                    <MapPin className={`w-3 h-3 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                    <span>Starting From</span>
                  </label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g. Kolkata, Delhi"
                    className={`w-full px-3 py-2 rounded-xl text-xs border transition-all ${
                      isMobileView
                        ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] focus:ring-2 focus:ring-[#5D5FEF]'
                        : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]'
                    }`}
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                    isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
                  }`}>
                    <Calendar className={`w-3 h-3 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                    <span>Start Date</span>
                  </label>
                  <NordicDatePicker
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                    isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
                  }`}>
                    <Clock className={`w-3 h-3 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                    <span>Duration</span>
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl text-xs border transition-all ${
                      isMobileView
                        ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] focus:ring-2 focus:ring-[#5D5FEF]'
                        : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]'
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(n => (
                      <option key={n} value={n}>{n} Days Tour</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Family Members & Specific Ages Row (Shared across both modes) */}
              <div className="space-y-1">
                <label className={`text-xs font-bold uppercase tracking-wide flex items-center justify-between ${
                  isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
                }`}>
                  <span className="flex items-center gap-1">
                    <Users className={`w-3.5 h-3.5 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                    <span>Traveling Family Members & Specific Ages</span>
                  </span>
                  <span className={`text-[10px] font-semibold ${
                    isMobileView ? 'text-[#5D5FEF]' : 'text-[#81A1C1]'
                  }`}>
                    {getDerivedAgeGroup(familyMembers)}
                  </span>
                </label>
                <FamilyMembersSelector
                  members={familyMembers}
                  onChange={setFamilyMembers}
                />
              </div>

              {/* Extra Parameters for AI Tour Planner */}
              {selectedMode === 'ai' && (
                <div className={`space-y-4 pt-3 border-t animate-fade-in ${
                  isMobileView ? 'border-[#E8ECF5]' : 'border-[#2E3440]'
                }`}>
                  
                  {/* Budget */}
                  <div className="space-y-1">
                    <label className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                      isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
                    }`}>
                      <DollarSign className={`w-3.5 h-3.5 ${isMobileView ? 'text-[#16A34A]' : 'text-[#A3BE8C]'}`} />
                      <span>Total Group Budget ({selectedCity.currency?.split(' ')[0] || 'INR'})</span>
                    </label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                        isMobileView
                          ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] focus:ring-2 focus:ring-[#7C3AED]'
                          : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#B48EAD]'
                      }`}
                    />
                  </div>

                  {/* Travel Style */}
                  <div className="space-y-1">
                    <label className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                      isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
                    }`}>
                      <Compass className={`w-3.5 h-3.5 ${isMobileView ? 'text-[#D97706]' : 'text-[#EBCB8B]'}`} />
                      <span>Preferred Travel Style</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TRAVEL_STYLES.map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setTravelStyle(style)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            travelStyle === style
                              ? isMobileView
                                ? 'bg-[#5D5FEF] text-white shadow-sm font-bold'
                                : 'bg-[#B48EAD] text-[#1A1E24] shadow-glow font-bold'
                              : isMobileView
                                ? 'bg-[#F8FAFC] border border-[#E2E6F0] text-[#4F566B] hover:text-[#1A1D2E]'
                                : 'bg-[#1A1E24] border border-[#3B4252] text-[#D8DEE9] hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Tailoring Note banner */}
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    isMobileView
                      ? 'bg-[#EEF0FF] border-[#E0E2FD] text-[#1A1D2E]'
                      : 'bg-[#B48EAD]/10 border-[#B48EAD]/30 text-[#ECEFF4]'
                  }`}>
                    <Sparkles className={`w-4 h-4 shrink-0 ${isMobileView ? 'text-[#7C3AED]' : 'text-[#B48EAD]'}`} />
                    <span>
                      Gemini will tailor attractions, transit pace, and walking rest stops specifically for <strong>{getDerivedAgeGroup(familyMembers)}</strong>.
                    </span>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Bottom Actions */}
            <div className={`pt-4 border-t flex items-center justify-end gap-3 ${
              isMobileView ? 'border-[#E8ECF5]' : 'border-[#2E3440]'
            }`}>
              <button
                type="button"
                onClick={() => setIsModeModalOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isMobileView
                    ? 'text-[#67708A] hover:text-[#1A1D2E]'
                    : 'text-[#D8DEE9] hover:text-white'
                }`}
              >
                Cancel
              </button>

              {selectedMode === 'manual' ? (
                <button
                  type="button"
                  onClick={handleStartManualPlan}
                  className={`px-6 py-3 rounded-2xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all ${
                    isMobileView
                      ? 'bg-[#5D5FEF] hover:bg-[#4D4FD9] text-white shadow-[#5D5FEF]/25'
                      : 'bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] shadow-glow'
                  }`}
                >
                  <span>Start Planning Trip</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateAIPlan}
                  className={`px-6 py-3 rounded-2xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all ${
                    isMobileView
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#5D5FEF] hover:opacity-95 text-white shadow-[#7C3AED]/25'
                      : 'bg-gradient-to-r from-[#B48EAD] to-[#81A1C1] hover:opacity-90 text-[#1A1E24] shadow-glow'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${isMobileView ? 'text-white' : 'text-[#1A1E24]'}`} />
                  <span>Generate AI Tour Plan (Notes Format)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* AI Tour Plan Notes Modal */}
      {isNotesModalOpen && selectedCity && (
        <AITourPlanNotesModal
          isOpen={isNotesModalOpen}
          onClose={() => setIsNotesModalOpen(false)}
          city={selectedCity}
          origin={origin}
          startDate={startDate}
          durationDays={durationDays}
          budget={budget}
          familyMembers={familyMembers}
          travelStyle={travelStyle}
          weather={weather}
          onApplyNotes={(selectedItems, profile, updatedBudget) => {
            startPlanningForCity(
              selectedCity,
              startDate,
              durationDays,
              origin,
              'ai',
              profile,
              selectedItems,
              updatedBudget
            );
          }}
        />
      )}

    </div>
  );
};
