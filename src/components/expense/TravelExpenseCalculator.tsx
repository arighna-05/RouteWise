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
  Sparkles
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const TravelExpenseCalculator: React.FC = () => {
  const { activeTrip, updateTripBudget } = useTrip();

  const isINR = (activeTrip.currency || 'INR').includes('INR');
  const currencySymbol = isINR ? '₹' : (activeTrip.currency?.split(' ')[0] || '$');

  const headsCount = activeTrip.groupProfile?.numberOfHeads || 2;
  const daysCount = activeTrip.daysCount || 3;
  const defaultNights = Math.max(1, daysCount - 1);
  const defaultRooms = Math.max(1, Math.ceil(headsCount / 2));

  // 1. Hotel / Lodging State
  const [hotelCostPerNight, setHotelCostPerNight] = useState<number>(() => isINR ? 3200 : 120);
  const [hotelRooms, setHotelRooms] = useState<number>(defaultRooms);
  const [hotelNights, setHotelNights] = useState<number>(defaultNights);

  // 2. Scheduled Sightseeing / Places Cost (Auto-calculated from itinerary)
  const itineraryActivitiesCost = useMemo(() => {
    return activeTrip.items.reduce((sum, item) => sum + (item.cost || 0), 0);
  }, [activeTrip.items]);

  const [extraSightseeingBuffer, setExtraSightseeingBuffer] = useState<number>(0);

  // 3. Train / Plane / Long-Distance Transit
  const [transitMode, setTransitMode] = useState<'plane' | 'train' | 'cab'>('train');
  const [transitCostPerPerson, setTransitCostPerPerson] = useState<number>(() => {
    return isINR ? 1800 : 90;
  });

  // 4. Food & Dining
  const [foodCostPerPersonDay, setFoodCostPerPersonDay] = useState<number>(() => isINR ? 800 : 35);

  // 5. Miscellaneous & Local Expenses
  const [miscellaneousCost, setMiscellaneousCost] = useState<number>(() => isINR ? 2500 : 100);

  // Success message after sync
  const [isSynced, setIsSynced] = useState<boolean>(false);

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
