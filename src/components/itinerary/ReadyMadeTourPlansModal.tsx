import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  CalendarDays, 
  Loader2
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { getReadyMadeTourPlans } from '../../services/geminiService';
import type { ReadyMadeTourPlan } from '../../types/travel';

interface ReadyMadeTourPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadyMadeTourPlansModal: React.FC<ReadyMadeTourPlansModalProps> = ({ isOpen, onClose }) => {
  const { activeTrip, weather, applyReadyMadeTourPlan } = useTrip();
  const [plans, setPlans] = useState<ReadyMadeTourPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !activeTrip?.city) return;

    let isMounted = true;
    async function fetchPlans() {
      setIsLoading(true);
      try {
        const generatedPlans = await getReadyMadeTourPlans(
          activeTrip.city,
          activeTrip.daysCount,
          weather
        );
        if (isMounted) {
          setPlans(generatedPlans);
          if (generatedPlans.length > 0) {
            setSelectedPlanId(generatedPlans[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to generate ready-made plans:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTrip?.city, activeTrip?.daysCount, weather]);

  if (!isOpen) return null;

  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const handleApply = () => {
    if (!activePlan) return;
    applyReadyMadeTourPlan(activePlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1E24]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card rounded-3xl w-full max-w-4xl p-6 sm:p-8 border border-[#3B4252] shadow-2xl relative max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2E3440] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl gradient-accent text-[#1A1E24] shadow-glow">
              <Sparkles className="w-5 h-5 text-[#1A1E24]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#ECEFF4]">
                Suggested Tour Plans for {activeTrip.cityName}
              </h2>
              <p className="text-xs text-[#D8DEE9]/70">
                Tailored for your specified <strong>{activeTrip.daysCount}-day tour</strong>. Pick any plan to auto-generate your schedule with 1 click.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#D8DEE9]/70 hover:text-white hover:bg-[#3B4252] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#88C0D0] animate-spin" />
            <p className="text-sm text-[#D8DEE9]">Crafting tailored tour plans for {activeTrip.daysCount} days...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-5 space-y-6 scrollbar-thin">
            
            {/* Tour Plan Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#88C0D0]/15 border-[#88C0D0] shadow-glow'
                        : 'bg-[#1A1E24]/60 border-[#3B4252] hover:border-[#4C566A]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#2E3440] text-[#88C0D0]">
                          {plan.theme}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#ECEFF4]">
                          ~{activeTrip.currency} {plan.estimatedTotalCost} est.
                        </span>
                      </div>
                      <h3 className="font-bold text-[#ECEFF4] text-base mt-1">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-[#D8DEE9]/70 line-clamp-2 mt-1">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#2E3440] flex items-center justify-between text-[11px] text-[#D8DEE9]/70">
                      <span>{plan.items.length} Curated Stops</span>
                      <span className="text-[#88C0D0] font-semibold">{plan.durationDays} Days</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Plan Day-by-Day Preview */}
            {activePlan && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-[#1A1E24]/80 border border-[#3B4252]">
                  <div>
                    <h4 className="font-bold text-[#ECEFF4] text-sm">
                      {activePlan.name} • Day-by-Day Outline
                    </h4>
                    <p className="text-xs text-[#D8DEE9]/70 mt-0.5">
                      All spots include operating hours and verified accessibility.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#D8DEE9]/70 uppercase font-medium block">Total Estimated Cost</span>
                    <span className="text-sm font-bold text-[#A3BE8C] font-mono">
                      {activeTrip.currency} {activePlan.estimatedTotalCost}
                    </span>
                  </div>
                </div>

                {/* Day-by-Day Items Accordion / List */}
                <div className="space-y-4">
                  {Array.from({ length: activePlan.durationDays }, (_, i) => i + 1).map((dayNum) => {
                    const itemsForDay = activePlan.items.filter(item => item.dayIndex === dayNum);

                    return (
                      <div key={dayNum} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#88C0D0] uppercase tracking-wider">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>Day {dayNum} Schedule</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {itemsForDay.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl bg-[#1A1E24]/60 border border-[#3B4252] space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-[#88C0D0]">
                                  {item.time}
                                </span>
                                <span className="text-xs font-mono text-[#D8DEE9]/70">
                                  {item.cost === 0 ? 'Free' : `${activeTrip.currency} ${item.cost}`}
                                </span>
                              </div>
                              <div className="font-semibold text-[#ECEFF4] text-xs leading-snug">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[#D8DEE9]/70 line-clamp-1">
                                {item.notes}
                              </div>
                              {item.accessibilityNote && (
                                <div className="text-[10px] text-[#A3BE8C] line-clamp-1">
                                  {item.accessibilityNote}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#2E3440] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-[#D8DEE9]/70">
            Applying this plan will organize your manual itinerary. You can still customize or remove any item freely.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#242933] hover:bg-[#2E3440] border border-[#3B4252] text-[#D8DEE9] hover:text-white text-xs font-semibold transition-colors flex-1 sm:flex-initial"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading || !activePlan}
              className="px-6 py-2.5 rounded-xl gradient-accent hover:opacity-95 text-[#1A1E24] text-xs font-bold transition-all shadow-glow flex items-center justify-center gap-2 flex-1 sm:flex-initial disabled:opacity-50"
            >
              <span>Apply This Tour Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
