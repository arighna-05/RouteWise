import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Coins, 
  Languages, 
  Clock, 
  CalendarRange, 
  Edit2,
  Check
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { useViewMode } from '../../context/ViewModeContext';
import { NordicDatePicker } from '../common/NordicDatePicker';

export const CityHero: React.FC = () => {
  const { activeTrip, updateTripDates } = useTrip();
  const { isMobileView } = useViewMode();
  const [localTime, setLocalTime] = useState<string>('');
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [startDate, setStartDate] = useState(activeTrip.startDate);
  const [endDate, setEndDate] = useState(activeTrip.endDate);

  useEffect(() => {
    setStartDate(activeTrip.startDate);
    setEndDate(activeTrip.endDate);
  }, [activeTrip.startDate, activeTrip.endDate]);

  useEffect(() => {
    const updateCityTime = () => {
      try {
        const timeString = new Intl.DateTimeFormat('en-US', {
          timeZone: activeTrip.city?.timezone || undefined,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date());
        setLocalTime(timeString);
      } catch {
        setLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };

    updateCityTime();
    const interval = setInterval(updateCityTime, 10000);
    return () => clearInterval(interval);
  }, [activeTrip.city?.timezone]);

  const handleSaveDates = () => {
    updateTripDates(startDate, endDate);
    setIsEditingDates(false);
  };

  const city = activeTrip.city;

  // =========================================================================
  // MOBILE VIEW: Clean Modern Travel Card (Screen 1 & 2 Inspiration)
  // =========================================================================
  if (isMobileView) {
    return (
      <div className="matte-card rounded-[26px] p-4 text-[#1A1D2E] shadow-sm border border-[#E8ECF5] overflow-hidden space-y-3 animate-in fade-in duration-300">
        {/* Destination Image with Badge */}
        <div className="relative w-full h-40 rounded-2xl overflow-hidden shadow-inner">
          <img
            src={city?.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80'}
            alt={activeTrip.cityName}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          {/* Top Location Pill */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-[#1A1D2E] shadow-sm">
              <MapPin className="w-3 h-3 text-[#5D5FEF]" />
              <span>{activeTrip.origin ? `${activeTrip.origin} ➔ ` : ''}{activeTrip.cityName}</span>
            </span>
          </div>

          {/* Bottom Right Status Badge (Pastel Mint) */}
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAFBF3]/95 backdrop-blur-md text-[11px] font-bold text-[#00BA88] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00BA88] animate-pulse"></span>
              <span>{activeTrip.isConfirmed ? 'Confirmed' : 'Ongoing'}</span>
            </span>
          </div>

          {/* Local Time Pill */}
          {localTime && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white shadow-sm">
                <Clock className="w-2.5 h-2.5 text-[#A3BE8C]" />
                <span>{localTime} Local</span>
              </span>
            </div>
          )}
        </div>

        {/* Title and Summary */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-[#1A1D2E] tracking-tight">
              {activeTrip.cityName}, {activeTrip.country}
            </h1>
          </div>
          <p className="text-xs text-[#7E859B] line-clamp-2 leading-relaxed">
            {city?.description || 'Your tailored travel itinerary with real-time weather and activity scheduling.'}
          </p>
        </div>

        {/* Feature Pills (Currency, Language) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          {city?.currency && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F4F6FB] border border-[#E2E6F0] text-[#697089]">
              <Coins className="w-3 h-3 text-[#EBCB8B]" />
              <span>Currency: <strong className="text-[#1A1D2E]">{city.currency}</strong></span>
            </div>
          )}
          {city?.language && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F4F6FB] border border-[#E2E6F0] text-[#697089]">
              <Languages className="w-3 h-3 text-[#5D5FEF]" />
              <span>Lang: <strong className="text-[#1A1D2E]">{city.language}</strong></span>
            </div>
          )}
        </div>

        {/* Trip Dates Row */}
        <div className="p-2.5 rounded-xl bg-[#F4F6FB] border border-[#E2E6F0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[#5D5FEF] shrink-0" />
            {isEditingDates ? (
              <div className="flex items-center gap-2 flex-wrap">
                <NordicDatePicker value={startDate} onChange={setStartDate} className="w-36 text-xs" />
                <span className="text-[11px] text-[#7E859B]">to</span>
                <NordicDatePicker value={endDate} onChange={setEndDate} className="w-36 text-xs" />
                <button
                  type="button"
                  onClick={handleSaveDates}
                  className="p-1.5 rounded-lg bg-[#5D5FEF] text-white hover:bg-[#4D4FD9]"
                  title="Save dates"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-[#1A1D2E] font-semibold text-[11px]">
                {activeTrip.startDate} – {activeTrip.endDate} <span className="text-[#7E859B] font-normal">({activeTrip.daysCount} days)</span>
              </span>
            )}
          </div>

          {!isEditingDates && (
            <button
              type="button"
              onClick={() => setIsEditingDates(true)}
              className="text-[#5D5FEF] hover:text-[#4D4FD9] p-1 text-[11px] font-bold flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // DESKTOP VIEW: Original Multi-Stat Rich Banner
  // =========================================================================
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#3B4252] bg-[#242933] group">
      <div className="absolute inset-0 z-0">
        <img
          src={city?.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80'}
          alt={activeTrip.cityName}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-[0.40]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1E24] via-[#1A1E24]/75 to-transparent" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between min-h-[260px] sm:min-h-[300px]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#242933]/85 backdrop-blur-md border border-[#3B4252] text-xs font-semibold text-[#ECEFF4] shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-[#88C0D0]" />
              <span>{activeTrip.origin ? `${activeTrip.origin} ➔ ` : ''}{activeTrip.cityName}, {activeTrip.country}</span>
            </span>

            {activeTrip.isConfirmed && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#A3BE8C]/20 border border-[#A3BE8C]/40 text-xs font-bold text-[#A3BE8C]">
                <Check className="w-3.5 h-3.5 text-[#A3BE8C]" />
                <span>Confirmed</span>
              </span>
            )}

            {localTime && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#242933]/85 backdrop-blur-md border border-[#3B4252] text-xs font-medium text-[#D8DEE9]">
                <Clock className="w-3 h-3 text-[#A3BE8C]" />
                <span>{localTime} Local</span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 sm:mt-10">
          <h1 className="text-3xl sm:text-5xl font-black text-[#ECEFF4] tracking-tight drop-shadow-md">
            {activeTrip.origin ? `${activeTrip.origin} ➔ ` : ''}{activeTrip.cityName}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#D8DEE9] max-w-2xl font-normal leading-relaxed drop-shadow line-clamp-2">
            {city?.description || 'Your tailored travel itinerary with real-time weather and activity scheduling.'}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-[#4C566A]/40 text-xs text-[#D8DEE9]">
            {city?.currency && (
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#EBCB8B]" />
                <span>Currency: <strong className="text-[#ECEFF4]">{city.currency}</strong></span>
              </div>
            )}

            {city?.language && (
              <div className="flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-[#8FBCBB]" />
                <span>Language: <strong className="text-[#ECEFF4]">{city.language}</strong></span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-[#88C0D0]" />
              {isEditingDates ? (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <NordicDatePicker
                    value={startDate}
                    onChange={setStartDate}
                    className="w-48"
                  />
                  <span className="text-xs text-[#D8DEE9]">to</span>
                  <NordicDatePicker
                    value={endDate}
                    onChange={setEndDate}
                    className="w-48"
                  />
                  <button
                    onClick={handleSaveDates}
                    className="p-2 rounded-xl bg-[#88C0D0] text-[#1A1E24] hover:bg-[#81A1C1] transition-colors"
                    title="Save dates"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>
                    <strong className="text-[#ECEFF4]">{activeTrip.startDate}</strong> to <strong className="text-[#ECEFF4]">{activeTrip.endDate}</strong> ({activeTrip.daysCount} days)
                  </span>
                  <button
                    onClick={() => setIsEditingDates(true)}
                    className="text-[#D8DEE9]/70 hover:text-white p-0.5 transition-colors"
                    title="Edit trip dates"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
