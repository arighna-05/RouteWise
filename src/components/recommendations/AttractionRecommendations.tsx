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
import { getTouristAttractions } from '../../services/geminiService';
import type { AttractionRecommendation } from '../../types/travel';

export const AttractionRecommendations: React.FC = () => {
  const { activeTrip, selectedDay, addActivity } = useTrip();
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
        return <Utensils className="w-3.5 h-3.5 text-amber-400" />;
      case 'sightseeing':
        return <Camera className="w-3.5 h-3.5 text-sky-400" />;
      case 'activity':
        return <Ticket className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-teal-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-[#3B4252] animate-pulse space-y-4">
        <div className="h-6 w-48 bg-[#3B4252] rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-[#242933] rounded-2xl"></div>
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
            <span className="p-1.5 rounded-lg bg-[#88C0D0]/15 text-[#88C0D0]">
              <Star className="w-4 h-4 fill-[#88C0D0] text-[#88C0D0]" />
            </span>
            <h2 className="text-lg font-bold text-[#ECEFF4] tracking-tight">
              Tourist Attractions in {activeTrip.cityName}
            </h2>
          </div>
          <p className="text-xs text-[#D8DEE9]/70 mt-0.5">
            Curated must-visit spots. Select any attraction to automatically add it to your day's schedule.
          </p>
        </div>

        {/* Day Selector Quick Control */}
        <div className="flex items-center gap-2 text-xs bg-[#242933] border border-[#3B4252] rounded-xl px-3 py-1.5 shrink-0">
          <span className="text-[#D8DEE9] font-medium">Add to:</span>
          <select
            value={targetDay}
            onChange={(e) => setCustomTargetDay(Number(e.target.value))}
            className="bg-transparent text-[#88C0D0] font-bold focus:outline-none cursor-pointer"
          >
            {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day} className="bg-[#1A1E24] text-[#ECEFF4]">
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
              className="glass-card rounded-2xl p-4 sm:p-5 border border-[#3B4252] hover:border-[#4C566A] transition-all flex flex-col justify-between group shadow-sm hover:shadow-glow relative overflow-hidden"
            >
              {/* Must-Visit Banner */}
              {attraction.isMustVisit && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#EBCB8B]/15 border border-[#EBCB8B]/30 text-[#EBCB8B] text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 text-[#EBCB8B]" />
                  <span>Must Visit</span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* Category & Title */}
                <div className="pr-20">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1A1E24] text-[11px] font-semibold text-[#D8DEE9] capitalize mb-1 border border-[#3B4252]">
                    {getCategoryIcon(attraction.category)}
                    <span>{attraction.category}</span>
                  </span>
                  <h3 className="font-bold text-[#ECEFF4] text-base leading-snug group-hover:text-[#88C0D0] transition-colors">
                    {attraction.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-[#D8DEE9]/70 line-clamp-2 leading-relaxed">
                  {attraction.description}
                </p>

                {/* Opening Hours & Accessibility */}
                <div className="space-y-1 pt-2 border-t border-[#3B4252]/70 text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#D8DEE9] font-mono">
                    <Clock className="w-3 h-3 text-[#88C0D0] shrink-0" />
                    <span>Hours: {attraction.openingHours}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[#A3BE8C]">
                    <ShieldCheck className="w-3 h-3 text-[#A3BE8C] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{attraction.accessibility}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Cost & Add Action */}
              <div className="pt-3 mt-3 border-t border-[#3B4252] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-[#D8DEE9]/70 block uppercase font-medium">Estimated Cost</span>
                  <span className="text-xs font-bold text-[#A3BE8C] font-mono">
                    {attraction.estimatedCost === 0 ? 'Free Entry' : `${attraction.currency} ${attraction.estimatedCost}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddAttraction(attraction)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAdded
                      ? 'bg-[#A3BE8C] text-[#1A1E24]'
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
