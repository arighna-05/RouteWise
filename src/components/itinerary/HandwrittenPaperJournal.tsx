import React, { useState } from 'react';
import { 
  Printer, 
  Copy, 
  CheckCheck, 
  X
} from 'lucide-react';
import type { ItineraryItem, TravelerGroupProfile, WeatherData } from '../../types/travel';
import { getMembersSummary } from '../common/FamilyMembersSelector';

interface HandwrittenPaperJournalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  country?: string;
  origin?: string;
  startDate?: string;
  durationDays: number;
  items: ItineraryItem[];
  summary?: string;
  profile?: TravelerGroupProfile;
  weather?: WeatherData | null;
  budget?: number;
  totalCost?: number;
  isAIPlan?: boolean;
}

export const HandwrittenPaperJournal: React.FC<HandwrittenPaperJournalProps> = ({
  isOpen,
  onClose,
  cityName,
  country = '',
  origin = '',
  startDate = 'Day 1',
  durationDays,
  items,
  summary = '',
  profile,
  weather,
  budget,
  totalCost,
  isAIPlan = false,
}) => {
  const [inkColor, setInkColor] = useState<'blue' | 'black' | 'pencil'>('blue');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    let text = `📓 TRAVEL JOURNAL — ${origin ? `${origin} ➔ ` : ''}${cityName}\n`;
    text += `📅 Dates: ${startDate} (${durationDays} Days)\n`;
    if (profile) {
      text += `👥 Travelers: ${profile.numberOfHeads} (${profile.ageGroup})\n`;
    }
    if (summary) {
      text += `📝 Trip Memo: "${summary}"\n\n`;
    }

    for (let d = 1; d <= durationDays; d++) {
      const dayItems = items.filter(it => it.dayIndex === d);
      if (dayItems.length === 0) continue;
      text += `\n═══ DAY ${d} ═══\n`;
      dayItems.forEach(it => {
        text += `[✓] ${it.time} — ${it.title}\n`;
        if (it.location) text += `    📍 Location: ${it.location}\n`;
        if (it.notes) text += `    ✎ Note: ${it.notes}\n`;
        if (it.transitInfo) text += `    ⤹ Transit: ${it.transitInfo}\n`;
        if (it.cost) text += `    💰 Est: ₹${it.cost}\n`;
      });
    }

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  const getDayDateLabel = (dayIndex: number) => {
    try {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + dayIndex - 1);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
    } catch {
      // ignore
    }
    return `Day ${dayIndex}`;
  };

  const calculatedTotal = totalCost !== undefined 
    ? totalCost 
    : items.reduce((s, it) => s + (Number(it.cost) || 0), 0);

  // Ink styles
  const inkClass = inkColor === 'blue' 
    ? 'text-[#1e3a8a]' // Royal Blue Fountain Pen
    : inkColor === 'black'
    ? 'text-[#18181b]' // Jet Black Gel Pen
    : 'text-[#475569]'; // Soft Graphite Pencil

  const accentInkClass = inkColor === 'blue'
    ? 'text-[#1d4ed8]'
    : inkColor === 'black'
    ? 'text-[#27272a]'
    : 'text-[#64748b]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#0f172a]/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Container holding controls + Paper Sheet */}
      <div className="w-full max-w-4xl max-h-[95vh] flex flex-col my-auto">
        
        {/* Floating Controls Bar (Hidden in Print) */}
        <div className="no-print bg-[#1e293b]/95 border border-[#334155] rounded-2xl p-2.5 sm:p-3 sm:px-5 mb-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#f8fafc] uppercase tracking-wider flex items-center gap-1.5">
              <span>📖</span>
              <span className="hidden sm:inline">Handwritten Travel Journal</span>
              <span className="sm:hidden">Journal</span>
            </span>
            {isAIPlan && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#88C0D0]/20 text-[#88C0D0] border border-[#88C0D0]/30">
                AI
              </span>
            )}
          </div>

          {/* Center: Pen Selector */}
          <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-xl border border-[#334155] text-xs">
            <button
              type="button"
              onClick={() => setInkColor('blue')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all ${
                inkColor === 'blue'
                  ? 'bg-[#1e3a8a] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Royal Blue Fountain Pen Ink"
            >
              🖋️ Blue<span className="hidden sm:inline"> Ink</span>
            </button>
            <button
              type="button"
              onClick={() => setInkColor('black')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all ${
                inkColor === 'black'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Black Pen Ink"
            >
              🖊️ Black<span className="hidden sm:inline"> Ink</span>
            </button>
            <button
              type="button"
              onClick={() => setInkColor('pencil')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all ${
                inkColor === 'pencil'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Graphite Pencil"
            >
              ✏️ Pencil
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0f172a] hover:bg-[#334155] border border-[#334155] text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
              title="Copy journal text"
            >
              {isCopied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            {/* Print / Save to PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              title="Print journal or Save to PDF in handwritten format"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Journal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            Physical Paper Notebook Sheet
            ========================================================================= */}
        <div className="paper-journal paper-ruled-lines paper-margin-guide rounded-2xl p-4 sm:p-12 overflow-y-auto flex-1 shadow-2xl border border-[#d6cfbe] relative font-handwritten-body select-text">
          
          {/* Notebook Spiral / Binder Holes (Visual Touch on Left Edge) */}
          <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around py-8 pointer-events-none opacity-40">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#d4cbba] border border-[#b8ab96] shadow-inner" />
            ))}
          </div>

          {/* Left Red Margin Guide Space */}
          <div className="pl-6 sm:pl-12 space-y-6">

            {/* Journal Header: Handwritten Trip Memo */}
            <div className="border-b-2 border-[#e2d9c8] pb-5 space-y-2.5">
              
              {/* Date Stamp & City Header */}
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-handwritten text-[#b91c1c] font-bold tracking-wider uppercase flex items-center gap-1">
                    <span>★</span>
                    <span>TRAVEL DIARY & ITINERARY</span>
                  </div>
                  <h1 className={`text-3xl sm:text-4xl font-black font-handwritten ${inkClass} leading-tight`}>
                    {origin ? `${origin} ➔ ` : ''}{cityName} {country ? `(${country})` : ''}
                  </h1>
                </div>

                {/* Hand-stamped Trip Meta Tag */}
                <div className="border-2 border-dashed border-[#b91c1c]/60 px-3 py-1.5 rounded-lg -rotate-1 bg-[#fef2f2]/60 text-[#b91c1c] text-xs font-handwritten font-bold shadow-xs">
                  <span>🗓️ {startDate} • {durationDays} Days</span>
                </div>
              </div>

              {/* Hand-drawn Traveler & Budget Memo Bar */}
              <div className={`flex flex-wrap items-center gap-x-6 gap-y-1.5 text-base font-handwritten ${accentInkClass}`}>
                {profile && (
                  <div className="flex items-center gap-1">
                    <span>👥</span>
                    <span>
                      {profile.members && profile.members.length > 0 
                        ? getMembersSummary(profile.members)
                        : `${profile.numberOfHeads} Travelers (${profile.ageGroup})`}
                    </span>
                  </div>
                )}
                
                {budget && budget > 0 ? (
                  <div className="flex items-center gap-1">
                    <span>💰</span>
                    <span>Est. Cost: ₹{calculatedTotal.toLocaleString()} / Target: ₹{budget.toLocaleString()}</span>
                  </div>
                ) : calculatedTotal > 0 ? (
                  <div className="flex items-center gap-1">
                    <span>💰</span>
                    <span>Est. Total: ₹{calculatedTotal.toLocaleString()}</span>
                  </div>
                ) : null}

                {weather && (
                  <div className="flex items-center gap-1">
                    <span>🌤️</span>
                    <span>Weather: {weather.temperature}°C ({weather.weatherDescription})</span>
                  </div>
                )}
              </div>

              {/* Handwritten Note / Quote Memo */}
              {summary && (
                <div className="mt-3 p-3 rounded-xl bg-[#fef9c3]/50 border border-[#fef08a] font-handwritten text-lg sm:text-xl text-[#78350f] leading-snug rotate-[-0.3deg]">
                  <span className="font-bold text-[#b45309]">Memo: </span>
                  <em>"{summary}"</em>
                </div>
              )}
            </div>

            {/* Day-by-Day Entries Written in Fountain Pen */}
            <div className="space-y-8 pt-2">
              {Array.from({ length: durationDays }, (_, i) => i + 1).map((dayNum) => {
                const dayItems = items.filter(it => it.dayIndex === dayNum);

                return (
                  <div 
                    key={dayNum} 
                    className="print-avoid-break space-y-3.5 pb-4 border-b border-[#ebdccb] last:border-b-0"
                  >
                    {/* Day Notebook Banner */}
                    <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#1e3a8a]/20 pb-1">
                      <h2 className={`text-2xl sm:text-3xl font-bold font-handwritten ${inkClass} tracking-wide flex items-center gap-2`}>
                        <span className="text-[#b91c1c]">✦</span>
                        <span>Day {dayNum}</span>
                        <span className="text-base sm:text-lg font-normal opacity-80">
                          ({getDayDateLabel(dayNum)})
                        </span>
                      </h2>

                      <span className="text-xs sm:text-sm font-handwritten text-[#b91c1c] font-bold">
                        {dayItems.length} stops planned
                      </span>
                    </div>

                    {/* If no items planned for this day yet */}
                    {dayItems.length === 0 ? (
                      <div className="py-3 text-sm italic opacity-60 font-handwritten text-center">
                        ~ Free day / open for leisure exploration ~
                      </div>
                    ) : (
                      /* Activities on this day */
                      <div className="space-y-4 pl-1 sm:pl-2">
                        {dayItems.map((item, idx) => (
                          <div 
                            key={item.id || idx}
                            className="space-y-1 leading-relaxed text-slate-800"
                          >
                            {/* Line 1: Time, Checkbox & Spot Title */}
                            <div className="flex flex-wrap items-baseline gap-2">
                              {/* Doodle Checkbox */}
                              <span className="text-base text-[#15803d] font-bold font-mono">
                                [✓]
                              </span>

                              {/* Handwritten Timestamp */}
                              <span className="font-handwritten text-lg sm:text-xl font-bold text-[#b91c1c] shrink-0">
                                {item.time}
                              </span>

                              {/* Title */}
                              <span className={`font-handwritten text-xl sm:text-2xl font-black ${inkClass}`}>
                                {item.title}
                              </span>

                              {/* Location tag in pencil */}
                              {item.location && item.location !== item.title && (
                                <span className="text-sm font-handwritten text-slate-500 flex items-center gap-0.5">
                                  <span>📍</span>
                                  <span>{item.location}</span>
                                </span>
                              )}

                              {/* Cost in pencil / pen */}
                              {Number(item.cost) > 0 && (
                                <span className="ml-auto text-sm font-handwritten font-bold text-emerald-800 bg-[#dcfce7]/60 px-2 py-0.5 rounded border border-[#86efac]/40">
                                  ₹{Number(item.cost).toLocaleString()}
                                </span>
                              )}
                            </div>

                            {/* Line 2: Personal Hand-annotated Note */}
                            {item.notes && (
                              <div className={`pl-7 font-handwritten text-lg sm:text-xl ${accentInkClass} leading-snug flex items-start gap-1.5`}>
                                <span className="text-[#b45309] font-bold shrink-0">✎</span>
                                <span>{item.notes}</span>
                              </div>
                            )}

                            {/* Line 3: Transit Doodle Arrow */}
                            {item.transitInfo && (
                              <div className="pl-7 font-handwritten text-base sm:text-lg text-[#0369a1] flex items-center gap-1.5">
                                <span className="text-lg">⤹</span>
                                <span className="marker-highlight-cyan">{item.transitInfo}</span>
                              </div>
                            )}

                            {/* Line 4: Accessibility / Senior / Kid Note */}
                            {item.accessibilityNote && (
                              <div className="pl-7 font-handwritten text-sm sm:text-base text-[#15803d] flex items-center gap-1">
                                <span>🌿</span>
                                <span>{item.accessibilityNote}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Handwritten Sign-off Stamp at Bottom */}
            <div className="pt-6 border-t-2 border-dashed border-[#d6cfbe] flex flex-wrap items-center justify-between gap-4 font-handwritten text-slate-600">
              <div className="text-base flex items-center gap-2">
                <span>🎒</span>
                <span>Happy Journey from RouteWise! Safe travels & take lots of photos!</span>
              </div>
              <div className="text-sm border border-slate-400 px-3 py-1 rounded-md rotate-1 text-slate-500">
                Printed: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
