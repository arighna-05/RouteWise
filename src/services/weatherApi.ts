import type { City, DailyForecast, HourlyForecast, WeatherData } from '../types/travel';
import { POPULAR_DESTINATIONS } from './mockDestinations';

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  timezone?: string;
  population?: number;
  admin1?: string;
}

// Map WMO weather codes to human descriptions and icon identifiers
export function interpretWeatherCode(code: number): { label: string; icon: string; advice: string } {
  switch (code) {
    case 0:
      return { label: 'Clear Sky', icon: 'sun', advice: 'Great conditions for outdoor exploring and sightseeing.' };
    case 1:
      return { label: 'Mainly Clear', icon: 'sun-cloud', advice: 'Pleasant weather, ideal for rooftop views or walking tours.' };
    case 2:
      return { label: 'Partly Cloudy', icon: 'cloud-sun', advice: 'Good lighting for photography without harsh glare.' };
    case 3:
      return { label: 'Overcast', icon: 'cloud', advice: 'Good day for visiting museums or indoor food markets.' };
    case 45:
    case 48:
      return { label: 'Foggy', icon: 'cloud-fog', advice: 'Low visibility; check observatory tickets before visiting.' };
    case 51:
    case 53:
    case 55:
      return { label: 'Drizzle', icon: 'cloud-drizzle', advice: 'Light misting. A water-resistant jacket will suffice.' };
    case 61:
      return { label: 'Light Rain', icon: 'cloud-rain', advice: 'Keep a small umbrella in your daypack.' };
    case 63:
    case 65:
      return { label: 'Heavy Rain', icon: 'cloud-rain-heavy', advice: 'Perfect excuse for cozy cafes or shopping arcades.' };
    case 71:
    case 73:
    case 75:
      return { label: 'Snowfall', icon: 'snowflake', advice: 'Bundle up in warm layers and wear non-slip boots.' };
    case 77:
      return { label: 'Snow Grains', icon: 'snowflake', advice: 'Chilly frosty day; enjoy seasonal hot drinks.' };
    case 80:
    case 81:
    case 82:
      return { label: 'Rain Showers', icon: 'cloud-rain', advice: 'Intermittent passing showers expected.' };
    case 85:
    case 86:
      return { label: 'Snow Showers', icon: 'snowflake', advice: 'Cold conditions with passing flurries.' };
    case 95:
    case 96:
    case 99:
      return { label: 'Thunderstorm', icon: 'cloud-lightning', advice: 'Unsettled conditions; plan indoor activities during peak storms.' };
    default:
      return { label: 'Clear & Mild', icon: 'sun', advice: 'Enjoy your travel day!' };
  }
}

export function detectCurrency(countryCode?: string, countryName?: string): string {
  const code = (countryCode || '').toUpperCase();
  const name = (countryName || '').toLowerCase();

  // India & regions
  if (code === 'IN' || name.includes('india') || name.includes('sikkim') || name.includes('arunachal') || name.includes('ladakh') || name.includes('kashmir') || name.includes('goa') || name.includes('kerala')) {
    return 'INR (₹)';
  }

  // East & Southeast Asia
  if (code === 'JP' || name.includes('japan')) return 'JPY (¥)';
  if (code === 'CN' || name.includes('china')) return 'CNY (¥)';
  if (code === 'KR' || name.includes('korea')) return 'KRW (₩)';
  if (code === 'TH' || name.includes('thailand')) return 'THB (฿)';
  if (code === 'ID' || name.includes('indonesia') || name.includes('bali')) return 'IDR (Rp)';
  if (code === 'SG' || name.includes('singapore')) return 'SGD (S$)';
  if (code === 'MY' || name.includes('malaysia')) return 'MYR (RM)';
  if (code === 'VN' || name.includes('vietnam')) return 'VND (₫)';
  if (code === 'PH' || name.includes('philippines')) return 'PHP (₱)';
  if (code === 'HK' || name.includes('hong kong')) return 'HKD (HK$)';
  if (code === 'TW' || name.includes('taiwan')) return 'TWD (NT$)';

  // Europe - Eurozone (20 countries)
  const euroCodes = ['FR', 'DE', 'IT', 'ES', 'NL', 'AT', 'BE', 'GR', 'PT', 'IE', 'FI', 'SK', 'SI', 'LU', 'EE', 'LV', 'LT', 'CY', 'MT', 'HR'];
  if (euroCodes.includes(code) || name.includes('france') || name.includes('italy') || name.includes('spain') || name.includes('germany') || name.includes('greece') || name.includes('netherlands') || name.includes('austria') || name.includes('portugal') || name.includes('ireland')) {
    return 'EUR (€)';
  }

  // Non-Euro European nations
  if (code === 'GB' || name.includes('united kingdom') || name.includes('england') || name.includes('scotland') || name.includes('wales') || name.includes('london')) {
    return 'GBP (£)';
  }
  if (code === 'CH' || name.includes('switzerland') || name.includes('swiss')) return 'CHF (Fr)';
  if (code === 'NO' || name.includes('norway')) return 'NOK (kr)';
  if (code === 'SE' || name.includes('sweden')) return 'SEK (kr)';
  if (code === 'DK' || name.includes('denmark')) return 'DKK (kr)';
  if (code === 'IS' || name.includes('iceland')) return 'ISK (kr)';
  if (code === 'TR' || name.includes('turkey') || name.includes('türkiye')) return 'TRY (₺)';
  if (code === 'PL' || name.includes('poland')) return 'PLN (zł)';
  if (code === 'CZ' || name.includes('czech')) return 'CZK (Kč)';
  if (code === 'HU' || name.includes('hungary')) return 'HUF (Ft)';

  // Americas
  if (code === 'CA' || name.includes('canada')) return 'CAD (CA$)';
  if (code === 'AU' || name.includes('australia')) return 'AUD (A$)';
  if (code === 'NZ' || name.includes('new zealand')) return 'NZD (NZ$)';
  if (code === 'MX' || name.includes('mexico')) return 'MXN (Mex$)';
  if (code === 'BR' || name.includes('brazil')) return 'BRL (R$)';
  if (code === 'AR' || name.includes('argentina')) return 'ARS ($)';
  if (code === 'CL' || name.includes('chile')) return 'CLP ($)';
  if (code === 'CO' || name.includes('colombia')) return 'COP ($)';
  if (code === 'PE' || name.includes('peru')) return 'PEN (S/)';

  // Middle East & Africa
  if (code === 'AE' || name.includes('emirates') || name.includes('dubai') || name.includes('abu dhabi')) return 'AED (د.إ)';
  if (code === 'SA' || name.includes('saudi')) return 'SAR (﷼)';
  if (code === 'QA' || name.includes('qatar')) return 'QAR (QR)';
  if (code === 'EG' || name.includes('egypt')) return 'EGP (E£)';
  if (code === 'ZA' || name.includes('south africa')) return 'ZAR (R)';
  if (code === 'MA' || name.includes('morocco')) return 'MAD (DH)';

  // South Asia Neighbors
  if (code === 'NP' || name.includes('nepal')) return 'NPR (Rs)';
  if (code === 'LK' || name.includes('sri lanka')) return 'LKR (Rs)';
  if (code === 'BT' || name.includes('bhutan')) return 'BTN (Nu)';
  if (code === 'BD' || name.includes('bangladesh')) return 'BDT (৳)';

  return 'USD ($)';
}

/**
 * Resolves weather forecast for a specific trip day, checking live Open-Meteo days first,
 * or dynamically projecting seasonal climate estimates if the date is beyond the 16-day live window.
 */
export function getWeatherForTripDay(
  weather: WeatherData | null,
  startDateStr: string,
  dayNumber: number,
  latitude: number = 25
): DailyForecast {
  // Compute target calendar date
  let targetIso = '';
  let targetDate = new Date();
  try {
    const start = new Date(startDateStr);
    targetDate = new Date(start);
    targetDate.setDate(start.getDate() + dayNumber - 1);
    targetIso = targetDate.toISOString().split('T')[0];
  } catch {
    targetIso = '';
  }

  // 1. Try to find matching date in live weather daily forecasts
  if (weather && Array.isArray(weather.daily) && weather.daily.length > 0) {
    if (targetIso) {
      const match = weather.daily.find(d => d.date === targetIso);
      if (match) return match;
    }
    // 2. Fall back to day index if within range
    if (weather.daily[dayNumber - 1]) {
      return weather.daily[dayNumber - 1];
    }
  }

  // 3. Beyond live forecast horizon or offline: generate intelligent seasonal climate estimate
  const month = targetDate.getMonth(); // 0 to 11
  const isNorthern = latitude >= 0;
  // Northern summer: Jun-Aug (5-7), Winter: Dec-Feb (11,0,1)
  const isSummer = isNorthern ? (month >= 5 && month <= 7) : (month >= 11 || month <= 1);
  const isWinter = isNorthern ? (month >= 11 || month <= 1) : (month >= 5 && month <= 7);

  const baseTemp = isWinter ? (Math.abs(latitude) > 35 ? 4 : 16) : isSummer ? (Math.abs(latitude) > 35 ? 26 : 31) : 22;
  const isRain = (dayNumber * 7 + month) % 5 === 0;

  const dayName = dayNumber === 1 ? 'Day 1' : targetDate.toLocaleDateString('en-US', { weekday: 'short' });

  return {
    date: targetIso || new Date().toISOString().split('T')[0],
    dayName,
    maxTemp: baseTemp + (dayNumber % 3),
    minTemp: Math.max(0, baseTemp - 7),
    weatherCode: isRain ? 61 : 1,
    weatherDescription: isRain ? 'Passing Showers (Seasonal Est.)' : 'Pleasant & Mild (Seasonal Est.)',
    weatherIcon: isRain ? 'cloud-rain' : 'sun',
    precipitationProb: isRain ? 45 : 10,
  };
}

// Special popular regional destinations
const REGIONAL_DESTINATIONS: City[] = [
  {
    id: 'reg-sikkim-in',
    name: 'Sikkim',
    country: 'India',
    countryCode: 'IN',
    latitude: 27.5330,
    longitude: 88.5122,
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80',
    description: 'A magical Himalayan wonderland of snow-capped peaks, alpine lakes, ancient monasteries, and vibrant rhododendron valleys.',
  },
  {
    id: 'reg-arunachal-in',
    name: 'Arunachal Pradesh',
    country: 'India',
    countryCode: 'IN',
    latitude: 28.2180,
    longitude: 94.7278,
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    image: 'https://images.unsplash.com/photo-1626014303757-6466336e8494?auto=format&fit=crop&w=1600&q=80',
    description: 'The Land of the Dawn-Lit Mountains, renowned for the majestic Tawang Monastery, pristine river valleys, and tribal culture.',
  },
  {
    id: 'reg-ladakh-in',
    name: 'Ladakh',
    country: 'India',
    countryCode: 'IN',
    latitude: 34.1526,
    longitude: 77.5771,
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1600&q=80',
    description: 'High-altitude desert known for breathtaking Pangong Tso lake, dramatic mountain passes, and historic Buddhist gompas.',
  },
  {
    id: 'reg-goa-in',
    name: 'Goa',
    country: 'India',
    countryCode: 'IN',
    latitude: 15.2993,
    longitude: 74.1240,
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80',
    description: 'Sun-drenched tropical coastline famed for golden sand beaches, Portuguese colonial architecture, and vibrant seafood shacks.',
  },
  {
    id: 'reg-kerala-in',
    name: 'Kerala',
    country: 'India',
    countryCode: 'IN',
    latitude: 10.8505,
    longitude: 76.2711,
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
    description: 'God’s Own Country, celebrated for serene palm-fringed backwaters, Munnar tea hills, and rich Ayurvedic traditions.',
  }
];

// Search places, cities, and regions worldwide using Open-Meteo and Photon (OSM)
export async function searchCities(query: string): Promise<City[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const results: City[] = [];
  const seenNames = new Set<string>();

  // 1. Check local regional & popular destinations first for instant match
  const allPresets = [...REGIONAL_DESTINATIONS, ...POPULAR_DESTINATIONS];
  for (const p of allPresets) {
    if (p.name.toLowerCase().includes(trimmed) || p.country.toLowerCase().includes(trimmed)) {
      results.push(p);
      seenNames.add(p.name.toLowerCase());
    }
  }

  // 2. Query Open-Meteo Geocoding (Great for cities worldwide)
  try {
    const meteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`;
    const res = await fetch(meteoUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results) {
        for (const item of data.results as GeocodingResult[]) {
          const key = item.name.toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            results.push({
              id: `geo-${item.id}-${key.replace(/\s+/g, '-')}`,
              name: item.name,
              country: item.country || item.admin1 || '',
              countryCode: item.country_code || '',
              latitude: item.latitude,
              longitude: item.longitude,
              timezone: item.timezone,
              population: item.population,
              currency: detectCurrency(item.country_code, item.country || item.admin1),
              image: `https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80`,
              description: `Explore the sights, culture, and vibrant experiences of ${item.name}.`,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Open-Meteo geocoding failed:', err);
  }

  // 3. Query Photon Geocoder (OSM) for regions, states, territories, districts & natural features
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=8`;
    const pRes = await fetch(photonUrl);
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData && pData.features) {
        for (const feat of pData.features) {
          const props = feat.properties;
          const coords = feat.geometry?.coordinates;
          if (!props?.name || !coords || coords.length < 2) continue;

          // Exclude street numbers or minor shops
          if (props.type === 'house' && props.housenumber) continue;

          const nameKey = props.name.toLowerCase();
          if (!seenNames.has(nameKey)) {
            seenNames.add(nameKey);
            const countryName = props.country || props.state || '';
            const countryCode = props.countrycode?.toUpperCase() || '';
            results.push({
              id: `osm-${props.osm_id || Math.random().toString(36).substr(2, 6)}-${nameKey.replace(/\s+/g, '-')}`,
              name: props.name,
              country: countryName,
              countryCode,
              latitude: coords[1],
              longitude: coords[0],
              currency: detectCurrency(countryCode, countryName),
              image: `https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80`,
              description: `Explore the culture, scenery, and famous attractions of ${props.name}${countryName ? `, ${countryName}` : ''}.`,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Photon geocoding failed:', err);
  }

  return results;
}

// Generate safe synthetic weather for offline or network-resilient operation
function generateFallbackWeatherData(latitude: number): WeatherData {
  const isNorthernWinter = new Date().getMonth() >= 11 || new Date().getMonth() <= 2;
  const isColdLat = Math.abs(latitude) > 45;
  const baseTemp = isColdLat && isNorthernWinter ? 5 : 22;

  const daily: DailyForecast[] = [];
  const today = new Date();

  for (let i = 0; i < 16; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const isRain = i % 4 === 0;

    daily.push({
      date: dateStr,
      dayName,
      maxTemp: baseTemp + (i % 3),
      minTemp: Math.max(0, baseTemp - 6),
      weatherCode: isRain ? 61 : 1,
      weatherDescription: isRain ? 'Passing Showers' : 'Partly Sunny & Mild',
      weatherIcon: isRain ? 'cloud-rain' : 'sun',
      precipitationProb: isRain ? 50 : 10,
    });
  }

  const hourly: HourlyForecast[] = [];
  const currentHour = new Date().getHours();
  for (let h = currentHour; h < currentHour + 12; h++) {
    const hour12 = ((h % 24) % 12 || 12) + (h % 24 >= 12 ? ' PM' : ' AM');
    hourly.push({
      time: hour12,
      temp: baseTemp,
      weatherCode: 1,
      precipitationProb: 15,
    });
  }

  return {
    temperature: baseTemp,
    apparentTemperature: baseTemp - 1,
    weatherCode: 1,
    weatherDescription: 'Pleasant & Clear',
    weatherIcon: 'sun',
    isDay: true,
    windSpeed: 12,
    humidity: 55,
    precipitation: 0,
    uvIndex: 5,
    daily,
    hourly,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

// Fetch live weather data using Open-Meteo Forecast API with up to 16 days coverage
export async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  if (isNaN(latitude) || isNaN(longitude)) {
    return generateFallbackWeatherData(25);
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=16`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status: ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const dailyRaw = data.daily;
    const hourlyRaw = data.hourly;

    const currentInterpretation = interpretWeatherCode(current?.weather_code ?? 1);

    const daily: DailyForecast[] = [];
    if (dailyRaw && dailyRaw.time) {
      for (let i = 0; i < dailyRaw.time.length; i++) {
        const dateStr = dailyRaw.time[i];
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const wCode = dailyRaw.weather_code?.[i] ?? 1;
        const inter = interpretWeatherCode(wCode);

        daily.push({
          date: dateStr,
          dayName,
          maxTemp: Math.round(dailyRaw.temperature_2m_max?.[i] ?? 22),
          minTemp: Math.round(dailyRaw.temperature_2m_min?.[i] ?? 14),
          weatherCode: wCode,
          weatherDescription: inter.label,
          weatherIcon: inter.icon,
          precipitationProb: dailyRaw.precipitation_probability_max?.[i] ?? 0,
        });
      }
    }

    const hourly: HourlyForecast[] = [];
    if (hourlyRaw && hourlyRaw.time) {
      const currentHourIndex = Math.max(0, new Date().getHours());
      for (let i = currentHourIndex; i < Math.min(hourlyRaw.time.length, currentHourIndex + 12); i++) {
        const timeStr = hourlyRaw.time[i];
        const hourDate = new Date(timeStr);
        const formattedHour = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

        hourly.push({
          time: formattedHour,
          temp: Math.round(hourlyRaw.temperature_2m?.[i] ?? 20),
          weatherCode: hourlyRaw.weather_code?.[i] ?? 1,
          precipitationProb: hourlyRaw.precipitation_probability?.[i] ?? 0,
        });
      }
    }

    return {
      temperature: Math.round(current?.temperature_2m ?? 22),
      apparentTemperature: Math.round(current?.apparent_temperature ?? 21),
      weatherCode: current?.weather_code ?? 1,
      weatherDescription: currentInterpretation.label,
      weatherIcon: currentInterpretation.icon,
      isDay: Boolean(current?.is_day ?? true),
      windSpeed: Math.round(current?.wind_speed_10m ?? 10),
      humidity: Math.round(current?.relative_humidity_2m ?? 60),
      precipitation: current?.precipitation ?? 0,
      uvIndex: dailyRaw?.uv_index_max?.[0] ? Math.round(dailyRaw.uv_index_max[0]) : 4,
      daily: daily.length > 0 ? daily : generateFallbackWeatherData(latitude).daily,
      hourly: hourly.length > 0 ? hourly : generateFallbackWeatherData(latitude).hourly,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err) {
    console.warn('Live weather request failed, using resilient forecast simulator:', err);
    return generateFallbackWeatherData(latitude);
  }
}
