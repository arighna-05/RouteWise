import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useViewMode } from '../../context/ViewModeContext';

interface NordicDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const NordicDatePicker: React.FC<NordicDatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  className = '',
}) => {
  const { isMobileView } = useViewMode();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value into year, month, date (local time)
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDate = value ? parseDateString(value) : null;
  const initialViewDate = selectedDate || new Date();

  const [viewYear, setViewYear] = useState<number>(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialViewDate.getMonth());

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = parseDateString(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside listener to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatYYYYMMDD = (year: number, month: number, day: number) => {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  };

  const isDateDisabled = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    const formatted = formatYYYYMMDD(year, month, day);
    if (isDateDisabled(formatted)) return;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleQuickSelect = (daysFromToday: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromToday);
    const formatted = formatYYYYMMDD(target.getFullYear(), target.getMonth(), target.getDate());
    if (isDateDisabled(formatted)) return;
    onChange(formatted);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  // Calendar matrix calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const today = new Date();
  const todayStr = formatYYYYMMDD(today.getFullYear(), today.getMonth(), today.getDate());

  // Generate day cells
  const dayCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = formatYYYYMMDD(prevYear, prevMonth, day);
    const isSelected = value === dateStr;
    const isDisabled = isDateDisabled(dateStr);

    dayCells.push({
      day,
      month: prevMonth,
      year: prevYear,
      dateStr,
      isCurrentMonth: false,
      isSelected,
      isDisabled,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatYYYYMMDD(viewYear, viewMonth, d);
    const isSelected = value === dateStr;
    const isToday = dateStr === todayStr;
    const isDisabled = isDateDisabled(dateStr);

    dayCells.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      dateStr,
      isCurrentMonth: true,
      isSelected,
      isToday,
      isDisabled,
    });
  }

  // Next month leading days (fill up to 35 or 42 grid cells)
  const remaining = (7 - (dayCells.length % 7)) % 7;
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  for (let d = 1; d <= remaining; d++) {
    const dateStr = formatYYYYMMDD(nextYear, nextMonth, d);
    const isSelected = value === dateStr;
    const isDisabled = isDateDisabled(dateStr);

    dayCells.push({
      day: d,
      month: nextMonth,
      year: nextYear,
      dateStr,
      isCurrentMonth: false,
      isSelected,
      isDisabled,
    });
  }

  // Display text formatted cleanly
  const formattedDisplay = selectedDate ? (
    <span className="flex items-center gap-1.5">
      <span className={`font-medium font-mono ${isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'}`}>{value}</span>
      <span className={`text-[11px] font-sans ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#81A1C1]'}`}>
        ({selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})
      </span>
    </span>
  ) : (
    <span className={isMobileView ? 'text-[#94A3B8]' : 'text-[#D8DEE9]/50'}>{placeholder}</span>
  );

  // Year options for quick select (current year - 2 to +8)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 12 }, (_, i) => currentYear - 1 + i);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Input/Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full px-3 py-2 rounded-xl border ${
          isMobileView
            ? isOpen
              ? 'bg-white border-[#5D5FEF] ring-2 ring-[#5D5FEF]/20 text-[#1A1D2E]'
              : 'bg-white border-[#E2E6F0] hover:border-[#5D5FEF] text-[#1A1D2E] shadow-sm'
            : isOpen
              ? 'bg-[#1A1E24] border-[#88C0D0] ring-2 ring-[#88C0D0]/30 text-[#ECEFF4]'
              : 'bg-[#1A1E24] border-[#3B4252] hover:border-[#81A1C1] text-[#ECEFF4]'
        } text-xs font-mono flex items-center justify-between cursor-pointer transition-all select-none group`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {formattedDisplay}
        </div>
        <div className={`p-1 rounded-md transition-colors ${
          isMobileView
            ? 'text-[#5D5FEF] group-hover:bg-[#EEF0FF]'
            : 'text-[#88C0D0] group-hover:text-[#ECEFF4] group-hover:bg-[#2E3440]'
        }`}>
          <CalendarIcon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className={`absolute left-0 top-full mt-2 z-50 w-72 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in border ${
          isMobileView
            ? 'bg-white border-[#E2E6F0] text-[#1A1D2E] shadow-[0_10px_35px_rgba(20,30,50,0.12)]'
            : 'bg-[#242933] border-[#3B4252] text-[#ECEFF4] shadow-black/80'
        }`}>
          {/* Calendar Header */}
          <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
            isMobileView ? 'border-[#F1F3F9]' : 'border-[#2E3440]'
          }`}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className={`p-1.5 rounded-lg transition-colors ${
                isMobileView
                  ? 'hover:bg-[#F4F6FB] text-[#67708A] hover:text-[#1A1D2E]'
                  : 'hover:bg-[#3B4252] text-[#D8DEE9] hover:text-[#ECEFF4]'
              }`}
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className={`text-xs font-semibold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                  isMobileView
                    ? 'bg-[#F8FAFC] text-[#1A1D2E] border-[#E2E6F0] focus:border-[#5D5FEF]'
                    : 'bg-[#1A1E24] text-[#ECEFF4] border-[#3B4252] focus:border-[#88C0D0]'
                }`}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className={`text-xs font-semibold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                  isMobileView
                    ? 'bg-[#F8FAFC] text-[#1A1D2E] border-[#E2E6F0] focus:border-[#5D5FEF]'
                    : 'bg-[#1A1E24] text-[#ECEFF4] border-[#3B4252] focus:border-[#88C0D0]'
                }`}
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className={`p-1.5 rounded-lg transition-colors ${
                isMobileView
                  ? 'hover:bg-[#F4F6FB] text-[#67708A] hover:text-[#1A1D2E]'
                  : 'hover:bg-[#3B4252] text-[#D8DEE9] hover:text-[#ECEFF4]'
              }`}
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className={`text-[10px] font-bold text-center uppercase tracking-wider py-0.5 ${
                  isMobileView ? 'text-[#7E859B]' : 'text-[#81A1C1]'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {dayCells.map((cell, index) => {
              const isSelected = cell.isSelected;
              const isCurrent = cell.isCurrentMonth;
              const isToday = cell.isToday;
              const isDisabled = cell.isDisabled;

              let btnClasses =
                'h-8 w-full rounded-lg text-xs flex items-center justify-center transition-all font-mono ';

              if (isDisabled) {
                btnClasses += isMobileView
                  ? 'opacity-30 cursor-not-allowed text-[#CBD5E1]'
                  : 'opacity-30 cursor-not-allowed text-[#4C566A]';
              } else if (isSelected) {
                btnClasses += isMobileView
                  ? 'bg-[#5D5FEF] text-white font-bold shadow-md shadow-[#5D5FEF]/30 scale-105'
                  : 'bg-[#88C0D0] text-[#1A1E24] font-bold shadow-md shadow-[#88C0D0]/30 scale-105';
              } else if (isToday) {
                btnClasses += isMobileView
                  ? 'border border-[#5D5FEF] text-[#5D5FEF] font-semibold hover:bg-[#EEF0FF]'
                  : 'border border-[#88C0D0] text-[#88C0D0] font-semibold hover:bg-[#3B4252]';
              } else if (isCurrent) {
                btnClasses += isMobileView
                  ? 'text-[#1A1D2E] hover:bg-[#F4F6FB] hover:text-[#5D5FEF]'
                  : 'text-[#ECEFF4] hover:bg-[#3B4252] hover:text-[#88C0D0]';
              } else {
                btnClasses += isMobileView
                  ? 'text-[#94A3B8] hover:bg-[#F8FAFC]'
                  : 'text-[#4C566A] hover:bg-[#2E3440] hover:text-[#D8DEE9]';
              }

              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${index}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDay(cell.year, cell.month, cell.day);
                  }}
                  className={btnClasses}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Quick Jump Shortcuts */}
          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
            isMobileView ? 'border-[#F1F3F9]' : 'border-[#2E3440]'
          }`}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSelect(0)}
                className={`px-2 py-1 rounded-md transition-colors font-medium ${
                  isMobileView
                    ? 'bg-[#EEF0FF] text-[#5D5FEF] hover:bg-[#E0E2FD]'
                    : 'bg-[#2E3440] text-[#88C0D0] hover:bg-[#3B4252]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(1)}
                className={`px-2 py-1 rounded-md transition-colors font-medium ${
                  isMobileView
                    ? 'bg-[#F4F6FB] text-[#4F566B] hover:bg-[#EEF0FF] hover:text-[#5D5FEF]'
                    : 'bg-[#2E3440] text-[#D8DEE9] hover:bg-[#3B4252]'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(7)}
                className={`px-2 py-1 rounded-md transition-colors font-medium ${
                  isMobileView
                    ? 'bg-[#F4F6FB] text-[#4F566B] hover:bg-[#EEF0FF] hover:text-[#5D5FEF]'
                    : 'bg-[#2E3440] text-[#D8DEE9] hover:bg-[#3B4252]'
                }`}
              >
                +1 Wk
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded-md transition-colors ${
                isMobileView
                  ? 'text-[#67708A] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                  : 'text-[#D8DEE9]/70 hover:text-white hover:bg-[#2E3440]'
              }`}
              title="Close calendar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
