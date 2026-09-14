import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { City, ItineraryItem, PackingItem, PlanningMode, ReadyMadeTourPlan, TravelerGroupProfile, TripPlan, WeatherData } from '../types/travel';
import { POPULAR_DESTINATIONS } from '../services/mockDestinations';
import { fetchWeatherData } from '../services/weatherApi';
import { evaluateSpotAccessibility } from '../services/geminiService';
import { getDefaultCurrencyRates } from '../utils/currency';
import confetti from 'canvas-confetti';

interface TripContextType {
  activeTrip: TripPlan;
  savedTrips: TripPlan[];
  hasUserTrip: boolean;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  weather: WeatherData | null;
  isLoadingWeather: boolean;
  weatherError: string | null;
  isSearchMode: boolean;
  setIsSearchMode: (val: boolean) => void;
  isConfirmedModalOpen: boolean;
  setIsConfirmedModalOpen: (open: boolean) => void;
  startPlanningForCity: (
    city: City,
    startDate: string,
    daysCount: number,
    origin?: string,
    planningMode?: PlanningMode,
    groupProfile?: TravelerGroupProfile,
    customItems?: ItineraryItem[],
    budget?: number
  ) => void;
  confirmTripPlan: () => void;
  unconfirmTripPlan: () => void;
  applyReadyMadeTourPlan: (plan: ReadyMadeTourPlan) => void;
  addActivity: (activity: Omit<ItineraryItem, 'id' | 'completed'>) => void;
  updateActivity: (activity: ItineraryItem) => void;
  updateAllActivities: (items: ItineraryItem[]) => void;
  deleteActivity: (activityId: string) => void;
  toggleActivityComplete: (activityId: string) => void;
  updateTripDates: (startDate: string, endDate: string) => void;
  addDayToTrip: () => void;
  removeDayFromTrip: (dayNumber: number) => void;
  refreshWeather: () => Promise<void>;
  totalTripEstimatedCost: number;
  dayEstimatedCost: number;
  // Backward compatibility
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  createNewTrip: (city: City, days?: number, title?: string) => void;
  switchTrip: (tripId: string) => void;
  deleteTrip: (tripId: string) => void;
  updateTripBudget: (budget: number) => void;
  togglePackingItem: (id: string) => void;
  addPackingItem: (name: string, category: PackingItem['category']) => void;
  deletePackingItem: (id: string) => void;
  exportTripData: () => void;
}

const STORAGE_KEY_TRIPS = 'voyagecraft_saved_trips_v3';
const STORAGE_KEY_ACTIVE_ID = 'voyagecraft_active_trip_id_v3';
const STORAGE_KEY_SEARCH_MODE = 'voyagecraft_is_search_mode_v3';

function createDefaultTripForCity(
  city: City,
  days: number = 3,
  startDate?: string,
  origin: string = 'Kolkata',
  planningMode: PlanningMode = 'manual',
  groupProfile?: TravelerGroupProfile,
  customItems?: ItineraryItem[],
  customBudget?: number
): TripPlan {
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const defaultProfile: TravelerGroupProfile = groupProfile || {
    numberOfHeads: 2,
    ageGroup: 'Couple (2 Adults)',
    travelStyle: 'Sightseeing & Culture',
    members: [
      { id: 'adult-1', type: 'adult', age: 32, label: 'Adult 1' },
      { id: 'adult-2', type: 'adult', age: 30, label: 'Adult 2' },
    ],
  };

  const curr = city.currency || 'INR (₹)';
  const defaultBudget = customBudget || getDefaultCurrencyRates(curr).defaultBudget;

  // If custom items are passed (from AI generator), use them
  if (customItems && customItems.length > 0) {
    return {
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: `${origin ? `${origin} ➔ ` : ''}${city.name} (${days} Days)`,
      cityName: city.name,
      country: city.country,
      city,
      origin,
      startDate: startStr,
      endDate: endStr,
      daysCount: days,
      budget: defaultBudget,
      currency: curr,
      planningMode,
      groupProfile: defaultProfile,
      isConfirmed: false,
      items: customItems,
      packingList: [],
      createdAt: new Date().toISOString(),
    };
  }

  // Manual personal starter items (Arrival, check-in, orientation)
  const isDarjeeling = city.name.toLowerCase().includes('darjeeling');
  const isINR = curr.includes('INR') || curr.includes('₹');
  const starterItems: ItineraryItem[] = [
    {
      id: `init-1-${Date.now()}`,
      dayIndex: 1,
      time: '11:00',
      title: `Arrive from ${origin} & Check-in at Hotel`,
      location: `${city.name} Central Hotel`,
      category: 'lodging',
      cost: 0,
      notes: `Arrive in ${city.name}, check into your rooms, unpack and freshen up after the journey from ${origin}.`,
      completed: false,
      openingHours: '24/7 Check-in',
      bestTimeToVisit: '11:00 - 13:00',
      transitInfo: `🚗 Transit from airport/station to hotel (~1.5 - 2.5 hrs mountain drive)`,
      accessibilityStatus: 'open',
      accessibilityNote: '🟢 Hotel reception open 24/7.',
      isMustVisit: false,
    },
    {
      id: `init-2-${Date.now()}`,
      dayIndex: 1,
      time: '13:30',
      title: `Welcome Lunch & First Regional Tea`,
      location: `Town Center Bistro`,
      category: 'food',
      cost: isINR ? 350 : 20,
      notes: `Savor warm regional cuisine and take in mountain valley views.`,
      completed: false,
      openingHours: '12:00 - 15:30',
      bestTimeToVisit: '13:00 - 14:30',
      transitInfo: '🚶 5 mins walk from hotel',
      accessibilityStatus: 'open',
      accessibilityNote: '🟢 Step-free dining room.',
      isMustVisit: false,
    },
    {
      id: `init-3-${Date.now()}`,
      dayIndex: 1,
      time: '16:30',
      title: isDarjeeling ? `Evening Stroll on Mall Road (Chowrasta) & Glenary's` : `Evening Stroll around ${city.name} Promenade`,
      location: isDarjeeling ? 'Chowrasta Mall Road' : `${city.name} Central Quarter`,
      category: 'relaxation',
      cost: isINR ? 200 : 15,
      notes: isDarjeeling
        ? 'Relax on vehicle-free Mall Road, grab warm pastries at Glenary’s and enjoy the valley sunset.'
        : `Acclimatize with a peaceful walk around ${city.name}'s iconic promenade.`,
      completed: false,
      openingHours: '24/7 (Shops 10:00 - 20:30)',
      bestTimeToVisit: 'Golden Hour (16:30 - 18:30)',
      transitInfo: '🚶 Pedestrian zone (Step-free walkways)',
      accessibilityStatus: 'open',
      accessibilityNote: '🟢 Open public promenade.',
      isMustVisit: true,
    },
  ];

  return {
    id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: `${origin} ➔ ${city.name} (${days} Days)`,
    cityName: city.name,
    country: city.country,
    city,
    origin,
    startDate: startStr,
    endDate: endStr,
    daysCount: days,
    budget: defaultBudget,
    currency: curr,
    planningMode,
    groupProfile: defaultProfile,
    isConfirmed: false,
    items: starterItems,
    packingList: [],
    createdAt: new Date().toISOString(),
  };
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSearchMode, setIsSearchMode] = useState<boolean>(() => {
    try {
      // In a new session or initial visit, always open to the Home Screen to select trip info
      const sessionActive = sessionStorage.getItem('routewise_session_active');
      if (!sessionActive) {
        sessionStorage.setItem('routewise_session_active', 'true');
        return true;
      }
      const stored = localStorage.getItem(STORAGE_KEY_SEARCH_MODE);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const [savedTrips, setSavedTrips] = useState<TripPlan[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TRIPS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage trips:', e);
    }
    const defaultCity = POPULAR_DESTINATIONS[0]; // Tokyo
    const initTrip = createDefaultTripForCity(defaultCity, 3);
    initTrip.id = 'trip-default-init';
    return [initTrip];
  });

  const hasUserTrip = savedTrips.some(t => t.id !== 'trip-default-init');

  const [activeTripId, setActiveTripId] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (storedId && savedTrips.some(t => t.id === storedId)) return storedId;
    } catch (e) {
      console.error(e);
    }
    return savedTrips[0]?.id || '';
  });

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const activeTrip = savedTrips.find(t => t.id === activeTripId) || savedTrips[0];

  // Save persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(savedTrips));
      if (activeTrip) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeTrip.id);
      }
      localStorage.setItem(STORAGE_KEY_SEARCH_MODE, JSON.stringify(isSearchMode));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }, [savedTrips, activeTrip, isSearchMode]);

  // Load weather whenever active city changes
  const loadWeatherForCity = useCallback(async (city: City) => {
    if (!city || !city.latitude || !city.longitude) return;
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await fetchWeatherData(city.latitude, city.longitude);
      setWeather(data);
    } catch (err: unknown) {
      console.error('Failed to load weather:', err);
      setWeatherError(err instanceof Error ? err.message : 'Weather service temporarily unavailable');
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  useEffect(() => {
    if (activeTrip?.city) {
      loadWeatherForCity(activeTrip.city);
    }
  }, [activeTrip?.city?.latitude, activeTrip?.city?.longitude, loadWeatherForCity]);

  const [isConfirmedModalOpen, setIsConfirmedModalOpen] = useState<boolean>(false);

  // User starts planning for a selected destination
  const startPlanningForCity = (
    city: City,
    startDate: string,
    daysCount: number,
    origin: string = 'Kolkata',
    planningMode: PlanningMode = 'manual',
    groupProfile?: TravelerGroupProfile,
    customItems?: ItineraryItem[],
    budget?: number
  ) => {
    const newTrip = createDefaultTripForCity(
      city,
      daysCount,
      startDate,
      origin,
      planningMode,
      groupProfile,
      customItems,
      budget
    );
    setSavedTrips(prev => [newTrip, ...prev]);
    setActiveTripId(newTrip.id);
    setSelectedDay(1);
    setIsSearchMode(false);
    setIsConfirmedModalOpen(false);

    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.5 }
      });
    } catch {
      // ignore
    }
  };

  const confirmTripPlan = () => {
    setSavedTrips(prev => prev.map(t => t.id === activeTrip.id ? { ...t, isConfirmed: true } : t));
    setIsConfirmedModalOpen(true);
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.4 }
      });
    } catch {
      // ignore
    }
  };

  const unconfirmTripPlan = () => {
    setSavedTrips(prev => prev.map(t => t.id === activeTrip.id ? { ...t, isConfirmed: false } : t));
    setIsConfirmedModalOpen(false);
  };

  // One-click apply of ready-made tour plan
  const applyReadyMadeTourPlan = (plan: ReadyMadeTourPlan) => {
    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        return {
          ...t,
          daysCount: plan.durationDays,
          items: plan.items,
        };
      }
      return t;
    }));
    setSelectedDay(1);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch {
      // ignore
    }
  };

  // Add activity with automatic spot accessibility evaluation
  const addActivity = (activityData: Omit<ItineraryItem, 'id' | 'completed'>) => {
    const dayWeather = weather?.daily?.[activityData.dayIndex - 1];
    const rainProb = dayWeather?.precipitationProb || 0;

    let { accessibilityStatus, accessibilityNote } = activityData;
    if (!accessibilityStatus || !accessibilityNote) {
      const evalResult = evaluateSpotAccessibility(
        activityData.title,
        activityData.time,
        activityData.openingHours || '09:00 - 18:00',
        rainProb
      );
      accessibilityStatus = evalResult.status;
      accessibilityNote = evalResult.note;
    }

    const newActivity: ItineraryItem = {
      ...activityData,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      completed: false,
      accessibilityStatus,
      accessibilityNote,
    };

    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        return {
          ...t,
          items: [...t.items, newActivity],
        };
      }
      return t;
    }));
  };

  // Update activity with accessibility re-evaluation if time/opening hours change
  const updateActivity = (updated: ItineraryItem) => {
    const dayWeather = weather?.daily?.[updated.dayIndex - 1];
    const rainProb = dayWeather?.precipitationProb || 0;
    const evalResult = evaluateSpotAccessibility(
      updated.title,
      updated.time,
      updated.openingHours || '09:00 - 18:00',
      rainProb
    );

    const checkedItem: ItineraryItem = {
      ...updated,
      accessibilityStatus: evalResult.status,
      accessibilityNote: evalResult.note,
    };

    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        return {
          ...t,
          items: t.items.map(item => item.id === updated.id ? checkedItem : item),
        };
      }
      return t;
    }));
  };

  const updateAllActivities = (newItems: ItineraryItem[]) => {
    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        return {
          ...t,
          items: newItems,
        };
      }
      return t;
    }));
  };

  const deleteActivity = (activityId: string) => {
    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        return {
          ...t,
          items: t.items.filter(item => item.id !== activityId),
        };
      }
      return t;
    }));
  };

  const toggleActivityComplete = (activityId: string) => {
    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        return {
          ...t,
          items: t.items.map(item =>
            item.id === activityId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return t;
    }));
  };

  const updateTripDates = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    setSavedTrips(prev => prev.map(t =>
      t.id === activeTrip.id ? { ...t, startDate, endDate, daysCount } : t
    ));
  };

  const addDayToTrip = () => {
    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        const newDaysCount = t.daysCount + 1;
        const start = new Date(t.startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + newDaysCount - 1);
        return {
          ...t,
          daysCount: newDaysCount,
          endDate: end.toISOString().split('T')[0],
        };
      }
      return t;
    }));
    setSelectedDay(activeTrip.daysCount + 1);
  };

  const removeDayFromTrip = (dayNumber: number) => {
    if (activeTrip.daysCount <= 1) {
      alert('Trip must have at least 1 day.');
      return;
    }
    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        const newDaysCount = t.daysCount - 1;
        const filteredItems = t.items
          .filter(item => item.dayIndex !== dayNumber)
          .map(item => item.dayIndex > dayNumber ? { ...item, dayIndex: item.dayIndex - 1 } : item);
        return {
          ...t,
          daysCount: newDaysCount,
          items: filteredItems,
        };
      }
      return t;
    }));
    setSelectedDay(prev => Math.min(prev, activeTrip.daysCount - 1));
  };

  const refreshWeather = async () => {
    if (activeTrip?.city) {
      await loadWeatherForCity(activeTrip.city);
    }
  };

  // Estimated costs calculation
  const totalTripEstimatedCost = (activeTrip?.items || []).reduce(
    (sum, item) => sum + (Number(item.cost) || 0),
    0
  );

  const dayEstimatedCost = (activeTrip?.items || [])
    .filter(item => item.dayIndex === selectedDay)
    .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const createNewTrip = (city: City, days: number = 4, title?: string) => {
    startPlanningForCity(city, new Date().toISOString().split('T')[0], days);
    if (title && activeTrip) {
      activeTrip.title = title;
    }
  };

  const switchTrip = (tripId: string) => {
    setActiveTripId(tripId);
    setSelectedDay(1);
  };

  const deleteTrip = (tripId: string) => {
    if (savedTrips.length > 1) {
      setSavedTrips(prev => prev.filter(t => t.id !== tripId));
    }
  };

  const updateTripBudget = (budget: number) => {
    setSavedTrips(prev => prev.map(t => t.id === activeTrip.id ? { ...t, budget } : t));
  };

  const togglePackingItem = (id: string) => {
    setSavedTrips(prev => prev.map(t => {
      if (t.id === activeTrip.id) {
        return {
          ...t,
          packingList: t.packingList.map(p => p.id === id ? { ...p, packed: !p.packed } : p)
        };
      }
      return t;
    }));
  };

  const addPackingItem = (name: string, category: PackingItem['category']) => {
    const newItem: PackingItem = { id: `p-${Date.now()}`, name, category, packed: false };
    setSavedTrips(prev => prev.map(t => t.id === activeTrip.id ? { ...t, packingList: [...t.packingList, newItem] } : t));
  };

  const deletePackingItem = (id: string) => {
    setSavedTrips(prev => prev.map(t => t.id === activeTrip.id ? { ...t, packingList: t.packingList.filter(p => p.id !== id) } : t));
  };

  const exportTripData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeTrip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeTrip.cityName.toLowerCase()}_itinerary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <TripContext.Provider
      value={{
        activeTrip: activeTrip || createDefaultTripForCity(POPULAR_DESTINATIONS[0]),
        savedTrips,
        hasUserTrip,
        selectedDay,
        setSelectedDay,
        weather,
        isLoadingWeather,
        weatherError,
        isSearchMode,
        setIsSearchMode,
        isConfirmedModalOpen,
        setIsConfirmedModalOpen,
        startPlanningForCity,
        confirmTripPlan,
        unconfirmTripPlan,
        applyReadyMadeTourPlan,
        addActivity,
        updateActivity,
        updateAllActivities,
        deleteActivity,
        toggleActivityComplete,
        updateTripDates,
        addDayToTrip,
        removeDayFromTrip,
        refreshWeather,
        totalTripEstimatedCost,
        dayEstimatedCost,
        isSidebarOpen,
        setIsSidebarOpen,
        createNewTrip,
        switchTrip,
        deleteTrip,
        updateTripBudget,
        togglePackingItem,
        addPackingItem,
        deletePackingItem,
        exportTripData,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
