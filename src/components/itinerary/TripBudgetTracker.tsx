import React, { useState } from 'react';
import { 
  Edit2, 
  Check,
  PieChart
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import type { ActivityCategory } from '../../types/travel';

export const TripBudgetTracker: React.FC = () => {
  const { activeTrip, updateTripBudget } = useTrip();
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(activeTrip.budget));

  const totalSpent = activeTrip.items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const remaining = Math.max(0, activeTrip.budget - totalSpent);
  const percentSpent = Math.min(100, Math.round((totalSpent / (activeTrip.budget || 1)) * 100));

  const categoryTotals: Record<string, number> = {};
  activeTrip.items.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + (Number(item.cost) || 0);
  });

  const categories: { key: ActivityCategory; label: string; color: string }[] = [
    { key: 'food', label: 'Food & Dining', color: 'bg-amber-400' },
    { key: 'sightseeing', label: 'Sightseeing', color: 'bg-sky-400' },
    { key: 'activity', label: 'Activities', color: 'bg-emerald-400' },
    { key: 'shopping', label: 'Shopping', color: 'bg-pink-400' },
    { key: 'transport', label: 'Transport', color: 'bg-indigo-400' },
    { key: 'lodging', label: 'Lodging', color: 'bg-purple-400' },
  ];

  const handleSaveBudget = () => {
    const val = Number(budgetInput);
    if (!isNaN(val) && val > 0) {
      updateTripBudget(val);
    }
    setIsEditing(false);
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-glass">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <PieChart className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Trip Expense Breakdown
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">$</span>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
              />
              <button
                onClick={handleSaveBudget}
                className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-400"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setBudgetInput(String(activeTrip.budget));
                setIsEditing(true);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Target: <strong>${activeTrip.budget}</strong></span>
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 my-4">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Allocated</p>
          <p className="text-base font-bold text-white font-mono mt-0.5">${totalSpent}</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</p>
          <p className={`text-base font-bold font-mono mt-0.5 ${remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${remaining}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Budget Use</p>
          <p className="text-base font-bold text-sky-400 font-mono mt-0.5">{percentSpent}%</p>
        </div>
      </div>

      <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden flex">
        {categories.map((cat) => {
          const cost = categoryTotals[cat.key] || 0;
          if (cost <= 0) return null;
          const pct = Math.max(2, (cost / (activeTrip.budget || 1)) * 100);
          return (
            <div
              key={cat.key}
              className={`${cat.color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${cat.label}: $${cost}`}
            />
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {categories.map((cat) => {
          const cost = categoryTotals[cat.key] || 0;
          return (
            <div key={cat.key} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/40">
              <div className="flex items-center gap-1.5 truncate">
                <span className={`w-2 h-2 rounded-full ${cat.color} shrink-0`} />
                <span className="text-slate-400 truncate text-[11px]">{cat.label}</span>
              </div>
              <span className="font-mono text-slate-200 font-medium text-[11px]">${cost}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
