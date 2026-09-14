import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  Plus, 
  Check, 
  ShieldCheck, 
  Star,
  Compass,
  Camera,
  Utensils,
  Ticket
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { useViewMode } from '../../context/ViewModeContext';
import { getTouristAttractions } from '../../services/geminiService';
import type { AttractionRecommendation } from '../../types/travel';

export const AttractionRecommendations: React.FC = () => {
  const { activeTrip, selectedDay, addActivity } = useTrip();
  const { isMobileView } = useViewMode();
  const [attractions, setAttractions] = useState<AttractionRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [customTargetDay, setCustomTargetDay] = useState<number | null>(null);

  const targetDay = customTargetDay ?? selectedDay;

  useEffect(() => {
    let isMounted = true;
    async function loadAttractions() {
      if (!activeTrip?.city) return;
      setIsLoading(true);
      try {
        const data = await getTouristAttractions(activeTrip.city);
        if (isMounted) {
          setAttractions(data);
        }
      } catch (err) {
        console.error('Failed to load attractions:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAttractions();
    return () => {
      isMounted = false;
    };
  }, [activeTrip?.city?.id, activeTrip?.cityName]);

  const handleAddAttraction = (attraction: AttractionRecommendation) => {
    // Extract default time from bestTimeToVisit or default to morning
    let defaultTime = '10:00';
    if (attraction.bestTimeToVisit.toLowerCase().includes('sunset') || attraction.bestTimeToVisit.toLowerCase().includes('dusk')) {
      defaultTime = '18:00';
    } else if (attraction.bestTimeToVisit.toLowerCase().includes('afternoon')) {
      defaultTime = '15:00';
    } else if (attraction.bestTimeToVisit.toLowerCase().includes('lunch') || attraction.bestTimeToVisit.toLowerCase().includes('brunch')) {
      defaultTime = '12:30';
    }

    addActivity({
      dayIndex: targetDay,
      time: defaultTime,
      title: attraction.title,
      location: `${attraction.title}, ${activeTrip.cityName}`,
      category: attraction.category,
      cost: attraction.estimatedCost,
      notes: `${attraction.description} (Best time: ${attraction.bestTimeToVisit})`,
      openingHours: attraction.openingHours,
      isMustVisit: attraction.isMustVisit,
    });

    setAddedIds(prev => ({ ...prev, [attraction.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [attraction.id]: false }));
    }, 2200);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
      case 'sightseeing':
        return <Camera className="w-3.5 h-3.5 text-sky-500" />;
      case 'activity':
        return <Ticket className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-teal-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`rounded-2xl p-6 border animate-pulse space-y-4 ${
        isMobileView ? 'bg-white border-[#E8ECF5]' : 'glass-card border-[#3B4252]'
      }`}>
        <div className={`h-6 w-48 rounded-lg ${isMobileView ? 'bg-[#E2E6F0]' : 'bg-[#3B4252]'}`}></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-44 rounded-2xl ${isMobileView ? 'bg-[#F4F6FB]' : 'bg-[#242933]'}`}></div>
          ))}
        </div>
      </div>
    );
  }

  if (attractions.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${
              isMobileView ? 'bg-[#EEF0FF] text-[#5D5FEF]' : 'bg-[#88C0D0]/15 text-[#88C0D0]'
            }`}>
              <Star className={`w-4 h-4 ${
                isMobileView ? 'fill-[#5D5FEF] text-[#5D5FEF]' : 'fill-[#88C0D0] text-[#88C0D0]'
              }`} />
            </span>
            <h2 className={`text-lg font-bold tracking-tight ${
              isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'
            }`}>
              Tourist Attractions in {activeTrip.cityName}
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${
            isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]/70'
          }`}>
            Curated must-visit spots. Select any attraction to automatically add it to your day's schedule.
          </p>
        </div>

        {/* Day Selector Quick Control */}
        <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-1.5 shrink-0 border ${
          isMobileView
            ? 'bg-white border-[#E2E6F0] text-[#1A1D2E] shadow-sm'
            : 'bg-[#242933] border-[#3B4252] text-[#ECEFF4]'
        }`}>
          <span className={`font-medium ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]'}`}>Add to:</span>
          <select
            value={targetDay}
            onChange={(e) => setCustomTargetDay(Number(e.target.value))}
            className={`bg-transparent font-bold focus:outline-none cursor-pointer ${
              isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'
            }`}
          >
            {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day} className={isMobileView ? 'bg-white text-[#1A1D2E]' : 'bg-[#1A1E24] text-[#ECEFF4]'}>
                Day {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attractions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attractions.map((attraction) => {
          const isAdded = Boolean(addedIds[attraction.id]);

          return (
            <div
              key={attraction.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between group relative overflow-hidden ${
                isMobileView
                  ? 'bg-white border-[#E8ECF5] text-[#1A1D2E] shadow-sm hover:shadow-md'
                  : 'glass-card border-[#3B4252] hover:border-[#4C566A] shadow-sm hover:shadow-glow'
              }`}
            >
              {/* Must-Visit Banner */}
              {attraction.isMustVisit && (
                <div className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 shadow-sm border ${
                  isMobileView
                    ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#B45309]'
                    : 'bg-[#EBCB8B]/15 border-[#EBCB8B]/30 text-[#EBCB8B]'
                }`}>
                  <Sparkles className={`w-3 h-3 ${isMobileView ? 'text-[#D97706]' : 'text-[#EBCB8B]'}`} />
                  <span>Must Visit</span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* Category & Title */}
                <div className="pr-20">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize mb-1 border ${
                    isMobileView
                      ? 'bg-[#F4F6FB] text-[#4F566B] border-[#E2E6F0]'
                      : 'bg-[#1A1E24] text-[#D8DEE9] border-[#3B4252]'
                  }`}>
                    {getCategoryIcon(attraction.category)}
                    <span>{attraction.category}</span>
                  </span>
                  <h3 className={`font-bold text-base leading-snug transition-colors ${
                    isMobileView
                      ? 'text-[#1A1D2E] group-hover:text-[#5D5FEF]'
                      : 'text-[#ECEFF4] group-hover:text-[#88C0D0]'
                  }`}>
                    {attraction.title}
                  </h3>
                </div>

                {/* Description */}
                <p className={`text-xs line-clamp-2 leading-relaxed ${
                  isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]/70'
                }`}>
                  {attraction.description}
                </p>

                {/* Opening Hours & Accessibility */}
                <div className={`space-y-1 pt-2 border-t text-[11px] ${
                  isMobileView ? 'border-[#F1F3F9]' : 'border-[#3B4252]/70'
                }`}>
                  <div className={`flex items-center gap-1.5 font-mono ${
                    isMobileView ? 'text-[#4F566B]' : 'text-[#D8DEE9]'
                  }`}>
                    <Clock className={`w-3 h-3 shrink-0 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                    <span>Hours: {attraction.openingHours}</span>
                  </div>
                  <div className={`flex items-start gap-1.5 ${
                    isMobileView ? 'text-[#15803D]' : 'text-[#A3BE8C]'
                  }`}>
                    <ShieldCheck className={`w-3 h-3 shrink-0 mt-0.5 ${isMobileView ? 'text-[#15803D]' : 'text-[#A3BE8C]'}`} />
                    <span className="line-clamp-1">{attraction.accessibility}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Cost & Add Action */}
              <div className={`pt-3 mt-3 border-t flex items-center justify-between gap-2 ${
                isMobileView ? 'border-[#F1F3F9]' : 'border-[#3B4252]'
              }`}>
                <div>
                  <span className={`text-[10px] block uppercase font-medium ${
                    isMobileView ? 'text-[#7E859B]' : 'text-[#D8DEE9]/70'
                  }`}>
                    Estimated Cost
                  </span>
                  <span className={`text-xs font-bold font-mono ${
                    isMobileView ? 'text-[#15803D]' : 'text-[#A3BE8C]'
                  }`}>
                    {attraction.estimatedCost === 0 ? 'Free Entry' : `${attraction.currency} ${attraction.estimatedCost}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddAttraction(attraction)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isAdded
                      ? isMobileView
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#A3BE8C] text-[#1A1E24]'
                      : isMobileView
                        ? 'bg-[#5D5FEF] hover:bg-[#4D4FD9] text-white'
                        : 'bg-[#88C0D0]/20 hover:bg-[#88C0D0] text-[#88C0D0] hover:text-[#1A1E24] border border-[#88C0D0]/30'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Day {targetDay}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
