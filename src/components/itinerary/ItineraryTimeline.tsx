import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Check,
  Zap,
  Route,
  BookOpen
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import type { ActivityCategory, AttractionRecommendation, ItineraryItem } from '../../types/travel';
import { getWeatherForTripDay } from '../../services/weatherApi';
import { getTouristAttractions } from '../../services/geminiService';
import { 
  estimateTransitBetweenSpots, 
  calculateNextScheduledTime, 
  getEstimatedVisitDuration 
} from '../../services/trafficTransitService';
import { TripConfirmedModal } from './TripConfirmedModal';
import { HandwrittenPaperJournal } from './HandwrittenPaperJournal';
import { useViewMode } from '../../context/ViewModeContext';

interface ItineraryTimelineProps {
  onOpenAttractions?: () => void;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ onOpenAttractions }) => {
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

  // Quick Inline Note-Taking Bar State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('10:00');
  const [quickCategory, setQuickCategory] = useState<ActivityCategory>('sightseeing');
  const [quickCost, setQuickCost] = useState<number | ''>('');
  const [showAttractionPicker, setShowAttractionPicker] = useState(false);
  const [cityAttractions, setCityAttractions] = useState<AttractionRecommendation[]>([]);

  // Load destination attractions for quick search picker
  useEffect(() => {
    if (activeTrip?.city) {
      getTouristAttractions(activeTrip.city).then((res) => {
        if (Array.isArray(res)) setCityAttractions(res);
      });
    }
  }, [activeTrip?.city]);

  // Dynamic destination-aware suggestions for quick add placeholder
  const destinationSuggestions = useMemo(() => {
    const cityName = activeTrip?.cityName || 'your destination';
    const cityLower = cityName.toLowerCase();
    
    // 1. If real loaded attractions for this specific city exist, use the top 3
    if (cityAttractions && cityAttractions.length >= 2) {
      const topSpots = cityAttractions.slice(0, 3).map(a => a.title);
      return `✍️ e.g. "Arrive at hotel", ${topSpots.map(s => `"${s}"`).join(', ')}`;
    }

    // 2. Comprehensive destination-aware curated highlights
    if (cityLower.includes('tokyo') || cityLower.includes('japan')) {
      return `✍️ e.g. "Arrive at hotel", "Senso-ji Temple", "Shibuya Crossing", "Shinjuku Gyoen"`;
    } else if (cityLower.includes('kyoto')) {
      return `✍️ e.g. "Arrive at ryokan", "Fushimi Inari Shrine", "Kinkaku-ji", "Arashiyama Bamboo Grove"`;
    } else if (cityLower.includes('osaka')) {
      return `✍️ e.g. "Check in", "Dotonbori food walk", "Osaka Castle", "Universal Studios"`;
    } else if (cityLower.includes('paris') || cityLower.includes('france')) {
      return `✍️ e.g. "Arrive at hotel", "Eiffel Tower", "Louvre Museum", "Montmartre Cafe"`;
    } else if (cityLower.includes('rome') || cityLower.includes('italy')) {
      return `✍️ e.g. "Check in", "Colosseum", "Trevi Fountain", "Vatican Museums"`;
    } else if (cityLower.includes('london') || cityLower.includes('uk')) {
      return `✍️ e.g. "Arrive at hotel", "Tower Bridge", "British Museum", "Big Ben"`;
    } else if (cityLower.includes('bali') || cityLower.includes('indonesia')) {
      return `✍️ e.g. "Arrive at resort", "Uluwatu Temple", "Tegallalang Rice Terraces", "Seminyak Beach"`;
    } else if (cityLower.includes('darjeeling')) {
      return `✍️ e.g. "Arrive at hotel", "Tiger Hill sunrise", "Batasia Loop", "Glenary's Bakery"`;
    } else if (cityLower.includes('sikkim') || cityLower.includes('gangtok')) {
      return `✍️ e.g. "Arrive at hotel", "MG Marg walk", "Tsomgo Lake", "Rumtek Monastery"`;
    }

    return `✍️ e.g. "Arrive at hotel", "Explore downtown", "Visit top landmark in ${cityName}"`;
  }, [activeTrip?.cityName, cityAttractions]);

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

  // Quick add from inline bar with auto-transit calculation
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = quickTitle.trim();
    if (!cleanTitle) return;

    const lastItem = dayItems.length > 0 ? dayItems[dayItems.length - 1] : null;
    const transitEst = lastItem
      ? estimateTransitBetweenSpots(lastItem.title, cleanTitle)
      : estimateTransitBetweenSpots('Hotel', cleanTitle);

    let assignedTime = quickTime;
    // Auto-calculate time if user left time unchanged or empty
    if (lastItem && (!quickTime || quickTime === '10:00')) {
      const prevDuration = getEstimatedVisitDuration(lastItem.category, lastItem.title);
      assignedTime = calculateNextScheduledTime(lastItem.time, prevDuration, transitEst.durationMinutes);
    }

    const location = `${cleanTitle}, ${activeTrip.cityName}`;

    addActivity({
      dayIndex: selectedDay,
      time: assignedTime || '10:00',
      title: cleanTitle,
      location,
      category: quickCategory,
      cost: Number(quickCost) || 0,
      notes: `Scheduled for Day ${selectedDay} in ${activeTrip.cityName}.`,
      openingHours: '09:00 - 18:00',
      transitInfo: transitEst.trafficAdvice,
    });

    setQuickTitle('');
    setQuickCost('');
  };

  // 1-Click add from landmark picker with auto-transit calculation
  const handleAddLandmark = (attr: AttractionRecommendation) => {
    const lastItem = dayItems.length > 0 ? dayItems[dayItems.length - 1] : null;
    const transitEst = lastItem
      ? estimateTransitBetweenSpots(lastItem.title, attr.title)
      : estimateTransitBetweenSpots('Hotel', attr.title);

    let assignedTime = quickTime;
    if (lastItem && (!quickTime || quickTime === '10:00')) {
      const prevDuration = getEstimatedVisitDuration(lastItem.category, lastItem.title);
      assignedTime = calculateNextScheduledTime(lastItem.time, prevDuration, transitEst.durationMinutes);
    }

    addActivity({
      dayIndex: selectedDay,
      time: assignedTime || '10:00',
      title: attr.title,
      location: `${attr.title}, ${activeTrip.cityName}`,
      category: attr.category,
      cost: attr.estimatedCost,
      notes: attr.description,
      openingHours: attr.openingHours,
      bestTimeToVisit: attr.bestTimeToVisit,
      transitInfo: transitEst.trafficAdvice,
      isMustVisit: attr.isMustVisit,
    });
    setShowAttractionPicker(false);
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
    <section className="space-y-6">
      
      {/* Top Controls: Day Tabs and Paper Journal */}
      <div className="space-y-2.5 pb-3 border-b border-[#2E3440]">
        
        {/* Day-Wise Tabs - Full Width Smooth Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((dayNum) => {
            const isSelected = dayNum === selectedDay;
            const w = getWeatherForTripDay(weather, activeTrip.startDate, dayNum, activeTrip.city?.latitude);

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`px-3 py-2 rounded-xl text-left transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#88C0D0] text-[#1A1E24] shadow-glow border-[#88C0D0] font-bold'
                    : 'bg-[#242933] text-[#D8DEE9] hover:bg-[#2E3440] border-[#3B4252]'
                }`}
              >
                <div>
                  <div className="text-xs font-black tracking-wide uppercase">
                    Day {dayNum}
                  </div>
                  <div className={`text-[10px] sm:text-[11px] ${isSelected ? 'text-[#1A1E24]/80 font-semibold' : 'text-[#D8DEE9]/70'}`}>
                    {getDayDateString(dayNum)}
                  </div>
                </div>

                {/* Day Weather Pill */}
                {w && (
                  <div className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                    isSelected ? 'bg-[#1A1E24]/20 text-[#1A1E24]' : 'bg-[#1A1E24] text-[#88C0D0]'
                  }`}>
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
            className="p-2 rounded-xl bg-[#242933] border border-[#3B4252] text-[#D8DEE9] hover:text-white hover:bg-[#2E3440] transition-colors shrink-0"
            title="Add another day to tour"
          >
            <CalendarPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Action Row: Day Status & Paper Journal */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] font-semibold text-[#88C0D0]/85">
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
        <div className="glass-card rounded-2xl p-3.5 sm:p-5 border border-[#3B4252] space-y-3.5">
          {/* Weather condition and Day Title */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#88C0D0]/10 text-[#88C0D0] shrink-0 mt-0.5">
              {dayWeather?.precipitationProb && dayWeather.precipitationProb > 40 ? (
                <CloudRain className="w-5 h-5 text-[#88C0D0]" />
              ) : (
                <Sun className="w-5 h-5 text-[#EBCB8B]" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#ECEFF4] whitespace-nowrap">
                  Day {selectedDay} • {getDayDateString(selectedDay)}
                </h3>
                {dayWeather && (
                  <span className="px-2 py-0.5 rounded-lg bg-[#1A1E24] text-[11px] font-semibold text-[#88C0D0] whitespace-nowrap border border-[#3B4252]/60">
                    {dayWeather.maxTemp}° / {dayWeather.minTemp}°C • {dayWeather.weatherDescription}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#D8DEE9]/80 leading-relaxed">
                {dayWeather && dayWeather.precipitationProb > 40
                  ? `⚠️ High chance of rain (${dayWeather.precipitationProb}%). Outdoor hill visits may be wet.`
                  : '☀️ Favorable travel weather. Good visibility for sightseeing and outdoor photography.'}
              </p>
            </div>
          </div>

          {/* Dedicated Cost Summary & Full Form Action Row */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#2E3440]">
            <div className="flex items-center gap-3 sm:gap-5">
              <div>
                <span className="text-[9px] text-[#D8DEE9]/70 uppercase font-bold tracking-wider block">Day {selectedDay} Cost</span>
                <span className="text-xs sm:text-sm font-black text-[#ECEFF4] font-mono">
                  {activeTrip.currency} {dayEstimatedCost}
                </span>
              </div>

              <div className="h-6 w-px bg-[#3B4252]" />

              <div>
                <span className="text-[9px] text-[#D8DEE9]/70 uppercase font-bold tracking-wider block">Total Tour Cost</span>
                <span className="text-xs sm:text-sm font-black text-[#A3BE8C] font-mono">
                  {activeTrip.currency} {totalTripEstimatedCost}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 rounded-xl gradient-accent hover:opacity-95 text-[#1A1E24] text-xs font-bold transition-all shadow-glow flex items-center gap-1.5 shrink-0 active:scale-95"
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
                {activeTrip.currency} {dayEstimatedCost}
              </span>
            </div>

            <div className="h-8 w-px bg-[#3B4252] hidden sm:block" />

            <div>
              <span className="text-[10px] text-[#D8DEE9]/70 uppercase font-medium block">Total Tour Cost</span>
              <span className="text-sm font-bold text-[#A3BE8C] font-mono">
                {activeTrip.currency} {totalTripEstimatedCost}
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
      {/* DAY SCHEDULE: QUICK PLACE ADD BAR                        */}
      {/* ========================================================= */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 border border-[#88C0D0]/25 bg-gradient-to-r from-[#242933]/95 via-[#2E3440]/90 to-[#242933]/95 space-y-3">
        {/* Header & Quick Action Buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#88C0D0] uppercase tracking-wide">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Day {selectedDay} Schedule & Activities</span>
            </div>

            {/* Auto-Calculate Day Timings Button */}
            {dayItems.length > 0 && (
              <button
                type="button"
                onClick={handleAutoCalculateDaySchedule}
                className="px-2.5 py-1 rounded-xl bg-[#A3BE8C]/20 hover:bg-[#A3BE8C]/30 border border-[#A3BE8C]/40 text-[#A3BE8C] text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap shrink-0 active:scale-95"
                title="Automatically calculate day timings and transit durations"
              >
                <Zap className="w-3 h-3 text-[#A3BE8C]" />
                <span>⚡ Auto-Calculate</span>
              </button>
            )}
          </div>

          {/* Quick Helper Shortcuts Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {/* Link to Tourist Attraction Special Section */}
            {onOpenAttractions && (
              <button
                type="button"
                onClick={onOpenAttractions}
                className="px-2.5 py-1 rounded-xl bg-[#EBCB8B]/15 hover:bg-[#EBCB8B]/25 border border-[#EBCB8B]/30 text-[#EBCB8B] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 active:scale-95"
                title="Browse Tourist Attractions"
              >
                <Compass className="w-3 h-3" />
                <span>Tourist Attractions</span>
              </button>
            )}

            {/* Quick Landmark Picker Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttractionPicker(!showAttractionPicker)}
                className="px-2.5 py-1 rounded-xl bg-[#88C0D0]/15 hover:bg-[#88C0D0]/25 border border-[#88C0D0]/30 text-[#88C0D0] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 active:scale-95"
              >
                <Search className="w-3 h-3" />
                <span>Pick Landmark</span>
              </button>

              {/* Landmark Dropdown Menu */}
              {showAttractionPicker && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 max-h-64 overflow-y-auto bg-[#242933] border border-[#3B4252] rounded-2xl shadow-2xl p-2 z-30 divide-y divide-[#2E3440]">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#D8DEE9] uppercase">
                    Top Attractions in {activeTrip.cityName}
                  </div>
                  {cityAttractions.length > 0 ? (
                    cityAttractions.map((attr) => (
                      <button
                        key={attr.id}
                        type="button"
                        onClick={() => handleAddLandmark(attr)}
                        className="w-full p-2 text-left hover:bg-[#3B4252]/80 rounded-xl transition-colors flex items-start gap-2.5 group"
                      >
                        <div className="p-1.5 rounded-lg bg-[#88C0D0]/15 text-[#88C0D0] group-hover:bg-[#88C0D0] group-hover:text-[#1A1E24] transition-colors shrink-0 mt-0.5 font-bold">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#ECEFF4] truncate group-hover:text-[#88C0D0]">
                            {attr.title}
                          </div>
                          <div className="text-[10px] text-[#D8DEE9]/70 truncate">
                            {attr.bestTimeToVisit || attr.openingHours} • {attr.currency} {attr.estimatedCost}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="p-3 text-xs text-[#D8DEE9]/70 text-center">Loading landmarks...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Add Form - Responsive Dual Layout */}
        {isMobileView ? (
          <form onSubmit={handleQuickAdd} className="space-y-2">
            {/* Row 1: Full-Width Title / Activity Input */}
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder={destinationSuggestions}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] placeholder-[#4C566A] text-xs font-medium focus:ring-2 focus:ring-[#88C0D0]"
            />

            {/* Row 2: Time, Category, Cost, and Add Button in comfortable 2x2 grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Time Picker */}
              <input
                type="time"
                value={quickTime}
                onChange={(e) => setQuickTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-xs font-mono focus:ring-2 focus:ring-[#88C0D0]"
                title="Scheduled Time"
              />

              {/* Category Select */}
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value as ActivityCategory)}
                className="w-full px-2 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-xs focus:ring-2 focus:ring-[#88C0D0]"
              >
                <option value="sightseeing">Sightseeing</option>
                <option value="food">Food & Dining</option>
                <option value="lodging">Hotel / Stay</option>
                <option value="activity">Activity / Tour</option>
                <option value="relaxation">Relaxation / Walk</option>
                <option value="transport">Transit / Travel</option>
              </select>

              {/* Cost input */}
              <input
                type="number"
                min="0"
                value={quickCost}
                onChange={(e) => setQuickCost(e.target.value ? Number(e.target.value) : '')}
                placeholder={`Cost (${activeTrip.currency})`}
                className="w-full px-2.5 py-2 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] placeholder-[#4C566A] text-xs font-mono focus:ring-2 focus:ring-[#88C0D0]"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="w-full py-2 px-3 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] text-xs font-extrabold transition-all shadow-glow flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add to Day {selectedDay}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-2">
            {/* Time Picker */}
            <input
              type="time"
              value={quickTime}
              onChange={(e) => setQuickTime(e.target.value)}
              className="w-full sm:w-36 shrink-0 px-3 py-2.5 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-xs font-mono focus:ring-2 focus:ring-[#88C0D0]"
              title="Scheduled Time"
            />

            {/* Place Title Input */}
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder={destinationSuggestions}
              className="flex-1 w-full px-4 py-2.5 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] placeholder-[#4C566A] text-xs font-medium focus:ring-2 focus:ring-[#88C0D0]"
            />

            {/* Category Select */}
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as ActivityCategory)}
              className="w-full sm:w-32 px-3 py-2.5 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] text-xs focus:ring-2 focus:ring-[#88C0D0]"
            >
              <option value="sightseeing">Sightseeing</option>
              <option value="food">Food & Dining</option>
              <option value="lodging">Hotel / Stay</option>
              <option value="activity">Activity / Tour</option>
              <option value="relaxation">Relaxation / Walk</option>
              <option value="transport">Transit / Travel</option>
            </select>

            {/* Cost input */}
            <input
              type="number"
              min="0"
              value={quickCost}
              onChange={(e) => setQuickCost(e.target.value ? Number(e.target.value) : '')}
              placeholder={`Cost (${activeTrip.currency})`}
              className="w-full sm:w-28 px-3 py-2.5 rounded-xl bg-[#1A1E24] border border-[#3B4252] text-[#ECEFF4] placeholder-[#4C566A] text-xs font-mono focus:ring-2 focus:ring-[#88C0D0]"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!quickTitle.trim()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] text-xs font-extrabold transition-all shadow-glow flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Day {selectedDay}</span>
            </button>
          </form>
        )}
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
            <div className="p-3 rounded-xl bg-[#1A1E24]/90 border border-[#3B4252] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#88C0D0] font-semibold">
                <Route className="w-4 h-4 text-[#88C0D0] shrink-0" />
                <span>
                  Estimated Day Travel Time: <strong className="text-[#ECEFF4] font-mono">{dayTransitStats.totalText}</strong> ({dayTransitStats.journeysCount} transit {dayTransitStats.journeysCount === 1 ? 'journey' : 'journeys'})
                </span>
              </div>
              <div className="text-[11px] text-[#D8DEE9]/70 truncate">
                {dayTransitStats.journeys.join(' • ')}
              </div>
            </div>
          )}

          {autoCalcMessage && (
            <div className="p-2.5 rounded-xl bg-[#A3BE8C]/15 border border-[#A3BE8C]/30 text-[#A3BE8C] text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{autoCalcMessage}</span>
            </div>
          )}

          {dayItems.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 border border-dashed border-[#3B4252] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#242933] text-[#D8DEE9] flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6 text-[#88C0D0]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#ECEFF4] text-sm">No places scheduled for Day {selectedDay} yet</h4>
                <p className="text-xs text-[#D8DEE9] max-w-sm mx-auto">
                  Add a place or activity above, pick from the landmark dropdown, or check the Gemini suggestions on the right.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {dayItems.map((item) => {
                const isAccessCaution = item.accessibilityStatus === 'caution';
                const isAccessClosed = item.accessibilityStatus === 'closed';

                return (
                  <div
                    key={item.id}
                    className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 group ${
                      item.completed
                        ? 'border-[#A3BE8C]/30 bg-[#A3BE8C]/5 opacity-80'
                        : 'border-[#3B4252] hover:border-[#4C566A]'
                    }`}
                  >
                    {/* Left Column: Time, Status, Title, Location */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Completion Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleActivityComplete(item.id)}
                        className={`mt-1 p-1 rounded-lg transition-colors shrink-0 ${
                          item.completed
                            ? 'text-[#A3BE8C] bg-[#A3BE8C]/20'
                            : 'text-[#4C566A] hover:text-[#ECEFF4] hover:bg-[#3B4252]'
                        }`}
                        title={item.completed ? 'Mark as pending' : 'Mark as visited'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Time Badge */}
                          <span className="px-2 py-0.5 rounded-md bg-[#1A1E24] text-[#88C0D0] font-mono font-bold text-xs">
                            {item.time}
                          </span>

                          {/* Category Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadgeClass(item.category)}`}>
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#A3BE8C]/15 text-[#A3BE8C] border border-[#A3BE8C]/30 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Open & Accessible</span>
                            </span>
                          )}
                        </div>

                        {/* Spot Title */}
                        <h4 className={`text-base font-bold leading-snug ${item.completed ? 'line-through text-[#D8DEE9]/50' : 'text-[#ECEFF4]'}`}>
                          {item.title}
                        </h4>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-[#D8DEE9]">
                          <MapPin className="w-3.5 h-3.5 text-[#88C0D0] shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>

                        {/* Notes / Travel Journal text */}
                        {item.notes && (
                          <p className="text-xs text-[#D8DEE9] italic pl-2 border-l-2 border-[#3B4252] mt-1">
                            "{item.notes}"
                          </p>
                        )}

                        {/* Visit Time Advice & Traffic/Transit Info */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                          {item.bestTimeToVisit && (
                            <div className="flex items-center gap-1 text-[#EBCB8B] font-medium">
                              <Clock className="w-3 h-3 text-[#EBCB8B] shrink-0" />
                              <span>Best Time: {item.bestTimeToVisit}</span>
                            </div>
                          )}

                          {item.transitInfo && (
                            <div className="flex items-center gap-1 text-[#81A1C1] font-medium">
                              <Car className="w-3 h-3 text-[#81A1C1] shrink-0" />
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
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2E3440]">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-[#D8DEE9]/70 uppercase font-medium block">Est. Cost</span>
                        <span className="text-xs font-bold text-[#A3BE8C] font-mono">
                          {item.cost === 0 ? 'Free' : `${activeTrip.currency} ${item.cost}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-[#D8DEE9]/70 hover:text-white hover:bg-[#3B4252] transition-colors"
                          title="Edit activity"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteActivity(item.id)}
                          className="p-1.5 rounded-lg text-[#D8DEE9]/70 hover:text-[#BF616A] hover:bg-[#BF616A]/15 transition-colors"
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
      <div className={`glass-card rounded-2xl p-4 sm:p-5 border border-[#88C0D0]/30 bg-gradient-to-r from-[#242933] via-[#2E3440] to-[#242933] ${
        isMobileView ? 'flex flex-col items-stretch gap-3.5' : 'flex flex-col sm:flex-row items-center justify-between gap-4'
      } shadow-xl`}>
        <div className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#A3BE8C]/15 border border-[#A3BE8C]/30 text-[#A3BE8C] text-[11px] font-bold whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Day-Wise Planning Complete</span>
          </div>
          <h4 className="font-extrabold text-sm sm:text-base text-[#ECEFF4] leading-snug">
            Ready with your itinerary? Lock in your tour plan!
          </h4>
          <p className="text-xs text-[#D8DEE9]/80 leading-relaxed">
            Confirm to view your finalized day-by-day travel schedule with transit notes and print/save options.
          </p>
        </div>

        <button
          type="button"
          onClick={confirmTripPlan}
          className={`${
            isMobileView ? 'w-full py-3 px-5' : 'px-6 py-3 shrink-0'
          } rounded-xl text-xs sm:text-sm font-black tracking-wide shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap ${
            activeTrip.isConfirmed
              ? 'bg-[#A3BE8C] hover:bg-[#8FBCBB] text-[#1A1E24]'
              : 'gradient-aurora hover:opacity-95 text-[#1A1E24]'
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
                  placeholder={destinationSuggestions.replace('✍️ ', '')}
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
                  <label className="block text-[#D8DEE9] font-bold mb-1">Estimated Cost ({activeTrip.currency})</label>
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
