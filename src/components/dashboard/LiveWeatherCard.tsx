import React from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  Wind, 
  Droplets, 
  Umbrella, 
  RefreshCw, 
  Sparkles, 
  Thermometer, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { interpretWeatherCode } from '../../services/weatherApi';

export const LiveWeatherCard: React.FC = () => {
  const { activeTrip, weather, isLoadingWeather, weatherError, refreshWeather } = useTrip();

  // Pick dynamic icon based on weather icon string
  const getWeatherIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case 'sun':
        return <Sun className={`${className} text-amber-400`} />;
      case 'cloud-sun':
      case 'sun-cloud':
        return <CloudSun className={`${className} text-amber-300`} />;
      case 'cloud':
      case 'cloud-fog':
        return <Cloud className={`${className} text-slate-300`} />;
      case 'cloud-rain':
      case 'cloud-drizzle':
      case 'cloud-rain-heavy':
        return <CloudRain className={`${className} text-sky-400`} />;
      case 'cloud-lightning':
        return <CloudLightning className={`${className} text-yellow-400`} />;
      case 'snowflake':
        return <Snowflake className={`${className} text-sky-200`} />;
      default:
        return <Sun className={`${className} text-amber-400`} />;
    }
  };

  if (isLoadingWeather && !weather) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-800 rounded"></div>
            <div className="h-8 w-24 bg-slate-800 rounded"></div>
          </div>
          <div className="h-12 w-12 bg-slate-800 rounded-full"></div>
        </div>
        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (weatherError && !weather) {
    return (
      <div className="glass-card rounded-2xl p-6 border-rose-500/30 bg-rose-950/20 text-rose-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-sm">{weatherError}</p>
        </div>
        <button
          onClick={refreshWeather}
          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const currentAdvice = interpretWeatherCode(weather.weatherCode).advice;

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden border border-[#3B4252] hover:border-[#4C566A] transition-all shadow-glass">
      {/* Background ambient Nordic glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-[#88C0D0]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-[#81A1C1]/10 blur-3xl pointer-events-none" />

      {/* Header with Title & Refresh */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-[#88C0D0]/15 text-[#88C0D0]">
            <Thermometer className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#ECEFF4]">
            Live Weather • {activeTrip.cityName}
          </h3>
          <span className="text-[10px] text-[#A3BE8C] font-medium px-2 py-0.5 rounded-full bg-[#A3BE8C]/15 border border-[#A3BE8C]/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3BE8C] animate-pulse" /> Live API
          </span>
        </div>

        <button
          onClick={refreshWeather}
          disabled={isLoadingWeather}
          title="Refresh live weather data"
          className="text-xs text-[#D8DEE9]/70 hover:text-white p-1.5 rounded-lg hover:bg-[#3B4252] transition-colors flex items-center gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin text-[#88C0D0]' : ''}`} />
          <span className="text-[11px] font-mono hidden sm:inline">{weather.lastUpdated}</span>
        </button>
      </div>

      {/* Main Temperature Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#242933] border border-[#3B4252] shadow-inner flex items-center justify-center">
            {getWeatherIcon(weather.weatherIcon, "w-10 h-10")}
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#ECEFF4] tracking-tight">
                {weather.temperature}°
              </span>
              <span className="text-lg font-medium text-[#D8DEE9]/70">C</span>
            </div>
            <p className="text-sm font-medium text-[#ECEFF4] capitalize flex items-center gap-1.5 mt-0.5">
              <span>{weather.weatherDescription}</span>
              <span className="text-xs text-[#D8DEE9]/70 font-normal">
                (Feels like {weather.apparentTemperature}°C)
              </span>
            </p>
          </div>
        </div>

        {/* Travel Insight Pill */}
        <div className="sm:max-w-xs p-3 rounded-xl bg-[#242933] border border-[#3B4252] flex items-start gap-2.5 text-xs text-[#D8DEE9]">
          <Sparkles className="w-4 h-4 text-[#EBCB8B] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#ECEFF4] block">Travel Recommendation</span>
            <span>{currentAdvice}</span>
          </div>
        </div>
      </div>

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <div className="p-3 rounded-xl bg-[#1A1E24]/70 border border-[#3B4252] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#88C0D0]/15 text-[#88C0D0]">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#D8DEE9]/70 uppercase font-medium">Humidity</p>
            <p className="text-sm font-bold text-[#ECEFF4] font-mono">{weather.humidity}%</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#1A1E24]/70 border border-[#3B4252] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#8FBCBB]/15 text-[#8FBCBB]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#D8DEE9]/70 uppercase font-medium">Wind Speed</p>
            <p className="text-sm font-bold text-[#ECEFF4] font-mono">{weather.windSpeed} km/h</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#1A1E24]/70 border border-[#3B4252] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#81A1C1]/15 text-[#81A1C1]">
            <Umbrella className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#D8DEE9]/70 uppercase font-medium">Rain Chance</p>
            <p className="text-sm font-bold text-[#ECEFF4] font-mono">
              {weather.daily[0]?.precipitationProb ?? 0}%
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#1A1E24]/70 border border-[#3B4252] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EBCB8B]/15 text-[#EBCB8B]">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#D8DEE9]/70 uppercase font-medium">UV Index</p>
            <p className="text-sm font-bold text-[#ECEFF4] font-mono">
              {weather.uvIndex} <span className="text-[10px] text-[#D8DEE9]/70 font-normal">({weather.uvIndex > 5 ? 'High' : 'Moderate'})</span>
            </p>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast Row */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D8DEE9] mb-2.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#88C0D0]" /> 5-Day Forecast
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {weather.daily.slice(0, 5).map((day, idx) => (
            <div
              key={day.date}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                idx === 0 
                  ? 'bg-[#88C0D0]/15 border-[#88C0D0]/40 shadow-sm' 
                  : 'bg-[#1A1E24]/60 border-[#3B4252] hover:bg-[#2E3440]/60'
              }`}
            >
              <p className="text-xs font-semibold text-[#ECEFF4]">{day.dayName}</p>
              <div className="my-1.5 flex justify-center">
                {getWeatherIcon(day.weatherIcon, "w-6 h-6")}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                <span className="font-bold text-[#ECEFF4]">{day.maxTemp}°</span>
                <span className="text-[#D8DEE9]/50">{day.minTemp}°</span>
              </div>
              {day.precipitationProb > 20 && (
                <span className="text-[10px] text-[#88C0D0] font-medium flex items-center justify-center gap-0.5 mt-0.5">
                  <Droplets className="w-2.5 h-2.5" /> {day.precipitationProb}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
