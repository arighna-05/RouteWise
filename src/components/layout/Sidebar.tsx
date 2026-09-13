import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Wallet, 
  Layers, 
  X, 
  CheckCircle2
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const Sidebar: React.FC<{ onOpenNewTripModal: () => void }> = ({ onOpenNewTripModal }) => {
  const {
    activeTrip,
    savedTrips,
    selectedDay,
    setSelectedDay,
    switchTrip,
    deleteTrip,
    isSidebarOpen,
    setIsSidebarOpen,
    updateTripDates,
  } = useTrip();

  const [activeTab, setActiveTab] = useState<'days' | 'trips'>('days');

  const totalSpent = activeTrip.items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const budgetPercentage = Math.min(100, Math.round((totalSpent / (activeTrip.budget || 1)) * 100));

  const days = Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1);

  const getDayStats = (dayIndex: number) => {
    const dayItems = activeTrip.items.filter(item => item.dayIndex === dayIndex);
    const completedItems = dayItems.filter(item => item.completed);
    return {
      total: dayItems.length,
      completed: completedItems.length,
    };
  };

  const handleAddDay = () => {
    const start = new Date(activeTrip.startDate);
    const currentEnd = new Date(activeTrip.endDate);
    currentEnd.setDate(currentEnd.getDate() + 1);
    updateTripDates(start.toISOString().split('T')[0], currentEnd.toISOString().split('T')[0]);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-2xl border-r border-slate-800 text-slate-200">
      
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="font-bold text-sm tracking-wide text-white uppercase">
              Trip Organizer
            </h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('days')}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'days'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Itinerary</span>
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'trips'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Saved ({savedTrips.length})</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'days' ? (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Itinerary Schedule
              </span>
              <button
                onClick={handleAddDay}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Add Day
              </button>
            </div>

            <div className="space-y-2">
              {days.map((day) => {
                const stats = getDayStats(day);
                const isSelected = selectedDay === day;

                const dateObj = new Date(activeTrip.startDate);
                dateObj.setDate(dateObj.getDate() + (day - 1));
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/60 shadow-lg shadow-sky-500/5'
                        : 'bg-slate-800/40 border-slate-850 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                        isSelected
                          ? 'gradient-accent text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                      }`}>
                        D{day}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            Day {day}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {formattedDate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{stats.total} {stats.total === 1 ? 'activity' : 'activities'}</span>
                          {stats.total > 0 && stats.completed === stats.total && (
                            <span className="text-emerald-400 flex items-center gap-0.5 text-[11px]">
                              • <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-sky-400 translate-x-1' : 'text-slate-600 group-hover:text-slate-400'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                All Saved Itineraries
              </span>
              <button
                onClick={onOpenNewTripModal}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            <div className="space-y-2.5">
              {savedTrips.map((trip) => {
                const isActive = trip.id === activeTrip.id;
                return (
                  <div
                    key={trip.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-sky-500/10 border-sky-500/50 shadow-md'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => {
                          switchTrip(trip.id);
                          setIsSidebarOpen(false);
                        }}
                        className="text-left flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate hover:text-sky-400 transition-colors">
                            {trip.title}
                          </span>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/30 text-sky-300 font-medium shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span>{trip.cityName}, {trip.country}</span>
                          <span>•</span>
                          <span>{trip.daysCount} days</span>
                        </p>
                      </button>

                      {savedTrips.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${trip.title}?`)) {
                              deleteTrip(trip.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-850 transition-colors"
                          title="Delete trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trip Budget Tracker</span>
          </div>
          <span className="text-xs font-mono font-medium text-slate-300">
            ${totalSpent} / ${activeTrip.budget}
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetPercentage > 90
                ? 'bg-rose-500'
                : budgetPercentage > 70
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-teal-400 to-sky-500'
            }`}
            style={{ width: `${budgetPercentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
          <span>{budgetPercentage}% allocated</span>
          <span className="text-slate-500">{activeTrip.items.length} total stops</span>
        </div>
      </div>

    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
