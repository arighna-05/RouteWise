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
import { NordicDatePicker } from '../common/NordicDatePicker';

export const CityHero: React.FC = () => {
  const { activeTrip, updateTripDates } = useTrip();
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
