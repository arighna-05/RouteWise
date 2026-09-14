import React, { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Trash2, 
  Utensils, 
  Camera, 
  Car, 
  Hotel, 
  Compass, 
  ShoppingBag, 
  X, 
  Edit3, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle,
  Sun, 
  CloudRain, 
  Ticket,
  CalendarPlus,
  Clock,
  Check,
  Zap,
  Route,
  BookOpen
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import type { ActivityCategory, ItineraryItem } from '../../types/travel';
import { getWeatherForTripDay } from '../../services/weatherApi';
import { 
  estimateTransitBetweenSpots, 
  calculateNextScheduledTime, 
  getEstimatedVisitDuration 
} from '../../services/trafficTransitService';
import { TripConfirmedModal } from './TripConfirmedModal';
import { HandwrittenPaperJournal } from './HandwrittenPaperJournal';
import { useViewMode } from '../../context/ViewModeContext';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

interface ItineraryTimelineProps {
  onOpenAddPlan?: () => void;
  onOpenAttractions?: () => void;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ 
  onOpenAddPlan, 
  onOpenAttractions 
}) => {
  const { 
    activeTrip, 
    selectedDay, 
    setSelectedDay, 
    addActivity, 
    updateActivity, 
    deleteActivity, 
    toggleActivityComplete,
    addDayToTrip,
    confirmTripPlan,
    updateAllActivities,
    weather,
    totalTripEstimatedCost,
    dayEstimatedCost
  } = useTrip();
  const { isMobileView } = useViewMode();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaperJournalOpen, setIsPaperJournalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  // Modal Form State
  const [formData, setFormData] = useState<{
    time: string;
    dayIndex: number;
    title: string;
    location: string;
    category: ActivityCategory;
    cost: number;
    notes: string;
    openingHours: string;
    bestTimeToVisit: string;
    transitInfo: string;
  }>({
    time: '10:00',
    dayIndex: selectedDay,
    title: '',
    location: '',
    category: 'sightseeing',
    cost: 0,
    notes: '',
    openingHours: '09:00 - 18:00',
    bestTimeToVisit: '',
    transitInfo: '',
  });

  const [autoCalcMessage, setAutoCalcMessage] = useState<string>('');

  const dayItems = activeTrip.items
    .filter(item => item.dayIndex === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Auto-calculated travel duration and traffic statistics for the current day
  const dayTransitStats = React.useMemo(() => {
    if (dayItems.length < 2) return null;
    let totalMinutes = 0;
    const journeys: string[] = [];
    for (let i = 1; i < dayItems.length; i++) {
      const from = dayItems[i - 1].title;
      const to = dayItems[i].title;
      const est = estimateTransitBetweenSpots(from, to);
      totalMinutes += est.durationMinutes;
      journeys.push(`${from} ➔ ${to} (${est.durationText})`);
    }
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const totalText = hrs > 0 ? (mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs} hrs`) : `~${mins} mins`;
    return {
      totalMinutes,
      totalText,
      journeysCount: journeys.length,
      journeys,
    };
  }, [dayItems]);

  // Current day's weather with resilient date-matching and seasonal fallback
  const dayWeather = getWeatherForTripDay(weather, activeTrip.startDate, selectedDay, activeTrip.city?.latitude);

  // Helper to compute date string for a day
  const getDayDateString = (dayNum: number): string => {
    try {
      const start = new Date(activeTrip.startDate);
      const target = new Date(start);
      target.setDate(start.getDate() + dayNum - 1);
      return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    } catch {
      return `Day ${dayNum}`;
    }
  };

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case 'food':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'sightseeing':
        return <Camera className="w-3.5 h-3.5" />;
      case 'transport':
        return <Car className="w-3.5 h-3.5" />;
      case 'lodging':
        return <Hotel className="w-3.5 h-3.5" />;
      case 'shopping':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'activity':
        return <Ticket className="w-3.5 h-3.5" />;
      default:
        return <Compass className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryBadgeClass = (category: ActivityCategory) => {
    switch (category) {
      case 'food':
        return 'bg-[#EBCB8B]/15 text-[#EBCB8B] border-[#EBCB8B]/30';
      case 'sightseeing':
        return 'bg-[#88C0D0]/15 text-[#88C0D0] border-[#88C0D0]/30';
      case 'transport':
        return 'bg-[#81A1C1]/15 text-[#81A1C1] border-[#81A1C1]/30';
      case 'lodging':
        return 'bg-[#B48EAD]/15 text-[#B48EAD] border-[#B48EAD]/30';
      case 'shopping':
        return 'bg-[#D08770]/15 text-[#D08770] border-[#D08770]/30';
      default:
        return 'bg-[#A3BE8C]/15 text-[#A3BE8C] border-[#A3BE8C]/30';
    }
  };

  // Recalculates all scheduled times for the day automatically taking into account mountain travel times
  const handleAutoCalculateDaySchedule = () => {
    const dayItemsSorted = [...activeTrip.items]
      .filter(item => item.dayIndex === selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (dayItemsSorted.length === 0) return;

    let currentTime = dayItemsSorted[0].time || '09:00';
    const updatedDayItems: ItineraryItem[] = [];

    for (let i = 0; i < dayItemsSorted.length; i++) {
      const item = dayItemsSorted[i];
      if (i === 0) {
        updatedDayItems.push({
          ...item,
          time: currentTime,
          transitInfo: item.transitInfo || '🚗 Morning departure from hotel / accommodation'
        });
      } else {
        const prevItem = dayItemsSorted[i - 1];
        const transit = estimateTransitBetweenSpots(prevItem.title, item.title);
        const prevDuration = getEstimatedVisitDuration(prevItem.category, prevItem.title);
        const nextTime = calculateNextScheduledTime(currentTime, prevDuration, transit.durationMinutes);
        currentTime = nextTime;
        updatedDayItems.push({
          ...item,
          time: nextTime,
          transitInfo: transit.trafficAdvice
        });
      }
    }

    const otherDayItems = activeTrip.items.filter(item => item.dayIndex !== selectedDay);
    updateAllActivities([...otherDayItems, ...updatedDayItems]);
    setAutoCalcMessage(`✓ Auto-calculated Day ${selectedDay} timings with realistic transit times!`);
    setTimeout(() => setAutoCalcMessage(''), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      time: '10:00',
      dayIndex: selectedDay,
      title: '',
      location: activeTrip.cityName,
      category: 'sightseeing',
      cost: 0,
      notes: '',
      openingHours: '09:00 - 18:00',
      bestTimeToVisit: '',
      transitInfo: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: ItineraryItem) => {
    setEditingItem(item);
    setFormData({
      time: item.time,
      dayIndex: item.dayIndex,
      title: item.title,
      location: item.location,
      category: item.category,
      cost: item.cost,
      notes: item.notes || '',
      openingHours: item.openingHours || '09:00 - 18:00',
      bestTimeToVisit: item.bestTimeToVisit || '',
      transitInfo: item.transitInfo || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingItem) {
      updateActivity({
        ...editingItem,
        dayIndex: formData.dayIndex,
        time: formData.time,
        title: formData.title.trim(),
        location: formData.location.trim() || activeTrip.cityName,
        category: formData.category,
        cost: Number(formData.cost) || 0,
        notes: formData.notes.trim(),
        openingHours: formData.openingHours,
        bestTimeToVisit: formData.bestTimeToVisit,
        transitInfo: formData.transitInfo,
      });
    } else {
      addActivity({
        dayIndex: formData.dayIndex,
        time: formData.time,
        title: formData.title.trim(),
        location: formData.location.trim() || activeTrip.cityName,
        category: formData.category,
        cost: Number(formData.cost) || 0,
        notes: formData.notes.trim(),
        openingHours: formData.openingHours,
        bestTimeToVisit: formData.bestTimeToVisit,
        transitInfo: formData.transitInfo,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      
      {/* Top Controls: Day Tabs and Paper Journal */}
      <div className={`space-y-2.5 pb-2 ${isMobileView ? '' : 'border-b border-[#2E3440]'}`}>
        
        {/* Day-Wise Tabs - Full Width Smooth Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((dayNum) => {
            const isSelected = dayNum === selectedDay;
            const w = getWeatherForTripDay(weather, activeTrip.startDate, dayNum, activeTrip.city?.latitude);

            const tabStyle = isMobileView
              ? isSelected
                ? 'bg-[#5D5FEF] text-white shadow-sm font-bold border-[#5D5FEF]'
                : 'bg-white text-[#64748B] border-[#E4E7F2] hover:bg-[#F4F6FB]'
              : isSelected
                ? 'bg-[#88C0D0] text-[#1A1E24] shadow-glow border-[#88C0D0] font-bold'
                : 'bg-[#242933] text-[#D8DEE9] hover:bg-[#2E3440] border-[#3B4252]';

            const weatherBadgeStyle = isMobileView
              ? isSelected ? 'bg-white/20 text-white' : 'bg-[#F2F4FA] text-[#5D5FEF]'
              : isSelected ? 'bg-[#1A1E24]/20 text-[#1A1E24]' : 'bg-[#1A1E24] text-[#88C0D0]';

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`px-3 py-2 rounded-xl text-left transition-all shrink-0 flex items-center gap-2 border ${tabStyle}`}
              >
                <div>
                  <div className="text-xs font-black tracking-wide uppercase">
                    Day {dayNum}
                  </div>
                  <div className={`text-[10px] ${isMobileView ? (isSelected ? 'text-white/80' : 'text-[#94A3B8]') : (isSelected ? 'text-[#1A1E24]/70' : 'text-[#D8DEE9]/60')} font-medium`}>
                    {getDayDateString(dayNum)}
                  </div>
                </div>

                {/* Day Weather Pill */}
                {w && (
                  <div className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${weatherBadgeStyle}`}>
                    <span>{w.maxTemp}°C</span>
                  </div>
                )}
              </button>
            );
          })}

          {/* Add Day Button */}
          <button
            type="button"
            onClick={addDayToTrip}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              isMobileView
                ? 'bg-white border-[#E4E7F2] text-[#64748B] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                : 'bg-[#242933] border-[#3B4252] text-[#D8DEE9] hover:text-white hover:bg-[#2E3440]'
            }`}
            title="Add another day to tour"
          >
            <CalendarPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Action Row: Day Status & Paper Journal */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className={`text-[11px] font-semibold ${isMobileView ? 'text-[#7E859B]' : 'text-[#88C0D0]/85'}`}>
            Day {selectedDay} of {activeTrip.daysCount} • {activeTrip.cityName}
          </span>
          <button
            type="button"
            onClick={() => setIsPaperJournalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#fdfaf2] hover:bg-[#f5ecd8] text-[#1e293b] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border border-[#d6cfbe] whitespace-nowrap shrink-0 active:scale-95"
            title="View, export and print handwritten paper travel journal for this tour plan"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
            <span className="font-handwritten text-xs font-bold text-[#1e3a8a] tracking-wide">
              📖 Paper Journal
            </span>
          </button>
        </div>

      </div>

      {/* Day Overview Header with Weather & Costs */}
      {isMobileView ? (
        <div className="matte-card rounded-[24px] p-4 border border-[#E8ECF5] shadow-sm text-[#1A1D2E] space-y-3.5">
          {/* Weather condition and Day Title */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFF4E5] text-[#F59E0B] shrink-0 mt-0.5">
              {dayWeather?.precipitationProb && dayWeather.precipitationProb > 40 ? (
                <CloudRain className="w-5 h-5 text-[#3B82F6]" />
              ) : (
                <Sun className="w-5 h-5 text-[#F59E0B]" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#1A1D2E] whitespace-nowrap">
                  Day {selectedDay} • {getDayDateString(selectedDay)}
                </h3>
                {dayWeather && (
                  <span className="px-2 py-0.5 rounded-lg bg-[#F4F6FB] text-[11px] font-semibold text-[#5D5FEF] whitespace-nowrap border border-[#E2E6F0]">
                    {dayWeather.maxTemp}° / {dayWeather.minTemp}°C • {dayWeather.weatherDescription}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7E859B] leading-relaxed">
                {dayWeather && dayWeather.precipitationProb > 40
                  ? `⚠️ High chance of rain (${dayWeather.precipitationProb}%). Outdoor hill visits may be wet.`
                  : '☀️ Favorable travel weather. Good visibility for sightseeing and outdoor photography.'}
              </p>
            </div>
          </div>

          {/* Dedicated Cost Summary & Full Form Action Row */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#F0F2F8]">
            <div className="flex items-center gap-3 sm:gap-5">
              <div>
                <span className="text-[9px] text-[#7E859B] uppercase font-bold tracking-wider block">Day {selectedDay} Cost</span>
                <span className="text-xs sm:text-sm font-black text-[#1A1D2E] font-mono">
                  {formatCurrency(dayEstimatedCost, activeTrip.currency)}
                </span>
              </div>

              <div className="h-6 w-px bg-[#E2E6F0]" />

              <div>
                <span className="text-[9px] text-[#7E859B] uppercase font-bold tracking-wider block">Total Tour Cost</span>
                <span className="text-xs sm:text-sm font-black text-[#5D5FEF] font-mono">
                  {formatCurrency(totalTripEstimatedCost, activeTrip.currency)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#5D5FEF] hover:bg-[#4D4FD9] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Full Form</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[#3B4252] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Weather condition for this day/time */}
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#88C0D0]/10 text-[#88C0D0]">
              {dayWeather?.precipitationProb && dayWeather.precipitationProb > 40 ? (
                <CloudRain className="w-6 h-6 text-[#88C0D0]" />
              ) : (
                <Sun className="w-6 h-6 text-[#EBCB8B]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#ECEFF4]">
                  Day {selectedDay} • {getDayDateString(selectedDay)}
                </h3>
                {dayWeather && (
                  <span className="px-2 py-0.5 rounded-md bg-[#1A1E24] text-xs font-semibold text-[#88C0D0]">
                    {dayWeather.maxTemp}° / {dayWeather.minTemp}°C • {dayWeather.weatherDescription}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#D8DEE9] mt-0.5">
                {dayWeather && dayWeather.precipitationProb > 40
                  ? `⚠️ High chance of rain (${dayWeather.precipitationProb}%). Outdoor hill visits may be wet.`
                  : '☀️ Favorable travel weather. Good visibility for sightseeing and outdoor photography.'}
              </p>
            </div>
          </div>

          {/* Right: Estimated Cost Summary */}
          <div className="flex items-center gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2E3440] text-right">
            <div>
              <span className="text-[10px] text-[#D8DEE9]/70 uppercase font-medium block">Day {selectedDay} Cost</span>
              <span className="text-sm font-bold text-[#ECEFF4] font-mono">
                {formatCurrency(dayEstimatedCost, activeTrip.currency)}
              </span>
            </div>

            <div className="h-8 w-px bg-[#3B4252] hidden sm:block" />

            <div>
              <span className="text-[10px] text-[#D8DEE9]/70 uppercase font-medium block">Total Tour Cost</span>
              <span className="text-sm font-bold text-[#A3BE8C] font-mono">
                {formatCurrency(totalTripEstimatedCost, activeTrip.currency)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl gradient-accent hover:opacity-95 text-[#1A1E24] text-xs font-bold transition-all shadow-glow flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Full Form</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DAY SCHEDULE: ACTION BAR                                  */}
      {/* ========================================================= */}
      <div className={
        isMobileView 
          ? "matte-card rounded-[22px] p-3.5 border border-[#E8ECF5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" 
          : "glass-card rounded-2xl p-3.5 sm:p-4 border border-[#3B4252] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      }>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl shrink-0 ${isMobileView ? 'bg-[#EEF0FF] text-[#5D5FEF]' : 'bg-[#88C0D0]/10 text-[#88C0D0]'}`}>
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-xs sm:text-sm font-black ${isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'}`}>
              Day {selectedDay} Schedule ({dayItems.length} {dayItems.length === 1 ? 'place' : 'places'})
            </h4>
            <p className={`text-[11px] ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/70'}`}>
              Chronological day timeline & transit routes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAddPlan && (
            <button
              type="button"
              onClick={onOpenAddPlan}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isMobileView
                  ? 'bg-[#5D5FEF] text-white hover:bg-[#4D4FD9]'
                  : 'bg-[#88C0D0] text-[#1A1E24] hover:bg-[#81A1C1]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Plan to Day {selectedDay}</span>
            </button>
          )}

          {dayItems.length > 0 && (
            <button
              type="button"
              onClick={handleAutoCalculateDaySchedule}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap active:scale-95 border ${
                isMobileView
                  ? 'bg-[#EAFBF3] border-[#A3E5C3] text-[#00BA88] hover:bg-[#D7F7E8]'
                  : 'bg-[#A3BE8C]/20 hover:bg-[#A3BE8C]/30 border-[#A3BE8C]/40 text-[#A3BE8C]'
              }`}
              title="Automatically calculate day timings and transit durations"
            >
              <Zap className="w-3 h-3" />
              <span>⚡ Auto-Calculate</span>
            </button>
          )}

          {onOpenAttractions && (
            <button
              type="button"
              onClick={onOpenAttractions}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap active:scale-95 border ${
                isMobileView
                  ? 'bg-[#FFF4E5] border-[#FDE68A] text-[#D97706] hover:bg-[#FEF3C7]'
                  : 'bg-[#EBCB8B]/15 hover:bg-[#EBCB8B]/25 border-[#EBCB8B]/30 text-[#EBCB8B]'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Attractions</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SCHEDULED PLACES TIMELINE                                 */}
      {/* ========================================================= */}
      <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider">
              Day {selectedDay} Scheduled Places ({dayItems.length})
            </span>
            <span>Chronological order</span>
          </div>

          {/* Day Travel Time & Traffic Summary Banner */}
          {dayTransitStats && (
            <div className={
              isMobileView
                ? "matte-card rounded-2xl p-3 border border-[#E8ECF5] shadow-xs flex flex-col gap-1.5 text-xs text-[#1A1D2E]"
                : "p-3 rounded-xl bg-[#1A1E24]/90 border border-[#3B4252] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            }>
              <div className={`flex items-center gap-2 font-semibold ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`}>
                <Route className="w-4 h-4 shrink-0" />
                <span>
                  Estimated Day Travel Time: <strong className={`font-mono ${isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'}`}>{dayTransitStats.totalText}</strong> ({dayTransitStats.journeysCount} transit {dayTransitStats.journeysCount === 1 ? 'journey' : 'journeys'})
                </span>
              </div>
              <div className={`text-[11px] truncate ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/70'}`}>
                {dayTransitStats.journeys.join(' • ')}
              </div>
            </div>
          )}

          {autoCalcMessage && (
            <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              isMobileView
                ? 'bg-[#EAFBF3] border-[#A3E5C3] text-[#00BA88]'
                : 'bg-[#A3BE8C]/15 border-[#A3BE8C]/30 text-[#A3BE8C]'
            }`}>
              <Check className="w-4 h-4" />
              <span>{autoCalcMessage}</span>
            </div>
          )}

          {dayItems.length === 0 ? (
            <div className={
              isMobileView
                ? "matte-card rounded-[24px] p-8 border border-dashed border-[#CBD5E1] text-center space-y-4"
                : "glass-card rounded-2xl p-10 border border-dashed border-[#3B4252] text-center space-y-4"
            }>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                isMobileView ? 'bg-[#EEF0FF] text-[#5D5FEF]' : 'bg-[#242933] text-[#D8DEE9]'
              }`}>
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className={`font-bold text-sm ${isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'}`}>No places scheduled for Day {selectedDay} yet</h4>
                <p className={`text-xs max-w-sm mx-auto ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]'}`}>
                  Build your tour plan with quick presets, custom activities, or top attractions.
                </p>
              </div>
              {onOpenAddPlan && (
                <div>
                  <button
                    type="button"
                    onClick={onOpenAddPlan}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm active:scale-95 ${
                      isMobileView
                        ? 'bg-[#5D5FEF] text-white hover:bg-[#4D4FD9]'
                        : 'bg-[#88C0D0] text-[#1A1E24] hover:bg-[#81A1C1]'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Tour Plan for Day {selectedDay}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {dayItems.map((item) => {
                const isAccessCaution = item.accessibilityStatus === 'caution';
                const isAccessClosed = item.accessibilityStatus === 'closed';

                return (
                  <div
                    key={item.id}
                    className={
                      isMobileView
                        ? `matte-card rounded-[22px] p-3.5 sm:p-4 border border-[#E8ECF5] shadow-sm text-[#1A1D2E] transition-all flex flex-col gap-3 group ${
                            item.completed ? 'bg-[#F2FDF8] border-[#A3E5C3]' : 'hover:border-[#D1D5E8]'
                          }`
                        : `glass-card rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 group ${
                            item.completed
                              ? 'border-[#A3BE8C]/30 bg-[#A3BE8C]/5 opacity-80'
                              : 'border-[#3B4252] hover:border-[#4C566A]'
                          }`
                    }
                  >
                    {/* Left Column: Time, Status, Title, Location */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Completion Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleActivityComplete(item.id)}
                        className={`mt-1 p-1 rounded-lg transition-colors shrink-0 ${
                          item.completed
                            ? (isMobileView ? 'text-[#00BA88] bg-[#EAFBF3]' : 'text-[#A3BE8C] bg-[#A3BE8C]/20')
                            : (isMobileView ? 'text-[#94A3B8] hover:text-[#1A1D2E]' : 'text-[#4C566A] hover:text-[#ECEFF4] hover:bg-[#3B4252]')
                        }`}
                        title={item.completed ? 'Mark as pending' : 'Mark as visited'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Time Badge */}
                          <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                            isMobileView ? 'bg-[#F4F6FB] text-[#1A1D2E] border border-[#E2E6F0]' : 'bg-[#1A1E24] text-[#88C0D0]'
                          }`}>
                            {item.time}
                          </span>

                          {/* Category Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            isMobileView
                              ? (item.category === 'sightseeing' ? 'bg-[#EEF4FF] border-[#BFDBFE] text-[#2563EB]' :
                                 item.category === 'food' ? 'bg-[#FFF4E5] border-[#FED7AA] text-[#D97706]' :
                                 item.category === 'lodging' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]' :
                                 item.category === 'transport' ? 'bg-[#F3E8FF] border-[#DDD6FE] text-[#7C3AED]' :
                                 item.category === 'activity' ? 'bg-[#FDF2F8] border-[#FBCFE8] text-[#DB2777]' :
                                 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]')
                              : getCategoryBadgeClass(item.category)
                          }`}>
                            {getCategoryIcon(item.category)}
                            <span className="capitalize">{item.category}</span>
                          </span>

                          {/* Spot Accessibility Indicator */}
                          {isAccessClosed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#BF616A]/15 text-[#BF616A] border border-[#BF616A]/30 text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3" />
                              <span>Likely Closed</span>
                            </span>
                          ) : isAccessCaution ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBCB8B]/15 text-[#EBCB8B] border border-[#EBCB8B]/30 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Check Hours/Weather</span>
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isMobileView ? 'bg-[#EAFBF3] border-[#A3E5C3] text-[#00BA88]' : 'bg-[#A3BE8C]/15 border-[#A3BE8C]/30 text-[#A3BE8C]'
                            }`}>
                              <ShieldCheck className="w-3 h-3" />
                              <span>Open & Accessible</span>
                            </span>
                          )}
                        </div>

                        {/* Spot Title */}
                        <h4 className={`text-base font-bold leading-snug ${
                          item.completed 
                            ? (isMobileView ? 'line-through text-[#94A3B8]' : 'line-through text-[#D8DEE9]/50')
                            : (isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]')
                        }`}>
                          {item.title}
                        </h4>

                        {/* Location */}
                        <div className={`flex items-center gap-1.5 text-xs ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]'}`}>
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                          <span className="truncate">{item.location}</span>
                        </div>

                        {/* Notes / Travel Journal text */}
                        {item.notes && (
                          <p className={`text-xs italic pl-2 border-l-2 mt-1 ${
                            isMobileView ? 'text-[#64748B] border-[#CBD5E1]' : 'text-[#D8DEE9] border-[#3B4252]'
                          }`}>
                            "{item.notes}"
                          </p>
                        )}

                        {/* Visit Time Advice & Traffic/Transit Info */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          {item.bestTimeToVisit && (
                            <div className="flex items-center gap-1 text-[#D97706] font-medium">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>Best Time: {item.bestTimeToVisit}</span>
                            </div>
                          )}

                          {item.transitInfo && (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium ${
                              isMobileView ? 'bg-[#EEF0FF] text-[#5D5FEF] border border-[#E0E2FD]' : 'text-[#81A1C1]'
                            }`}>
                              <Car className="w-3 h-3 shrink-0" />
                              <span>{item.transitInfo}</span>
                            </div>
                          )}
                        </div>

                        {/* Accessibility Explanation */}
                        {item.accessibilityNote && (
                          <p className={`text-[11px] font-medium pt-0.5 ${
                            isAccessClosed ? 'text-[#BF616A]' : isAccessCaution ? 'text-[#EBCB8B]' : 'text-[#A3BE8C]'
                          }`}>
                            {item.accessibilityNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Estimated Cost & Actions */}
                    <div className={`flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 ${
                      isMobileView ? 'border-[#F0F2F8]' : 'border-[#2E3440]'
                    }`}>
                      <div className="text-left sm:text-right">
                        <span className={`text-[10px] uppercase font-medium block ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/70'}`}>Est. Cost</span>
                        <span className={`text-xs font-bold font-mono ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#A3BE8C]'}`}>
                          {item.cost === 0 ? 'Free' : formatCurrency(item.cost, activeTrip.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isMobileView ? 'text-[#64748B] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]' : 'text-[#D8DEE9]/70 hover:text-white hover:bg-[#3B4252]'
                          }`}
                          title="Edit activity"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteActivity(item.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isMobileView ? 'text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEE2E2]' : 'text-[#D8DEE9]/70 hover:text-[#BF616A] hover:bg-[#BF616A]/15'
                          }`}
                          title="Delete activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* ========================================================= */}
      {/* FINAL DAY-WISE PLANNING CONFIRMATION                       */}
      {/* ========================================================= */}
      <div className={
        isMobileView
          ? "matte-card rounded-[24px] p-4 sm:p-5 border border-[#E2E6F0] bg-white text-[#1A1D2E] flex flex-col items-stretch gap-3.5 shadow-sm"
          : `glass-card rounded-2xl p-4 sm:p-5 border border-[#88C0D0]/30 bg-gradient-to-r from-[#242933] via-[#2E3440] to-[#242933] ${
              isMobileView ? 'flex flex-col items-stretch gap-3.5' : 'flex flex-col sm:flex-row items-center justify-between gap-4'
            } shadow-xl`
      }>
        <div className="space-y-1.5 text-left">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${
            isMobileView
              ? 'bg-[#EAFBF3] border-[#A3E5C3] text-[#00BA88]'
              : 'bg-[#A3BE8C]/15 border-[#A3BE8C]/30 text-[#A3BE8C]'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Day-Wise Planning Complete</span>
          </div>
          <h4 className={`font-extrabold text-sm sm:text-base leading-snug ${isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'}`}>
            Ready with your itinerary? Lock in your tour plan!
          </h4>
          <p className={`text-xs leading-relaxed ${isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/80'}`}>
            Confirm to view your finalized day-by-day travel schedule with transit notes and print/save options.
          </p>
        </div>

        <button
          type="button"
          onClick={confirmTripPlan}
          className={`${
            isMobileView ? 'w-full py-3.5 px-5' : 'px-6 py-3 shrink-0'
          } rounded-2xl text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap ${
            isMobileView
              ? 'bg-[#5D5FEF] hover:bg-[#4D4FD9] text-white shadow-md'
              : (activeTrip.isConfirmed
                  ? 'bg-[#A3BE8C] hover:bg-[#8FBCBB] text-[#1A1E24] shadow-glow'
                  : 'gradient-aurora hover:opacity-95 text-[#1A1E24] shadow-glow')
          }`}
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{activeTrip.isConfirmed ? '✓ Confirmed (View Schedule)' : '✓ Confirm & View Schedule'}</span>
        </button>
      </div>

      {/* Add / Edit Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1E24]/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 border border-[#3B4252] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2E3440]">
              <h3 className="font-bold text-[#ECEFF4] text-base flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#88C0D0]" />
                <span>{editingItem ? 'Edit Place to Visit' : `Add Place to Day ${formData.dayIndex}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#D8DEE9]/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-xs">
              {/* Day & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#D8DEE9] font-bold mb-1">Day</label>
                  <select
                    value={formData.dayIndex}
                    onChange={(e) => setFormData({ ...formData, dayIndex: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] font-semibold focus:ring-2 focus:ring-[#88C0D0]"
                  >
                    {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#D8DEE9] font-bold mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] font-mono focus:ring-2 focus:ring-[#88C0D0]"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[#D8DEE9] font-bold mb-1">Place Name or Activity Note *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={`e.g. Visit landmark, explore downtown, or dinner in ${activeTrip.cityName}`}
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-sm focus:ring-2 focus:ring-[#88C0D0]"
                />
              </div>

              {/* Category & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#D8DEE9] font-bold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ActivityCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]"
                  >
                    <option value="sightseeing">Sightseeing</option>
                    <option value="food">Food & Dining</option>
                    <option value="activity">Activity / Tour</option>
                    <option value="lodging">Hotel / Stay</option>
                    <option value="relaxation">Relaxation / Walk</option>
                    <option value="transport">Transit / Travel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#D8DEE9] font-bold mb-1">Estimated Cost ({getCurrencySymbol(activeTrip.currency)})</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] font-mono focus:ring-2 focus:ring-[#88C0D0]"
                  />
                </div>
              </div>

              {/* Transit Info */}
              <div>
                <label className="block text-[#D8DEE9] font-bold mb-1">Transit / Traffic Advice</label>
                <input
                  type="text"
                  value={formData.transitInfo}
                  onChange={(e) => setFormData({ ...formData, transitInfo: e.target.value })}
                  placeholder="e.g. 🚗 ~40 mins mountain drive (leave by 4:15 AM)"
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#D8DEE9] font-bold mb-1">Personal Notes / Tips</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Dress warmly in thermal layers, pre-book top lounge..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#242933] text-[#D8DEE9] hover:bg-[#2E3440] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gradient-accent text-[#1A1E24] font-bold shadow-glow"
                >
                  {editingItem ? 'Save Changes' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Confirmed Tour Plan Modal */}
      <TripConfirmedModal />

      {/* Handwritten Paper Journal Modal (Available for Manual & AI Plans) */}
      {isPaperJournalOpen && (
        <HandwrittenPaperJournal
          isOpen={isPaperJournalOpen}
          onClose={() => setIsPaperJournalOpen(false)}
          cityName={activeTrip.cityName}
          country={activeTrip.country}
          origin={activeTrip.origin}
          startDate={activeTrip.startDate}
          durationDays={activeTrip.daysCount}
          items={activeTrip.items}
          summary={activeTrip.title || `Handwritten travel diary & tour itinerary for ${activeTrip.cityName}.`}
          profile={activeTrip.groupProfile}
          weather={weather}
          budget={activeTrip.budget}
          totalCost={totalTripEstimatedCost}
        />
      )}

    </section>
  );
};
