import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Car, 
  Sun, 
  CloudRain, 
  Download, 
  Printer, 
  X, 
  Compass, 
  Edit3,
  BookOpen
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { getWeatherForTripDay } from '../../services/weatherApi';
import { getMembersSummary } from '../common/FamilyMembersSelector';
import { HandwrittenPaperJournal } from './HandwrittenPaperJournal';

export const TripConfirmedModal: React.FC = () => {
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const { 
    activeTrip, 
    isConfirmedModalOpen, 
    setIsConfirmedModalOpen, 
    unconfirmTripPlan, 
    totalTripEstimatedCost,
    weather,
    exportTripData
  } = useTrip();

  if (!isConfirmedModalOpen || !activeTrip) return null;

  const handlePrint = () => {
    window.print();
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1A1E24]/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#242933] border border-[#3B4252] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#ECEFF4]">
        
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#2E3440] via-[#242933] to-[#2E3440] border-b border-[#3B4252] flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3BE8C]/20 border border-[#A3BE8C]/30 text-[#A3BE8C] text-xs font-bold tracking-wide uppercase">
              <CheckCircle2 className="w-4 h-4 text-[#A3BE8C]" />
              <span>Tour Plan Confirmed & Ready</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#ECEFF4] tracking-tight">
              {activeTrip.origin ? `${activeTrip.origin} ➔ ` : ''}{activeTrip.cityName}, {activeTrip.country}
            </h2>
            <p className="text-sm text-[#D8DEE9]">
              Your personalized {activeTrip.daysCount}-day itinerary is locked in. Review your schedule, travel times, and weather forecast below.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsConfirmedModalOpen(false)}
            className="p-2.5 rounded-2xl bg-[#1A1E24] text-[#D8DEE9]/70 hover:text-white hover:bg-[#3B4252] transition-colors"
            title="Close summary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:px-8 bg-[#1A1E24]/70 border-b border-[#3B4252] text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#88C0D0] shrink-0" />
            <div>
              <div className="text-[#D8DEE9]/70 font-medium">Dates</div>
              <div className="font-bold text-[#ECEFF4]">{activeTrip.startDate} ({activeTrip.daysCount}d)</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#B48EAD] shrink-0" />
            <div>
              <div className="text-[#D8DEE9]/70 font-medium">Family & Travelers</div>
              <div className="font-bold text-[#ECEFF4] text-xs">
                {activeTrip.groupProfile?.members && activeTrip.groupProfile.members.length > 0
                  ? getMembersSummary(activeTrip.groupProfile.members)
                  : `${activeTrip.groupProfile?.numberOfHeads || 2} Heads • ${activeTrip.groupProfile?.ageGroup?.split(' ')[0] || 'Travelers'}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-[#A3BE8C] shrink-0" />
            <div>
              <div className="text-[#D8DEE9]/70 font-medium">Total Cost</div>
              <div className="font-bold text-[#A3BE8C] font-mono">
                {activeTrip.currency} {totalTripEstimatedCost}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-[#EBCB8B] shrink-0" />
            <div>
              <div className="text-[#D8DEE9]/70 font-medium">Planning Mode</div>
              <div className="font-bold text-[#ECEFF4] capitalize">
                {activeTrip.planningMode === 'ai' ? '✨ AI Optimized' : '✍️ Custom Plan'}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Day-by-Day Schedule */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[55vh] print:max-h-none scrollbar-thin">
          {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((dayNum) => {
            const dayItems = activeTrip.items
              .filter(item => item.dayIndex === dayNum)
              .sort((a, b) => a.time.localeCompare(b.time));
            const dayWeather = getWeatherForTripDay(weather, activeTrip.startDate, dayNum, activeTrip.city?.latitude);

            return (
              <div key={dayNum} className="space-y-4">
                
                {/* Day Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#3B4252]">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-[#88C0D0]/20 text-[#88C0D0] font-black text-xs uppercase tracking-wider">
                      Day {dayNum}
                    </span>
                    <span className="text-sm font-semibold text-[#ECEFF4]">
                      {getDayDateString(dayNum)}
                    </span>
                  </div>

                  {/* Weather for this day */}
                  {dayWeather && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#1A1E24] text-xs text-[#88C0D0]">
                      {dayWeather.precipitationProb > 40 ? (
                        <CloudRain className="w-3.5 h-3.5 text-[#88C0D0]" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-[#EBCB8B]" />
                      )}
                      <span>{dayWeather.maxTemp}°C</span>
                      <span className="text-[#D8DEE9]/70 hidden sm:inline">• {dayWeather.weatherDescription}</span>
                    </div>
                  )}
                </div>

                {/* Day Items List */}
                {dayItems.length === 0 ? (
                  <p className="text-xs text-[#D8DEE9]/60 italic py-2">No activities scheduled for this day yet.</p>
                ) : (
                  <div className="space-y-3">
                    {dayItems.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="p-4 rounded-2xl bg-[#1A1E24]/60 border border-[#3B4252] hover:border-[#4C566A] transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-[#2E3440] text-[#88C0D0] text-xs font-mono font-bold">
                              {item.time}
                            </span>
                            <h4 className="text-sm font-bold text-[#ECEFF4]">
                              {item.title}
                            </h4>
                            {item.isMustVisit && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EBCB8B]/20 text-[#EBCB8B] uppercase">
                                Must-Visit
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-xs text-[#D8DEE9] pl-1 border-l-2 border-[#3B4252]">
                              {item.notes}
                            </p>
                          )}

                          {/* Traffic & Transit info */}
                          {item.transitInfo && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#81A1C1] pt-0.5">
                              <Car className="w-3 h-3 text-[#81A1C1] shrink-0" />
                              <span>{item.transitInfo}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Cost & Timing */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 text-xs">
                          {item.cost > 0 ? (
                            <span className="font-mono font-bold text-[#A3BE8C]">
                              {activeTrip.currency} {item.cost}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#D8DEE9]/70">Free Entrance</span>
                          )}

                          {item.bestTimeToVisit && (
                            <span className="text-[10px] text-[#EBCB8B] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-[#EBCB8B]" />
                              {item.bestTimeToVisit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-[#1A1E24] border-t border-[#3B4252] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={unconfirmTripPlan}
            className="px-4 py-2.5 rounded-2xl bg-[#242933] hover:bg-[#2E3440] border border-[#3B4252] text-[#D8DEE9] hover:text-white text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Itinerary Details</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsJournalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#fdfaf2] hover:bg-[#f5ecd8] text-[#1e293b] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border border-[#d6cfbe]"
              title="View and print tour plan in handwritten paper journal format"
            >
              <BookOpen className="w-4 h-4 text-[#1e3a8a]" />
              <span className="font-handwritten text-sm font-bold text-[#1e3a8a]">📖 Paper Journal</span>
            </button>

            <button
              type="button"
              onClick={exportTripData}
              className="px-4 py-2.5 rounded-2xl bg-[#242933] hover:bg-[#2E3440] border border-[#3B4252] text-[#D8DEE9] hover:text-white text-xs font-semibold transition-colors flex items-center gap-2"
              title="Download JSON itinerary backup"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-2xl gradient-accent hover:opacity-95 text-[#1A1E24] text-xs font-bold transition-all shadow-glow flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* Handwritten Paper Journal Modal */}
      {isJournalOpen && (
        <HandwrittenPaperJournal
          isOpen={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
          cityName={activeTrip.cityName}
          country={activeTrip.country}
          origin={activeTrip.origin}
          startDate={activeTrip.startDate}
          durationDays={activeTrip.daysCount}
          items={activeTrip.items}
          summary={activeTrip.title || `Confirmed tour plan for ${activeTrip.cityName}.`}
          profile={activeTrip.groupProfile}
          weather={weather}
          budget={activeTrip.budget}
          totalCost={totalTripEstimatedCost}
        />
      )}

    </div>
  );
};
