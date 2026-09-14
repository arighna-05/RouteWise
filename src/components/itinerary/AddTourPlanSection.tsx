import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  MapPin, 
  Clock, 
  Sparkles, 
  Compass, 
  Utensils, 
  Camera, 
  Car, 
  Hotel, 
  ShoppingBag, 
  Ticket, 
  Check, 
  ArrowRight, 
  CalendarPlus,
  Zap
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { useViewMode } from '../../context/ViewModeContext';
import { getTouristAttractions } from '../../services/geminiService';
import { getCurrencySymbol } from '../../utils/currency';
import type { ActivityCategory, AttractionRecommendation } from '../../types/travel';

interface AddTourPlanSectionProps {
  onNavigateToSchedule?: () => void;
  onNavigateToAttractions?: () => void;
  onViewSchedule?: () => void;
  onOpenAttractions?: () => void;
}

const CATEGORIES: { id: ActivityCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'sightseeing', label: 'Sightseeing', icon: <Camera className="w-3.5 h-3.5 text-sky-500" /> },
  { id: 'food', label: 'Food & Dining', icon: <Utensils className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'activity', label: 'Activity', icon: <Ticket className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'transport', label: 'Transport', icon: <Car className="w-3.5 h-3.5 text-blue-500" /> },
  { id: 'lodging', label: 'Lodging', icon: <Hotel className="w-3.5 h-3.5 text-purple-500" /> },
  { id: 'shopping', label: 'Shopping', icon: <ShoppingBag className="w-3.5 h-3.5 text-rose-500" /> },
];

export const AddTourPlanSection: React.FC<AddTourPlanSectionProps> = ({
  onNavigateToSchedule,
  onNavigateToAttractions,
  onViewSchedule,
  onOpenAttractions,
}) => {
  const goToSchedule = onViewSchedule || onNavigateToSchedule;
  const goToAttractions = onOpenAttractions || onNavigateToAttractions;
  const { 
    activeTrip, 
    selectedDay, 
    setSelectedDay, 
    addActivity, 
    addDayToTrip 
  } = useTrip();
  const { isMobileView } = useViewMode();

  const currencySymbol = getCurrencySymbol(activeTrip.currency);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [time, setTime] = useState<string>('10:00');
  const [category, setCategory] = useState<ActivityCategory>('sightseeing');
  const [cost, setCost] = useState<number | ''>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI States
  const [cityAttractions, setCityAttractions] = useState<AttractionRecommendation[]>([]);
  const [lastAddedTitle, setLastAddedTitle] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<boolean>(false);

  // Load destination attractions for quick landmark suggestions
  useEffect(() => {
    if (activeTrip?.city) {
      getTouristAttractions(activeTrip.city).then((res) => {
        if (Array.isArray(res)) setCityAttractions(res);
      });
    }
  }, [activeTrip?.city]);

  // Current items for the selected day to suggest reasonable next time
  const currentDayItems = useMemo(() => {
    return activeTrip.items
      .filter(item => item.dayIndex === selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [activeTrip.items, selectedDay]);

  // Handle plan addition
  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    addActivity({
      dayIndex: selectedDay,
      time: time || '10:00',
      title: cleanTitle,
      location: location.trim() || activeTrip.cityName,
      category,
      cost: Number(cost) || 0,
      notes: notes.trim(),
      openingHours: '09:00 - 18:00',
      bestTimeToVisit: '',
      transitInfo: '',
    });

    setLastAddedTitle(cleanTitle);
    setSuccessToast(true);
    setTitle('');
    setLocation('');
    setNotes('');
    setCost('');

    // Advance default time for next plan (e.g. +2 hours)
    try {
      const [h, m] = time.split(':').map(Number);
      const nextH = Math.min(22, (h || 10) + 2);
      setTime(`${String(nextH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`);
    } catch {
      setTime('14:00');
    }

    setTimeout(() => {
      setSuccessToast(false);
    }, 4500);
  };

  // 1-Click Quick Preset Idea Handler
  const handleAddPreset = (presetTitle: string, presetCategory: ActivityCategory, defaultTime: string, estimatedCost: number) => {
    addActivity({
      dayIndex: selectedDay,
      time: defaultTime,
      title: presetTitle,
      location: `${presetTitle}, ${activeTrip.cityName}`,
      category: presetCategory,
      cost: estimatedCost,
      notes: `Suggested activity for Day ${selectedDay}`,
    });

    setLastAddedTitle(presetTitle);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4500);
  };

  // Add Landmark from list
  const handleAddLandmark = (attr: AttractionRecommendation) => {
    let landmarkTime = '10:00';
    if (attr.bestTimeToVisit.toLowerCase().includes('sunset') || attr.bestTimeToVisit.toLowerCase().includes('dusk')) {
      landmarkTime = '18:00';
    } else if (attr.bestTimeToVisit.toLowerCase().includes('afternoon')) {
      landmarkTime = '15:00';
    }

    addActivity({
      dayIndex: selectedDay,
      time: landmarkTime,
      title: attr.title,
      location: `${attr.title}, ${activeTrip.cityName}`,
      category: attr.category,
      cost: attr.estimatedCost,
      notes: attr.description,
      openingHours: attr.openingHours,
      isMustVisit: attr.isMustVisit,
    });

    setLastAddedTitle(attr.title);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className={`p-4 sm:p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isMobileView 
          ? 'matte-card text-[#1A1D2E]' 
          : 'glass-card border-[#3B4252] text-[#ECEFF4]'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl ${
              isMobileView ? 'bg-[#EEF0FF] text-[#5D5FEF]' : 'bg-[#88C0D0]/20 text-[#88C0D0]'
            }`}>
              <Plus className="w-5 h-5 font-black" />
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Add Tour Plans to {activeTrip.cityName}
            </h2>
          </div>
          <p className={`text-xs ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]/80'}`}>
            Pick a day, specify custom activities, or select 1-click popular destination ideas.
          </p>
        </div>

        {/* View Schedule Button */}
        <button
          type="button"
          onClick={goToSchedule}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-sm ${
            isMobileView
              ? 'bg-[#EEF0FF] text-[#5D5FEF] hover:bg-[#E0E2FD]'
              : 'bg-[#88C0D0]/20 text-[#88C0D0] hover:bg-[#88C0D0] hover:text-[#1A1E24] border border-[#88C0D0]/30'
          }`}
        >
          <span>View Day-wise Schedule</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Selection Tabs */}
      <div className="space-y-2">
        <label className={`text-xs font-bold uppercase tracking-wider block ${
          isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
        }`}>
          Select Target Day
        </label>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((dayNum) => {
            const isSelected = dayNum === selectedDay;
            const itemsCount = activeTrip.items.filter(it => it.dayIndex === dayNum).length;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? isMobileView
                      ? 'bg-[#5D5FEF] text-white shadow-md border-[#5D5FEF]'
                      : 'bg-[#88C0D0] text-[#1A1E24] shadow-glow border-[#88C0D0]'
                    : isMobileView
                      ? 'bg-white text-[#67708A] border-[#E2E6F0] hover:border-[#5D5FEF]/40'
                      : 'bg-[#242933] text-[#D8DEE9] border-[#3B4252] hover:bg-[#2E3440]'
                }`}
              >
                <span>Day {dayNum}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected
                    ? isMobileView ? 'bg-white/20 text-white' : 'bg-[#1A1E24]/20 text-[#1A1E24]'
                    : isMobileView ? 'bg-[#F4F6FB] text-[#5D5FEF]' : 'bg-[#1A1E24] text-[#88C0D0]'
                }`}>
                  {itemsCount} {itemsCount === 1 ? 'plan' : 'plans'}
                </span>
              </button>
            );
          })}

          {/* Add Day Button */}
          <button
            type="button"
            onClick={addDayToTrip}
            className={`px-3 py-2.5 rounded-2xl border transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold ${
              isMobileView
                ? 'bg-white border-[#E2E6F0] text-[#67708A] hover:text-[#1A1D2E]'
                : 'bg-[#242933] border-[#3B4252] text-[#D8DEE9] hover:text-white'
            }`}
            title="Add another day to tour"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Add Day</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className={`p-4 rounded-2xl border shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
          isMobileView
            ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
            : 'bg-[#A3BE8C]/20 border-[#A3BE8C]/40 text-[#A3BE8C]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold">
                Added "{lastAddedTitle}" to Day {selectedDay}!
              </p>
              <p className="text-[11px] opacity-80">
                Scheduled in your itinerary timeline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={goToSchedule}
            className="px-3 py-1.5 rounded-xl bg-white text-[#166534] text-xs font-black shadow-sm flex items-center gap-1 shrink-0 hover:bg-[#DCFCE7] transition-colors"
          >
            <span>View in Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Add Form (Left) & Quick Ideas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: Custom Plan Form (7 Cols) */}
        <form
          onSubmit={handleAddPlan}
          className={`lg:col-span-7 rounded-3xl p-5 sm:p-7 border space-y-4 shadow-sm ${
            isMobileView
              ? 'bg-white border-[#E8ECF5] text-[#1A1D2E]'
              : 'glass-card border-[#3B4252] text-[#ECEFF4]'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F8] dark:border-[#2E3440]">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
              <h3 className="font-extrabold text-base">
                Add Activity / Plan to Day {selectedDay}
              </h3>
            </div>
            <span className={`text-xs font-mono font-bold ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`}>
              {currentDayItems.length} already scheduled
            </span>
          </div>

          {/* Title input */}
          <div className="space-y-1">
            <label className={`text-xs font-bold uppercase tracking-wider block ${
              isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
            }`}>
              Activity or Destination Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. Visit landmark, Breakfast at bakery, Sunset walk`}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium border transition-all ${
                isMobileView
                  ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] focus:ring-2 focus:ring-[#5D5FEF] placeholder-[#94A3B8]'
                  : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] placeholder-[#4C566A]'
              }`}
            />
          </div>

          {/* Time & Cost Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Time */}
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Scheduled Time</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-mono border transition-all ${
                  isMobileView
                    ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] focus:ring-2 focus:ring-[#5D5FEF]'
                    : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]'
                }`}
              />
            </div>

            {/* Estimated Cost */}
            <div className="space-y-1">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
              }`}>
                <span>Estimated Cost ({currencySymbol})</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-xs">
                  {currencySymbol}
                </div>
                <input
                  type="number"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0 for free entry"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-mono border transition-all ${
                    isMobileView
                      ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] focus:ring-2 focus:ring-[#5D5FEF]'
                      : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Category Picker */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider block ${
              isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
            }`}>
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isCatSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      isCatSelected
                        ? isMobileView
                          ? 'bg-[#EEF0FF] border-[#5D5FEF] text-[#5D5FEF] shadow-sm'
                          : 'bg-[#88C0D0]/20 border-[#88C0D0] text-[#88C0D0]'
                        : isMobileView
                          ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#67708A] hover:bg-[#F4F6FB]'
                          : 'bg-[#1A1E24] border-[#3B4252] text-[#D8DEE9] hover:bg-[#2E3440]'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Notes */}
          <div className="space-y-1">
            <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
              isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
            }`}>
              <MapPin className="w-3.5 h-3.5" />
              <span>Specific Location / Address (Optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={`e.g. Mall Road, Near North Gate, ${activeTrip.cityName}`}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs border transition-all ${
                isMobileView
                  ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] focus:ring-2 focus:ring-[#5D5FEF]'
                  : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]'
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-bold uppercase tracking-wider block ${
              isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
            }`}>
              Notes or Travel Tips (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Best light for photos in the morning, carry water, wear walking shoes"
              className={`w-full px-3.5 py-2 rounded-2xl text-xs border transition-all ${
                isMobileView
                  ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] focus:ring-2 focus:ring-[#5D5FEF]'
                  : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]'
              }`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
              isMobileView
                ? 'bg-[#5D5FEF] hover:bg-[#4D4FD9] text-white shadow-[#5D5FEF]/25'
                : 'gradient-accent hover:opacity-95 text-[#1A1E24] shadow-glow'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan to Day {selectedDay}</span>
          </button>
        </form>

        {/* Right Card: 1-Click Preset Ideas & Landmarks (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick 1-Click Ideas */}
          <div className={`p-5 rounded-3xl border space-y-3.5 shadow-sm ${
            isMobileView
              ? 'bg-white border-[#E8ECF5] text-[#1A1D2E]'
              : 'glass-card border-[#3B4252] text-[#ECEFF4]'
          }`}>
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isMobileView ? 'text-[#D97706]' : 'text-[#EBCB8B]'}`} />
              <h4 className="font-black text-sm uppercase tracking-wider">
                1-Click Quick Plans
              </h4>
            </div>
            <p className={`text-xs ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/70'}`}>
              Instant activities tailored for common travel moments:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleAddPreset('Morning Breakfast & Coffee', 'food', '09:00', 350)}
                className={`w-full p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group ${
                  isMobileView
                    ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] hover:bg-[#EEF0FF] hover:border-[#5D5FEF]'
                    : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] hover:bg-[#2E3440]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">☕</span>
                  <span>Morning Breakfast & Coffee</span>
                </div>
                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </button>

              <button
                type="button"
                onClick={() => handleAddPreset(`Explore Downtown ${activeTrip.cityName}`, 'sightseeing', '11:00', 0)}
                className={`w-full p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group ${
                  isMobileView
                    ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] hover:bg-[#EEF0FF] hover:border-[#5D5FEF]'
                    : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] hover:bg-[#2E3440]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏛️</span>
                  <span>Explore Downtown & Architecture</span>
                </div>
                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </button>

              <button
                type="button"
                onClick={() => handleAddPreset('Local Food Walk & Lunch', 'food', '13:00', 500)}
                className={`w-full p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group ${
                  isMobileView
                    ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] hover:bg-[#EEF0FF] hover:border-[#5D5FEF]'
                    : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] hover:bg-[#2E3440]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🍜</span>
                  <span>Local Food Walk & Lunch</span>
                </div>
                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </button>

              <button
                type="button"
                onClick={() => handleAddPreset('Sunset Viewpoint & Golden Hour', 'sightseeing', '17:30', 0)}
                className={`w-full p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group ${
                  isMobileView
                    ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] hover:bg-[#EEF0FF] hover:border-[#5D5FEF]'
                    : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] hover:bg-[#2E3440]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🌅</span>
                  <span>Sunset Viewpoint & Golden Hour</span>
                </div>
                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </button>

              <button
                type="button"
                onClick={() => handleAddPreset('Traditional Dinner & Night Stroll', 'food', '20:00', 800)}
                className={`w-full p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group ${
                  isMobileView
                    ? 'bg-[#F8FAFC] border-[#E2E6F0] text-[#1A1D2E] hover:bg-[#EEF0FF] hover:border-[#5D5FEF]'
                    : 'bg-[#1A1E24] border-[#3B4252] text-[#ECEFF4] hover:bg-[#2E3440]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🍲</span>
                  <span>Traditional Dinner & Night Walk</span>
                </div>
                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </button>
            </div>
          </div>

          {/* Top Curated Landmarks Quick Pick */}
          {cityAttractions.length > 0 && (
            <div className={`p-5 rounded-3xl border space-y-3.5 shadow-sm ${
              isMobileView
                ? 'bg-white border-[#E8ECF5] text-[#1A1D2E]'
                : 'glass-card border-[#3B4252] text-[#ECEFF4]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className={`w-4 h-4 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                  <h4 className="font-black text-sm uppercase tracking-wider">
                    Top Landmarks in {activeTrip.cityName}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={goToAttractions}
                  className={`text-[11px] font-bold ${
                    isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'
                  } hover:underline`}
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {cityAttractions.slice(0, 4).map((attr) => (
                  <div
                    key={attr.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
                      isMobileView
                        ? 'bg-[#F8FAFC] border-[#E2E6F0]'
                        : 'bg-[#1A1E24] border-[#3B4252]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">
                        {attr.title}
                      </div>
                      <div className={`text-[10px] truncate ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/70'}`}>
                        {attr.category} • {attr.estimatedCost === 0 ? 'Free' : `${currencySymbol} ${attr.estimatedCost}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddLandmark(attr)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm flex items-center gap-1 ${
                        isMobileView
                          ? 'bg-[#5D5FEF] text-white hover:bg-[#4D4FD9]'
                          : 'bg-[#88C0D0]/20 text-[#88C0D0] hover:bg-[#88C0D0] hover:text-[#1A1E24]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
