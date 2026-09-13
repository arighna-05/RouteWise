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
  const { startPlanningForCity, activeTrip, weather } = useTrip();

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
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient Nordic glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#88C0D0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#81A1C1]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full mx-auto relative z-10 space-y-8 text-center">
        
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#88C0D0]/15 border border-[#88C0D0]/30 text-[#88C0D0] text-xs font-semibold tracking-wide uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#EBCB8B] animate-pulse" />
          <span>Simple Travel Planner & Gemini Suggestions</span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#ECEFF4] leading-tight">
            Where are you <span className="gradient-text">traveling next?</span>
          </h1>
          <p className="text-base sm:text-lg text-[#D8DEE9] max-w-xl mx-auto font-normal">
            Choose your destination, then pick between a personal note-taking planner or a complete AI-generated tour plan.
          </p>
        </div>

        {/* Search & Setup Card */}
        <form 
          onSubmit={handleOpenModeSelection}
          className="glass-card rounded-3xl p-6 sm:p-8 border border-[#3B4252] shadow-2xl text-left space-y-6"
        >
          {/* Destination Search Bar */}
          <div className="space-y-2 relative" ref={searchRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#D8DEE9] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#88C0D0]" />
              <span>Destination City, State, or Region</span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-[#4C566A]" />
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
                className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] placeholder-[#4C566A] focus:outline-none focus:ring-2 focus:ring-[#88C0D0] focus:border-transparent text-sm sm:text-base font-medium shadow-inner"
              />

              {/* Action buttons inside search bar: Spinner and Clear (X) */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                {isSearching && (
                  <Loader2 className="w-5 h-5 text-[#88C0D0] animate-spin" />
                )}
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className="p-1 rounded-lg text-[#4C566A] hover:text-[#ECEFF4] hover:bg-[#3B4252] transition-colors"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-[#242933] border border-[#3B4252] rounded-2xl shadow-2xl divide-y divide-[#2E3440] p-1">
                {searchResults.length > 0 ? (
                  searchResults.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className="w-full px-4 py-3 text-left hover:bg-[#3B4252]/70 rounded-xl flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#88C0D0]/15 text-[#88C0D0] group-hover:bg-[#88C0D0] group-hover:text-[#1A1E24] transition-colors font-bold">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-[#ECEFF4] text-sm group-hover:text-white">
                            {city.name}
                          </div>
                          <div className="text-xs text-[#D8DEE9]/70">
                            {city.country}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-[#88C0D0] font-mono">
                        {city.currency || 'INR (₹)'}
                      </span>
                    </button>
                  ))
                ) : !isSearching && query.trim().length >= 2 ? (
                  <div className="p-3 text-center text-xs text-[#D8DEE9] space-y-2">
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
                      className="px-3 py-1.5 rounded-xl bg-[#88C0D0]/20 text-[#88C0D0] font-bold hover:bg-[#88C0D0] hover:text-[#1A1E24] transition-colors"
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
              <label className="text-[10px] font-bold text-[#D8DEE9] uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#88C0D0]" />
                <span>Starting From</span>
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Kolkata, Delhi"
                className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-xs focus:ring-2 focus:ring-[#88C0D0]"
              />
            </div>

            {/* 2. Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#D8DEE9] uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#88C0D0]" />
                <span>Start Date</span>
              </label>
              <NordicDatePicker
                value={startDate}
                onChange={setStartDate}
              />
            </div>

            {/* 3. Family Members & Their Ages */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#D8DEE9] uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-[#88C0D0]" />
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
            className="w-full py-4 rounded-2xl gradient-accent hover:opacity-95 text-[#1A1E24] font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-glow transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1A1E24]/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#242933] border border-[#3B4252] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-left">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2E3440]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#88C0D0] uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Destination: {selectedCity.name}, {selectedCity.country}</span>
                </div>
                <h3 className="text-2xl font-black text-[#ECEFF4]">
                  How would you like to plan your trip?
                </h3>
                <p className="text-xs text-[#D8DEE9] mt-0.5">
                  Choose between building your own personal day-wise notes or letting AI design the entire tour plan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModeModalOpen(false)}
                className="p-2 rounded-xl text-[#D8DEE9] hover:text-white hover:bg-[#3B4252] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selection Tabs (2 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option A: Plan Manually */}
              <button
                type="button"
                onClick={() => setSelectedMode('manual')}
                className={`p-5 rounded-2xl border text-left transition-all relative space-y-3 ${
                  selectedMode === 'manual'
                    ? 'bg-[#88C0D0]/15 border-[#88C0D0] shadow-glow text-white'
                    : 'bg-[#1A1E24]/60 border-[#3B4252] text-[#D8DEE9] hover:border-[#4C566A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#88C0D0]/20 text-[#88C0D0]">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  {selectedMode === 'manual' && (
                    <CheckCircle2 className="w-5 h-5 text-[#88C0D0]" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[#ECEFF4]">Plan Manually</h4>
                  <p className="text-xs text-[#D8DEE9] mt-1 leading-relaxed">
                    Add spots, schedule day-wise plans, customize timings, and explore AI recommendations.
                  </p>
                </div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#88C0D0]/20 text-[#88C0D0]">
                  Full Freedom
                </span>
              </button>

              {/* Option B: AI Tour Planner */}
              <button
                type="button"
                onClick={() => setSelectedMode('ai')}
                className={`p-5 rounded-2xl border text-left transition-all relative space-y-3 ${
                  selectedMode === 'ai'
                    ? 'bg-[#B48EAD]/15 border-[#B48EAD] shadow-glow text-white'
                    : 'bg-[#1A1E24]/60 border-[#3B4252] text-[#D8DEE9] hover:border-[#4C566A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#B48EAD]/20 text-[#B48EAD]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {selectedMode === 'ai' && (
                    <CheckCircle2 className="w-5 h-5 text-[#B48EAD]" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[#ECEFF4]">AI Tour Planner</h4>
                  <p className="text-xs text-[#D8DEE9] mt-1 leading-relaxed">
                    Gemini crafts a customized day-by-day plan with travel times, weather advice, and budget management for your group.
                  </p>
                </div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#B48EAD]/20 text-[#B48EAD]">
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
                  <label className="text-xs font-bold text-[#D8DEE9] uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#88C0D0]" />
                    <span>Starting From</span>
                  </label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g. Kolkata, Delhi"
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-xs focus:ring-2 focus:ring-[#88C0D0]"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#D8DEE9] uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#88C0D0]" />
                    <span>Start Date</span>
                  </label>
                  <NordicDatePicker
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#D8DEE9] uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#88C0D0]" />
                    <span>Duration</span>
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-xs focus:ring-2 focus:ring-[#88C0D0]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(n => (
                      <option key={n} value={n}>{n} Days Tour</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Family Members & Specific Ages Row (Shared across both modes) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#D8DEE9] uppercase tracking-wide flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#88C0D0]" />
                    <span>Traveling Family Members & Specific Ages</span>
                  </span>
                  <span className="text-[10px] text-[#81A1C1] font-semibold">
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
                <div className="space-y-4 pt-3 border-t border-[#2E3440] animate-fade-in">
                  
                  {/* Budget */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#D8DEE9] uppercase tracking-wide flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#A3BE8C]" />
                      <span>Total Group Budget ({selectedCity.currency?.split(' ')[0] || 'INR'})</span>
                    </label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-xs font-mono focus:ring-2 focus:ring-[#B48EAD]"
                    />
                  </div>

                  {/* Travel Style */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#D8DEE9] uppercase tracking-wide flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#EBCB8B]" />
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
                              ? 'bg-[#B48EAD] text-[#1A1E24] shadow-glow font-bold'
                              : 'bg-[#1A1E24] border border-[#3B4252] text-[#D8DEE9] hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Tailoring Note banner */}
                  <div className="p-3 rounded-xl bg-[#B48EAD]/10 border border-[#B48EAD]/30 text-xs text-[#ECEFF4] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B48EAD] shrink-0" />
                    <span>
                      Gemini will tailor attractions, transit pace, and walking rest stops specifically for <strong>{getDerivedAgeGroup(familyMembers)}</strong>.
                    </span>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-[#2E3440] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#D8DEE9] hover:text-white transition-colors"
              >
                Cancel
              </button>

              {selectedMode === 'manual' ? (
                <button
                  type="button"
                  onClick={handleStartManualPlan}
                  className="px-6 py-3 rounded-2xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] text-xs font-extrabold shadow-glow flex items-center gap-2 transition-all"
                >
                  <span>Start Planning Trip</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateAIPlan}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#B48EAD] to-[#81A1C1] hover:opacity-90 text-[#1A1E24] text-xs font-extrabold shadow-glow flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#1A1E24]" />
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
