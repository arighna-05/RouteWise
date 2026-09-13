import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Check, 
  ShieldCheck, 
  RefreshCw,
  Star,
  Loader2
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { getGeminiItinerarySuggestions } from '../../services/geminiService';
import type { GeminiSuggestion } from '../../types/travel';

export const GeminiItineraryAssistant: React.FC = () => {
  const { activeTrip, selectedDay, weather, addActivity } = useTrip();
  const [suggestions, setSuggestions] = useState<GeminiSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const fetchSuggestions = async () => {
    if (!activeTrip?.city) return;
    setIsLoading(true);
    try {
      const results = await getGeminiItinerarySuggestions(
        activeTrip.city,
        selectedDay,
        activeTrip.items,
        weather
      );
      setSuggestions(results);
    } catch (err) {
      console.error('Failed to get Gemini suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [activeTrip?.city?.id, selectedDay, activeTrip?.items?.length]);

  const handleAddSuggestion = (sug: GeminiSuggestion) => {
    addActivity({
      dayIndex: selectedDay,
      time: sug.suggestedTime || '14:00',
      title: sug.title,
      location: `${sug.title}, ${activeTrip.cityName}`,
      category: sug.category,
      cost: sug.estimatedCost,
      notes: sug.reason,
      openingHours: sug.openingHours || '09:00 - 18:00',
      isMustVisit: sug.isMustVisit,
    });

    setAddedIds(prev => ({ ...prev, [sug.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [sug.id]: false }));
    }, 2200);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-[#B48EAD]/30 bg-gradient-to-b from-[#2E3440]/90 to-[#242933]/95 shadow-lg relative overflow-hidden space-y-4">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 bg-[#B48EAD]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg gradient-accent text-[#1A1E24] shadow-glow">
            <Sparkles className="w-4 h-4 text-[#1A1E24]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#ECEFF4] flex items-center gap-1.5">
              <span>Gemini Smart Suggestions for Day {selectedDay}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#B48EAD]/20 text-[#B48EAD] text-[10px] font-mono">
                AI Powered
              </span>
            </h3>
            <p className="text-[11px] text-[#D8DEE9]/70">
              Must-visits and complementary stops tailored to your schedule & weather.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-[#D8DEE9]/70 hover:text-white hover:bg-[#3B4252] transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#88C0D0]' : ''}`} />
        </button>
      </div>

      {/* Suggestion Cards */}
      {isLoading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#D8DEE9]">
          <Loader2 className="w-4 h-4 text-[#88C0D0] animate-spin" />
          <span>Gemini analyzing Day {selectedDay} timeline...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-xs text-[#D8DEE9]/60 italic py-2">
          Your Day {selectedDay} schedule looks well balanced!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map((sug) => {
            const isAdded = Boolean(addedIds[sug.id]);

            return (
              <div
                key={sug.id}
                className="p-3.5 rounded-xl bg-[#1A1E24]/80 border border-[#3B4252] hover:border-[#4C566A] transition-all flex flex-col justify-between space-y-2 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2E3440] text-[#88C0D0] font-mono">
                      {sug.suggestedTime}
                    </span>
                    {sug.isMustVisit && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EBCB8B]/20 text-[#EBCB8B] flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-[#EBCB8B] text-[#EBCB8B]" />
                        Must-Visit
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-[#ECEFF4] text-xs leading-snug group-hover:text-[#88C0D0] transition-colors">
                    {sug.title}
                  </h4>

                  <p className="text-[11px] text-[#D8DEE9]/70 leading-normal line-clamp-2">
                    {sug.reason}
                  </p>

                  <div className="text-[10px] text-[#A3BE8C] flex items-center gap-1 pt-1 border-t border-[#2E3440]">
                    <ShieldCheck className="w-3 h-3 shrink-0 text-[#A3BE8C]" />
                    <span className="line-clamp-1">{sug.accessibility}</span>
                  </div>
                </div>

                {/* Card Bottom Cost & Add */}
                <div className="pt-2 border-t border-[#2E3440] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-[#ECEFF4] font-semibold">
                    {sug.estimatedCost === 0 ? 'Free' : `~${activeTrip.currency} ${sug.estimatedCost}`}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAddSuggestion(sug)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isAdded
                        ? 'bg-[#A3BE8C] text-[#1A1E24]'
                        : 'bg-[#88C0D0]/20 hover:bg-[#88C0D0] text-[#88C0D0] hover:text-[#1A1E24] border border-[#88C0D0]/30'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>+ Add to Day {selectedDay}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
