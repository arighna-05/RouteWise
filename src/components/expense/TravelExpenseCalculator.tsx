import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Hotel, 
  Ticket, 
  Plane, 
  Train, 
  Car, 
  Utensils, 
  ShoppingBag, 
  Users, 
  Check, 
  TrendingDown,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { useViewMode } from '../../context/ViewModeContext';
import { getCurrencySymbol, getDefaultCurrencyRates } from '../../utils/currency';

export const TravelExpenseCalculator: React.FC = () => {
  const { activeTrip, updateTripBudget } = useTrip();
  const { isMobileView } = useViewMode();

  const rates = useMemo(() => getDefaultCurrencyRates(activeTrip.currency), [activeTrip.currency]);
  const currencySymbol = useMemo(() => getCurrencySymbol(activeTrip.currency), [activeTrip.currency]);

  const headsCount = activeTrip.groupProfile?.numberOfHeads || 2;
  const daysCount = activeTrip.daysCount || 3;
  const defaultNights = Math.max(1, daysCount - 1);
  const defaultRooms = Math.max(1, Math.ceil(headsCount / 2));

  // 1. Hotel / Lodging State
  const [hotelCostPerNight, setHotelCostPerNight] = useState<number>(() => rates.hotelPerNight);
  const [hotelRooms, setHotelRooms] = useState<number>(defaultRooms);
  const [hotelNights, setHotelNights] = useState<number>(defaultNights);

  // 2. Scheduled Sightseeing / Places Cost (Auto-calculated from itinerary)
  const itineraryActivitiesCost = useMemo(() => {
    return activeTrip.items.reduce((sum, item) => sum + (item.cost || 0), 0);
  }, [activeTrip.items]);

  const [extraSightseeingBuffer, setExtraSightseeingBuffer] = useState<number>(0);

  // 3. Train / Plane / Long-Distance Transit
  const [transitMode, setTransitMode] = useState<'plane' | 'train' | 'cab'>('train');
  const [transitCostPerPerson, setTransitCostPerPerson] = useState<number>(() => rates.transitPerPerson);

  // 4. Food & Dining
  const [foodCostPerPersonDay, setFoodCostPerPersonDay] = useState<number>(() => rates.foodPerPersonDay);

  // 5. Miscellaneous & Local Expenses
  const [miscellaneousCost, setMiscellaneousCost] = useState<number>(() => rates.miscBudget);

  // Keep state updated if trip currency or rates change
  React.useEffect(() => {
    setHotelCostPerNight(rates.hotelPerNight);
    setTransitCostPerPerson(rates.transitPerPerson);
    setFoodCostPerPersonDay(rates.foodPerPersonDay);
    setMiscellaneousCost(rates.miscBudget);
  }, [rates]);

  // Success message after sync
  const [isSynced, setIsSynced] = useState<boolean>(false);

  // Accordion expansion state for mobile (starts with Hotel open, rest cleanly collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    hotel: true,
    sightseeing: false,
    transit: false,
    food: false,
    misc: false,
  });

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const areAllExpanded = Object.values(expandedCategories).every(Boolean);
  const toggleAll = () => {
    const nextState = !areAllExpanded;
    setExpandedCategories({
      hotel: nextState,
      sightseeing: nextState,
      transit: nextState,
      food: nextState,
      misc: nextState,
    });
  };

  // Calculations
  const totalHotelExpense = hotelCostPerNight * hotelRooms * hotelNights;
  const totalSightseeingExpense = itineraryActivitiesCost + extraSightseeingBuffer;
  const totalTransitExpense = transitCostPerPerson * headsCount;
  const totalFoodExpense = foodCostPerPersonDay * daysCount * headsCount;
  const totalMiscellaneousExpense = miscellaneousCost;

  const totalCalculatedExpense = 
    totalHotelExpense + 
    totalSightseeingExpense + 
    totalTransitExpense + 
    totalFoodExpense + 
    totalMiscellaneousExpense;

  const costPerHead = Math.round(totalCalculatedExpense / Math.max(1, headsCount));
  const budgetDifference = (activeTrip.budget || 0) - totalCalculatedExpense;
  const isUnderBudget = budgetDifference >= 0;

  const handleSyncToTripBudget = () => {
    updateTripBudget(totalCalculatedExpense);
    setIsSynced(true);
    setTimeout(() => setIsSynced(false), 2500);
  };

  const calcPercentage = (amount: number) => {
    if (totalCalculatedExpense <= 0) return 0;
    return Math.round((amount / totalCalculatedExpense) * 100);
  };

  // =========================================================================
  // MOBILE VIEW: Sleek, Touch-Friendly, Accordion-Based Uncluttered UX
  // =========================================================================
  // MOBILE VIEW: Sleek, Touch-Friendly, Accordion-Based Matte Modern UX
  // =========================================================================
  if (isMobileView) {
    return (
      <section className="p-4 sm:p-5 rounded-[28px] matte-card border border-[#E8ECF5] shadow-sm space-y-4 text-left animate-in fade-in duration-300 text-[#1A1D2E]">
        
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#EEF0FF] text-[#5D5FEF] shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-[#1A1D2E] leading-tight">
              Travel Expense Calculator
            </h3>
            <p className="text-[11px] text-[#7E859B] truncate">
              {headsCount} traveler(s) • {daysCount} days in {activeTrip.cityName}
            </p>
          </div>
        </div>

        {/* Hero Summary & Budget Card */}
        <div className="bg-[#F8F9FD] p-4 rounded-2xl border border-[#E2E6F0] space-y-3">
          {/* Row 1: Total & Per Person */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#7E859B] tracking-wider block">
                Total Trip Expense
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-[#5D5FEF] block">
                {currencySymbol} {totalCalculatedExpense.toLocaleString()}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#7E859B] tracking-wider block">
                Cost Per Person
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-[#1A1D2E] block">
                {currencySymbol} {costPerHead.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Row 2: Budget Status Comparison */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E6F0] text-xs">
            <div className="text-[#1A1D2E] text-[11px] sm:text-xs">
              Budget: <strong className="font-mono">{currencySymbol} {(activeTrip.budget || 0).toLocaleString()}</strong>
            </div>
            <div className={`flex items-center gap-1 font-bold text-[11px] sm:text-xs ${isUnderBudget ? 'text-[#00BA88]' : 'text-[#EF4444]'}`}>
              {isUnderBudget ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              <span>
                {isUnderBudget 
                  ? `Under by ${currencySymbol}${Math.abs(budgetDifference).toLocaleString()}` 
                  : `Over by ${currencySymbol}${Math.abs(budgetDifference).toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Row 3: 1-Tap Budget Sync Action */}
          <button
            type="button"
            onClick={handleSyncToTripBudget}
            className="w-full py-2.5 px-4 rounded-xl bg-[#5D5FEF] hover:bg-[#4D4FD9] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            {isSynced ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved to Trip Budget!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Update Trip Budget to {currencySymbol}{totalCalculatedExpense.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>

        {/* Category Breakdown Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1D2E]">
            <Layers className="w-3.5 h-3.5 text-[#5D5FEF]" />
            <span>Expense Categories</span>
          </div>
          <button
            type="button"
            onClick={toggleAll}
            className="text-[11px] text-[#5D5FEF] hover:underline font-semibold"
          >
            {areAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Accordion / Expandable Category Cards */}
        <div className="space-y-2">

          {/* 1. Hotel & Lodging */}
          <div className="rounded-2xl bg-white border border-[#E8ECF5] overflow-hidden transition-all shadow-xs">
            <button
              type="button"
              onClick={() => toggleCategory('hotel')}
              className="w-full p-3 flex items-center justify-between hover:bg-[#F8F9FD] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#FFF4E5] text-[#F59E0B]">
                  <Hotel className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1A1D2E] block">Hotel & Lodging</span>
                  <span className="text-[10px] text-[#7E859B]">{hotelRooms} room(s) • {hotelNights} night(s)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#F59E0B]">
                  {currencySymbol} {totalHotelExpense.toLocaleString()}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${expandedCategories.hotel ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedCategories.hotel && (
              <div className="p-3 pt-1 space-y-2.5 border-t border-[#F0F2F8] bg-[#FAFBFE] text-xs">
                <div>
                  <label className="text-[10px] text-[#7E859B] uppercase font-semibold block mb-1">
                    Cost per Night ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hotelCostPerNight}
                    onChange={(e) => setHotelCostPerNight(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-xl matte-input font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#7E859B] uppercase font-semibold block mb-1">Nights</label>
                    <input
                      type="number"
                      min="1"
                      value={hotelNights}
                      onChange={(e) => setHotelNights(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 rounded-xl matte-input font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#7E859B] uppercase font-semibold block mb-1">Rooms</label>
                    <input
                      type="number"
                      min="1"
                      value={hotelRooms}
                      onChange={(e) => setHotelRooms(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 rounded-xl matte-input font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Visiting Places & Sightseeing */}
          <div className="rounded-2xl bg-white border border-[#E8ECF5] overflow-hidden transition-all shadow-xs">
            <button
              type="button"
              onClick={() => toggleCategory('sightseeing')}
              className="w-full p-3 flex items-center justify-between hover:bg-[#F8F9FD] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#EEF4FF] text-[#3B82F6]">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1A1D2E] block">Visiting Places</span>
                  <span className="text-[10px] text-[#7E859B]">Itinerary spots & buffer</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#3B82F6]">
                  {currencySymbol} {totalSightseeingExpense.toLocaleString()}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${expandedCategories.sightseeing ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedCategories.sightseeing && (
              <div className="p-3 pt-1 space-y-2.5 border-t border-[#F0F2F8] bg-[#FAFBFE] text-xs">
                <div className="p-2 rounded-lg bg-white border border-[#E2E6F0] flex items-center justify-between text-xs">
                  <span className="text-[#7E859B]">From Itinerary Items:</span>
                  <span className="font-mono font-bold text-[#1A1D2E]">
                    {currencySymbol} {itineraryActivitiesCost.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-[#7E859B] uppercase font-semibold block mb-1">
                    Extra Sightseeing / Entry Buffer ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={extraSightseeingBuffer}
                    onChange={(e) => setExtraSightseeingBuffer(Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-1.5 rounded-xl matte-input font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Train / Plane / Transit Cost */}
          <div className="rounded-2xl bg-white border border-[#E8ECF5] overflow-hidden transition-all shadow-xs">
            <button
              type="button"
              onClick={() => toggleCategory('transit')}
              className="w-full p-3 flex items-center justify-between hover:bg-[#F8F9FD] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#F3E8FF] text-[#8B5CF6]">
                  {transitMode === 'plane' ? <Plane className="w-4 h-4" /> : transitMode === 'train' ? <Train className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1A1D2E] block">Train / Plane Transit</span>
                  <span className="text-[10px] text-[#7E859B] capitalize">{transitMode} transit</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#8B5CF6]">
                  {currencySymbol} {totalTransitExpense.toLocaleString()}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${expandedCategories.transit ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedCategories.transit && (
              <div className="p-3 pt-1 space-y-2.5 border-t border-[#F0F2F8] bg-[#FAFBFE] text-xs">
                <div className="flex items-center gap-1.5">
                  {(['train', 'plane', 'cab'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTransitMode(mode)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border ${
                        transitMode === mode
                          ? 'bg-[#5D5FEF] text-white border-[#5D5FEF] font-bold'
                          : 'bg-white text-[#64748B] border-[#E2E6F0] hover:bg-[#F4F6FB]'
                      }`}
                    >
                      {mode === 'plane' ? '✈️ Plane' : mode === 'train' ? '🚆 Train' : '🚗 Cab'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] text-[#7E859B] uppercase font-semibold block mb-1">
                    Cost per Person Round Trip ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={transitCostPerPerson}
                    onChange={(e) => setTransitCostPerPerson(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-xl matte-input font-mono text-xs"
                  />
                  <div className="text-[10px] text-[#7E859B] mt-1">
                    Total for {headsCount} traveler(s): {currencySymbol} {totalTransitExpense.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Food & Dining */}
          <div className="rounded-2xl bg-white border border-[#E8ECF5] overflow-hidden transition-all shadow-xs">
            <button
              type="button"
              onClick={() => toggleCategory('food')}
              className="w-full p-3 flex items-center justify-between hover:bg-[#F8F9FD] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#FFF0F3] text-[#FF4B72]">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1A1D2E] block">Food & Dining</span>
                  <span className="text-[10px] text-[#7E859B]">{currencySymbol}{foodCostPerPersonDay} / person / day</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#FF4B72]">
                  {currencySymbol} {totalFoodExpense.toLocaleString()}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${expandedCategories.food ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedCategories.food && (
              <div className="p-3 pt-1 space-y-2.5 border-t border-[#F0F2F8] bg-[#FAFBFE] text-xs">
                <div>
                  <label className="text-[10px] text-[#7E859B] uppercase font-semibold block mb-1">
                    Cost per Person per Day ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={foodCostPerPersonDay}
                    onChange={(e) => setFoodCostPerPersonDay(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-xl matte-input font-mono text-xs"
                  />
                </div>
                <div className="text-[10px] text-[#7E859B]">
                  {headsCount} heads × {daysCount} days × {currencySymbol}{foodCostPerPersonDay}
                </div>
              </div>
            )}
          </div>

          {/* 5. Miscellaneous & Shopping */}
          <div className="rounded-2xl bg-white border border-[#E8ECF5] overflow-hidden transition-all shadow-xs">
            <button
              type="button"
              onClick={() => toggleCategory('misc')}
              className="w-full p-3 flex items-center justify-between hover:bg-[#F8F9FD] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#00BA88]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1A1D2E] block">Miscellaneous & Shopping</span>
                  <span className="text-[10px] text-[#7E859B]">Souvenirs & buffer</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#00BA88]">
                  {currencySymbol} {totalMiscellaneousExpense.toLocaleString()}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${expandedCategories.misc ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedCategories.misc && (
              <div className="p-3 pt-1 space-y-2.5 border-t border-[#F0F2F8] bg-[#FAFBFE] text-xs">
                <div>
                  <label className="text-[10px] text-[#7E859B] uppercase font-semibold block mb-1">
                    Shopping & Emergency Buffer ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={miscellaneousCost}
                    onChange={(e) => setMiscellaneousCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-xl matte-input font-mono text-xs"
                  />
                </div>
                <div className="text-[10px] text-[#7E859B]">
                  Covers souvenirs, local taxis, tea stops & emergency buffer
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Percentage Distribution Bar */}
        <div className="pt-2 border-t border-[#F0F2F8] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-[#7E859B]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            Hotel {calcPercentage(totalHotelExpense)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            Places {calcPercentage(totalSightseeingExpense)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
            Transit {calcPercentage(totalTransitExpense)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B72]" />
            Food {calcPercentage(totalFoodExpense)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00BA88]" />
            Misc {calcPercentage(totalMiscellaneousExpense)}%
          </span>
        </div>

      </section>
    );
  }

  // =========================================================================
  // DESKTOP VIEW: Original Multi-Column Rich Layout
  // =========================================================================
  return (
    <section className="p-6 sm:p-8 rounded-3xl glass-card border border-[#3B4252] shadow-2xl space-y-6 animate-in fade-in duration-300 text-left">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2E3440]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#88C0D0]/15 text-[#88C0D0]">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#ECEFF4] flex items-center gap-2">
              <span>Travel Expense Calculator</span>
            </h3>
            <p className="text-xs text-[#D8DEE9] mt-0.5">
              Estimate and break down total trip expenditure for {headsCount} traveler(s) across {daysCount} days.
            </p>
          </div>
        </div>

        {/* Live Total Pill */}
        <div className="flex items-center gap-3 bg-[#1A1E24] px-4 py-2.5 rounded-2xl border border-[#3B4252]">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-[#81A1C1] tracking-wider">
              Total Estimated Expense
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-[#88C0D0]">
              {currencySymbol} {totalCalculatedExpense.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Input Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. Hotel / Accommodation */}
        <div className="p-4 rounded-2xl bg-[#1A1E24]/70 border border-[#2E3440] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ECEFF4]">
              <Hotel className="w-4 h-4 text-[#EBCB8B]" />
              <span>Hotel & Lodging</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#EBCB8B]">
              {currencySymbol} {totalHotelExpense.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-[#D8DEE9] uppercase font-semibold">
                Cost per Night ({currencySymbol})
              </label>
              <input
                type="number"
                value={hotelCostPerNight}
                onChange={(e) => setHotelCostPerNight(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] font-mono text-xs focus:ring-1 focus:ring-[#88C0D0]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#D8DEE9] uppercase font-semibold">Nights</label>
                <input
                  type="number"
                  value={hotelNights}
                  onChange={(e) => setHotelNights(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#D8DEE9] uppercase font-semibold">Rooms</label>
                <input
                  type="number"
                  value={hotelRooms}
                  onChange={(e) => setHotelRooms(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Visiting Places & Sightseeing */}
        <div className="p-4 rounded-2xl bg-[#1A1E24]/70 border border-[#2E3440] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ECEFF4]">
              <Ticket className="w-4 h-4 text-[#88C0D0]" />
              <span>Visiting Places</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#88C0D0]">
              {currencySymbol} {totalSightseeingExpense.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#242933] border border-[#2E3440]">
              <div className="flex items-center justify-between text-[11px] text-[#D8DEE9]">
                <span>Scheduled Spots Sum:</span>
                <span className="font-mono font-bold text-[#ECEFF4]">
                  {currencySymbol} {itineraryActivitiesCost.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-[#81A1C1] mt-0.5">
                Automatically calculated from your itinerary items
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#D8DEE9] uppercase font-semibold">
                Extra Sightseeing / Permits Buffer ({currencySymbol})
              </label>
              <input
                type="number"
                value={extraSightseeingBuffer}
                onChange={(e) => setExtraSightseeingBuffer(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 500"
                className="w-full px-3 py-1.5 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] font-mono text-xs focus:ring-1 focus:ring-[#88C0D0]"
              />
            </div>
          </div>
        </div>

        {/* 3. Train / Plane / Transit Cost */}
        <div className="p-4 rounded-2xl bg-[#1A1E24]/70 border border-[#2E3440] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ECEFF4]">
              {transitMode === 'plane' ? (
                <Plane className="w-4 h-4 text-[#81A1C1]" />
              ) : transitMode === 'train' ? (
                <Train className="w-4 h-4 text-[#81A1C1]" />
              ) : (
                <Car className="w-4 h-4 text-[#81A1C1]" />
              )}
              <span>Train / Plane Transit</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#81A1C1]">
              {currencySymbol} {totalTransitExpense.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Mode selection buttons */}
            <div className="flex items-center gap-1.5">
              {(['train', 'plane', 'cab'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTransitMode(mode)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                    transitMode === mode
                      ? 'bg-[#81A1C1] text-[#1A1E24] font-bold'
                      : 'bg-[#242933] text-[#D8DEE9] hover:bg-[#2E3440]'
                  }`}
                >
                  {mode === 'plane' ? '✈️ Plane' : mode === 'train' ? '🚆 Train' : '🚗 Cab'}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] text-[#D8DEE9] uppercase font-semibold">
                Cost per Person Round Trip ({currencySymbol})
              </label>
              <input
                type="number"
                value={transitCostPerPerson}
                onChange={(e) => setTransitCostPerPerson(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] font-mono text-xs focus:ring-1 focus:ring-[#81A1C1]"
              />
              <div className="text-[10px] text-[#D8DEE9]/70 mt-1">
                Total for {headsCount} traveler(s): {currencySymbol} {totalTransitExpense.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Food & Dining */}
        <div className="p-4 rounded-2xl bg-[#1A1E24]/70 border border-[#2E3440] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ECEFF4]">
              <Utensils className="w-4 h-4 text-[#A3BE8C]" />
              <span>Food & Dining</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#A3BE8C]">
              {currencySymbol} {totalFoodExpense.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-[#D8DEE9] uppercase font-semibold">
                Cost per Person per Day ({currencySymbol})
              </label>
              <input
                type="number"
                value={foodCostPerPersonDay}
                onChange={(e) => setFoodCostPerPersonDay(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] font-mono text-xs focus:ring-1 focus:ring-[#A3BE8C]"
              />
            </div>
            <div className="text-[10px] text-[#D8DEE9]/70">
              {headsCount} heads × {daysCount} days × {currencySymbol}{foodCostPerPersonDay}
            </div>
          </div>
        </div>

        {/* 5. Miscellaneous & Local Cabs */}
        <div className="p-4 rounded-2xl bg-[#1A1E24]/70 border border-[#2E3440] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ECEFF4]">
              <ShoppingBag className="w-4 h-4 text-[#B48EAD]" />
              <span>Miscellaneous & Shopping</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#B48EAD]">
              {currencySymbol} {totalMiscellaneousExpense.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-[#D8DEE9] uppercase font-semibold">
                Shopping, Local Taxis & Emergency Buffer ({currencySymbol})
              </label>
              <input
                type="number"
                value={miscellaneousCost}
                onChange={(e) => setMiscellaneousCost(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] font-mono text-xs focus:ring-1 focus:ring-[#B48EAD]"
              />
            </div>
            <div className="text-[10px] text-[#D8DEE9]/70">
              Covers souvenirs, tea house stops & tips
            </div>
          </div>
        </div>

        {/* 6. Budget Status & Synchronization Card */}
        <div className="p-4 rounded-2xl bg-[#242933] border border-[#3B4252] space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-[#ECEFF4] flex items-center justify-between">
              <span>Budget Comparison</span>
              <span className={`flex items-center gap-1 font-bold text-xs ${isUnderBudget ? 'text-[#A3BE8C]' : 'text-[#BF616A]'}`}>
                {isUnderBudget ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                <span>{isUnderBudget ? 'Under Budget' : 'Over Budget'}</span>
              </span>
            </div>

            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between text-[#D8DEE9]">
                <span>Total Group Budget:</span>
                <span className="font-mono font-bold text-[#ECEFF4]">{currencySymbol} {(activeTrip.budget || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#D8DEE9]">
                <span>Calculated Expense:</span>
                <span className="font-mono font-bold text-[#88C0D0]">{currencySymbol} {totalCalculatedExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#2E3440] font-bold">
                <span className={isUnderBudget ? 'text-[#A3BE8C]' : 'text-[#BF616A]'}>
                  {isUnderBudget ? 'Remaining Buffer:' : 'Budget Deficit:'}
                </span>
                <span className={`font-mono ${isUnderBudget ? 'text-[#A3BE8C]' : 'text-[#BF616A]'}`}>
                  {isUnderBudget ? '+' : '-'}{currencySymbol} {Math.abs(budgetDifference).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncToTripBudget}
            className="w-full py-2 px-3 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#88C0D0]/20"
          >
            {isSynced ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#1A1E24]" />
                <span>Saved to Trip Budget!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Update Trip Budget to {currencySymbol}{totalCalculatedExpense.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Bottom Breakdown Bar */}
      <div className="pt-4 border-t border-[#2E3440] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#D8DEE9]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#88C0D0]" />
          <span>Average Cost per Person: <strong className="text-[#ECEFF4] font-mono text-sm">{currencySymbol} {costPerHead.toLocaleString()}</strong></span>
        </div>
        <div className="text-[11px] text-[#D8DEE9]/70">
          Hotel ({Math.round(totalHotelExpense/totalCalculatedExpense * 100 || 0)}%) • 
          Transit ({Math.round(totalTransitExpense/totalCalculatedExpense * 100 || 0)}%) • 
          Sightseeing ({Math.round(totalSightseeingExpense/totalCalculatedExpense * 100 || 0)}%) • 
          Food ({Math.round(totalFoodExpense/totalCalculatedExpense * 100 || 0)}%)
        </div>
      </div>

    </section>
  );
};
