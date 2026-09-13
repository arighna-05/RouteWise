import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Copy, 
  CheckCheck, 
  Send, 
  Loader2, 
  Edit3,
  Printer
} from 'lucide-react';
import type { City, FamilyMember, ItineraryItem, TravelerGroupProfile, WeatherData } from '../../types/travel';
import { generateAITourPlanForGroup, refineAITourPlan } from '../../services/geminiService';
import { getDerivedAgeGroup, getMembersSummary } from '../common/FamilyMembersSelector';

interface AITourPlanNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: City;
  origin: string;
  startDate: string;
  durationDays: number;
  budget: number;
  familyMembers: FamilyMember[];
  travelStyle: string;
  weather: WeatherData | null;
  onApplyNotes: (selectedItems: ItineraryItem[], profile: TravelerGroupProfile, totalBudget: number) => void;
  initialItems?: ItineraryItem[];
}

export const AITourPlanNotesModal: React.FC<AITourPlanNotesModalProps> = ({
  isOpen,
  onClose,
  city,
  origin,
  startDate,
  durationDays,
  budget,
  familyMembers,
  travelStyle,
  weather,
  onApplyNotes,
  initialItems
}) => {
  const [items, setItems] = useState<ItineraryItem[]>(initialItems || []);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(!initialItems || initialItems.length === 0);
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [refineQuery, setRefineQuery] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refineSuccessMessage, setRefineSuccessMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const derivedAgeGroup = useMemo(() => {
    return getDerivedAgeGroup(familyMembers);
  }, [familyMembers]);

  const profile: TravelerGroupProfile = useMemo(() => ({
    numberOfHeads: Math.max(1, familyMembers.length || 2),
    ageGroup: derivedAgeGroup,
    travelStyle,
    members: familyMembers,
  }), [familyMembers, derivedAgeGroup, travelStyle]);

  // Initial generation when opened with realistic multi-step loading animation
  useEffect(() => {
    if (!isOpen) return;

    // If initial items were provided, set them and select all
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
      const allSelected: Record<string, boolean> = {};
      initialItems.forEach(it => { allSelected[it.id] = true; });
      setSelectedIds(allSelected);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadingStep(1);

    // Step 1 -> Step 2
    const timer1 = setTimeout(() => {
      if (isMounted) setLoadingStep(2);
    }, 700);

    // Step 2 -> Step 3
    const timer2 = setTimeout(() => {
      if (isMounted) setLoadingStep(3);
    }, 1400);

    // Step 3 -> Step 4
    const timer3 = setTimeout(() => {
      if (isMounted) setLoadingStep(4);
    }, 2100);

    async function generate() {
      try {
        const res = await generateAITourPlanForGroup(
          city,
          origin,
          startDate,
          '',
          durationDays,
          budget,
          profile.numberOfHeads,
          profile.ageGroup,
          travelStyle,
          weather,
          familyMembers
        );

        if (isMounted) {
          setItems(res.items);
          setSummary(res.summary);
          const allSelected: Record<string, boolean> = {};
          res.items.forEach(it => { allSelected[it.id] = true; });
          setSelectedIds(allSelected);
        }
      } catch (err) {
        console.error('Failed to generate tour plan:', err);
      } finally {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) setIsLoading(false);
          }, 2700);
        }
      }
    }

    generate();

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, city, origin, startDate, durationDays, budget, profile, travelStyle, weather, familyMembers, initialItems]);

  if (!isOpen) return null;

  // Toggle selection of an individual item
  const handleToggleItem = (id: string) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle all items for a specific day
  const handleToggleDay = (dayIndex: number) => {
    const dayItems = items.filter(it => it.dayIndex === dayIndex);
    const allDaySelected = dayItems.every(it => selectedIds[it.id]);

    setSelectedIds(prev => {
      const next = { ...prev };
      dayItems.forEach(it => {
        next[it.id] = !allDaySelected;
      });
      return next;
    });
  };

  // Select all or clear all
  const handleSelectAll = (select: boolean) => {
    const next: Record<string, boolean> = {};
    items.forEach(it => { next[it.id] = select; });
    setSelectedIds(next);
  };

  // Ask AI for changes
  const handleRefine = async (instruction: string) => {
    const clean = instruction.trim();
    if (!clean) return;

    setIsRefining(true);
    try {
      const res = await refineAITourPlan(city, items, clean, profile);
      setItems(res.items);
      setSummary(res.summary);
      // Select all new/refined items
      const nextSelected: Record<string, boolean> = {};
      res.items.forEach(it => { nextSelected[it.id] = true; });
      setSelectedIds(nextSelected);

      setRefineSuccessMessage(`✓ Updated notes: "${clean}"`);
      setRefineQuery('');
      setTimeout(() => setRefineSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Refinement failed:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Selected items calculation
  const selectedItems = items.filter(it => selectedIds[it.id]);
  const selectedTotalCost = selectedItems.reduce((s, it) => s + (Number(it.cost) || 0), 0);

  // Copy notes to clipboard in clean Markdown text format
  const handleCopyNotes = () => {
    let markdown = `# 📓 Tour Notes: ${origin ? `${origin} ➔ ` : ''}${city.name}\n`;
    markdown += `> ${summary || `Tailored ${durationDays}-day itinerary for ${profile.numberOfHeads} traveler(s) (${profile.ageGroup}).`}\n\n`;

    for (let d = 1; d <= durationDays; d++) {
      const dayItems = items.filter(it => it.dayIndex === d && selectedIds[it.id]);
      if (dayItems.length === 0) continue;

      markdown += `## Day ${d}\n`;
      dayItems.forEach(it => {
        markdown += `- **${it.time}** — ${it.title}\n`;
        if (it.notes) markdown += `  • Note: ${it.notes}\n`;
        if (it.transitInfo) markdown += `  • Transit: ${it.transitInfo}\n`;
        if (it.cost) markdown += `  • Est. Cost: ${city.currency?.split(' ')[0] || '₹'} ${it.cost}\n`;
      });
      markdown += `\n`;
    }

    navigator.clipboard.writeText(markdown).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  // Apply chosen notes to main itinerary
  const handleApply = () => {
    if (selectedItems.length === 0) return;
    onApplyNotes(selectedItems, profile, Math.max(budget, selectedTotalCost));
    onClose();
  };

  const QUICK_REFINEMENT_CHIPS = [
    { label: '⚡ More relaxed pace', prompt: 'Make the itinerary more relaxed with later starts and extra rest breaks' },
    { label: '☕ Add local cafes & tea', prompt: 'Add iconic local tea gardens, bakeries, and cozy cafes' },
    { label: '💰 Budget-friendly spots', prompt: 'Optimize for budget travelers, prioritize free viewpoints and economical local meals' },
    { label: '👨‍👩‍👧 Gentle for kids & seniors', prompt: 'Ensure step-free access, gentle walking paths, and minimal steep stairs' },
    { label: '🌅 Sunrise at Tiger Hill', prompt: 'Include sunrise excursion at Tiger Hill on Day 2 morning' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#1A1E24]/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#242933] border border-[#3B4252] rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto">
        
        {/* Modal Top Header */}
        <div className="no-print p-4 sm:p-5 border-b border-[#2E3440] flex items-center justify-between gap-4 bg-[#1A1E24]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#88C0D0]/15 text-[#88C0D0] shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-[#ECEFF4] tracking-tight">
                  AI Tour Itinerary (Handwritten Notes)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#88C0D0]/20 text-[#88C0D0] border border-[#88C0D0]/30">
                  Paper Journal
                </span>
              </div>
              <p className="text-xs text-[#D8DEE9]/80 mt-0.5">
                {origin ? `${origin} ➔ ` : ''}{city.name} • {durationDays} Days • {profile.numberOfHeads} Traveler(s) ({profile.ageGroup})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Print or Save to PDF in handwritten notebook format"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#D8DEE9] hover:text-white hover:bg-[#3B4252] transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          
          {/* 1. Engaging AI Thinking Loading State */}
          {isLoading ? (
            <div className="py-16 px-6 text-center space-y-6 max-w-lg mx-auto animate-in fade-in">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#3B4252] border-t-[#88C0D0] animate-spin" />
                <Sparkles className="w-7 h-7 text-[#EBCB8B] animate-pulse" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-[#ECEFF4]">
                  Gemini is Crafting Your Handwritten Tour Notes...
                </h4>
                <p className="text-xs text-[#D8DEE9]">
                  Taking into account mountain elevation, road travel times, and your group profile.
                </p>
              </div>

              {/* Step Progression Bar */}
              <div className="space-y-3 bg-[#1A1E24] p-4 rounded-2xl border border-[#3B4252] text-left">
                <div className={`flex items-center gap-3 text-xs transition-opacity ${loadingStep >= 1 ? 'text-[#ECEFF4] font-semibold' : 'text-[#4C566A]'}`}>
                  {loadingStep > 1 ? (
                    <Check className="w-4 h-4 text-[#A3BE8C] shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-[#88C0D0] animate-spin shrink-0" />
                  )}
                  <span>Analyzing mountain terrain & road traffic rules...</span>
                </div>

                <div className={`flex items-center gap-3 text-xs transition-opacity ${loadingStep >= 2 ? 'text-[#ECEFF4] font-semibold' : 'text-[#4C566A]'}`}>
                  {loadingStep > 2 ? (
                    <Check className="w-4 h-4 text-[#A3BE8C] shrink-0" />
                  ) : loadingStep === 2 ? (
                    <Loader2 className="w-4 h-4 text-[#88C0D0] animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#4C566A]" />
                  )}
                  <span>Correlating weather forecasts & daylight visibility...</span>
                </div>

                <div className={`flex items-center gap-3 text-xs transition-opacity ${loadingStep >= 3 ? 'text-[#ECEFF4] font-semibold' : 'text-[#4C566A]'}`}>
                  {loadingStep > 3 ? (
                    <Check className="w-4 h-4 text-[#A3BE8C] shrink-0" />
                  ) : loadingStep === 3 ? (
                    <Loader2 className="w-4 h-4 text-[#88C0D0] animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#4C566A]" />
                  )}
                  <span>Customizing pace for {profile.numberOfHeads} traveler(s) ({profile.ageGroup})...</span>
                </div>

                <div className={`flex items-center gap-3 text-xs transition-opacity ${loadingStep >= 4 ? 'text-[#ECEFF4] font-semibold' : 'text-[#4C566A]'}`}>
                  {loadingStep === 4 ? (
                    <Loader2 className="w-4 h-4 text-[#EBCB8B] animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#4C566A]" />
                  )}
                  <span>Inking handwritten paper notebook format...</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Minimalist Refinement Prompt Bar ("Ask for Changes") */}
              <div className="no-print p-4 rounded-2xl bg-[#1A1E24]/70 border border-[#3B4252] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#D8DEE9] uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#EBCB8B]" />
                    <span>Ask AI for Changes to These Handwritten Notes</span>
                  </label>
                  {isRefining && (
                    <span className="flex items-center gap-1 text-[11px] text-[#88C0D0] font-semibold animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Inking refinements...</span>
                    </span>
                  )}
                </div>

                {/* Quick 1-Tap Refinement Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REFINEMENT_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(chip.prompt)}
                      className="px-2.5 py-1 rounded-xl bg-[#242933] hover:bg-[#3B4252] border border-[#3B4252] text-[11px] font-medium text-[#D8DEE9] hover:text-[#ECEFF4] transition-all disabled:opacity-50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Freeform Prompt Input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRefine(refineQuery);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={refineQuery}
                    onChange={(e) => setRefineQuery(e.target.value)}
                    placeholder="Type changes (e.g. 'Swap Day 2 afternoon with scenic tea estate', 'Make Day 1 start after 12pm')..."
                    disabled={isRefining}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] placeholder-[#4C566A] text-xs focus:ring-2 focus:ring-[#88C0D0] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isRefining || !refineQuery.trim()}
                    className="px-4 py-2 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Refine Notes</span>
                  </button>
                </form>

                {refineSuccessMessage && (
                  <div className="text-xs text-[#A3BE8C] font-semibold flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>{refineSuccessMessage}</span>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  Outcome: Authentic Handwritten Lined Paper Notebook
                  ========================================================================= */}
              <div className="paper-journal paper-ruled-lines paper-margin-guide rounded-2xl p-6 sm:p-10 border border-[#d6cfbe] shadow-xl relative font-handwritten-body select-text">
                
                {/* Spiral/Binder holes on left */}
                <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-around py-8 pointer-events-none opacity-40">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div key={idx} className="w-2.5 h-2.5 rounded-full bg-[#d4cbba] border border-[#b8ab96] shadow-inner" />
                  ))}
                </div>

                <div className="pl-6 sm:pl-10 space-y-6">
                  {/* Handwritten Trip Memo Banner */}
                  <div className="border-b-2 border-[#e2d9c8] pb-4 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <div className="text-xs font-handwritten text-[#b91c1c] font-bold tracking-wider uppercase flex items-center gap-1">
                          <span>★</span>
                          <span>AI TRAVEL NOTES & ITINERARY</span>
                        </div>
                        <h4 className="text-2xl sm:text-3xl font-black font-handwritten text-[#1e3a8a] leading-tight">
                          {origin ? `${origin} ➔ ` : ''}{city.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="border-2 border-dashed border-[#b91c1c]/50 px-2.5 py-1 rounded-lg -rotate-1 bg-[#fef2f2]/60 text-[#b91c1c] text-xs font-handwritten font-bold">
                          🗓️ {startDate} • {durationDays} Days
                        </div>
                        <div className="no-print flex items-center gap-2 text-xs font-handwritten text-slate-600 pl-2">
                          <button
                            type="button"
                            onClick={() => handleSelectAll(true)}
                            className="text-[#1d4ed8] underline font-bold hover:text-[#1e3a8a]"
                          >
                            Select All
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectAll(false)}
                            className="text-slate-500 underline hover:text-slate-700"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm sm:text-base font-handwritten text-[#1d4ed8]">
                      <span>👥 {profile.members?.length ? getMembersSummary(profile.members) : `${profile.numberOfHeads} Travelers (${profile.ageGroup})`}</span>
                      {selectedTotalCost > 0 && <span>💰 Est. Cost: ₹{selectedTotalCost.toLocaleString()}</span>}
                      {weather && <span>🌤️ {weather.temperature}°C ({weather.weatherDescription})</span>}
                    </div>

                    {summary && (
                      <div className="mt-2 p-2.5 rounded-xl bg-[#fef9c3]/60 border border-[#fef08a] font-handwritten text-base sm:text-lg text-[#78350f] leading-snug rotate-[-0.2deg]">
                        <span className="font-bold text-[#b45309]">Memo: </span>
                        <em>"{summary}"</em>
                      </div>
                    )}
                  </div>

                  {/* Day-by-Day Entries Written in Fountain Pen */}
                  <div className="space-y-6">
                    {Array.from({ length: durationDays }, (_, i) => i + 1).map((dayNum) => {
                      const dayItems = items.filter(it => it.dayIndex === dayNum);
                      const allDaySelected = dayItems.length > 0 && dayItems.every(it => selectedIds[it.id]);

                      return (
                        <div key={dayNum} className="space-y-3 pb-4 border-b border-[#ebdccb] last:border-b-0 print-avoid-break">
                          
                          {/* Day Header */}
                          <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#1e3a8a]/20 pb-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleDay(dayNum)}
                                className={`text-xs sm:text-sm font-handwritten font-bold px-2 py-0.5 rounded border transition-colors ${
                                  allDaySelected 
                                    ? 'bg-[#15803d] text-white border-[#15803d]' 
                                    : 'bg-white text-slate-500 border-slate-400 hover:border-[#15803d]'
                                }`}
                                title={allDaySelected ? 'Deselect entire day' : 'Select entire day'}
                              >
                                {allDaySelected ? '✓ Day Selected' : '○ Select Day'}
                              </button>
                              <h3 className="text-xl sm:text-2xl font-bold font-handwritten text-[#1e3a8a] tracking-wide flex items-center gap-1.5">
                                <span className="text-[#b91c1c]">✦</span>
                                <span>Day {dayNum} Travel Notes</span>
                              </h3>
                            </div>

                            <span className="text-xs sm:text-sm font-handwritten text-[#b91c1c] font-bold">
                              {dayItems.length} planned spots
                            </span>
                          </div>

                          {/* Day Notes Items in Fountain Pen Style */}
                          <div className="space-y-3.5 pl-1 sm:pl-2">
                            {dayItems.map((item) => {
                              const isSelected = Boolean(selectedIds[item.id]);

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleToggleItem(item.id)}
                                  className={`cursor-pointer transition-opacity select-none ${
                                    isSelected ? 'opacity-100' : 'opacity-40 hover:opacity-75'
                                  }`}
                                >
                                  {/* Line 1: Checkbox, Time, Title, Cost */}
                                  <div className="flex flex-wrap items-baseline gap-2">
                                    <span className={`text-base font-mono font-bold ${isSelected ? 'text-[#15803d]' : 'text-slate-400'}`}>
                                      {isSelected ? '[✓]' : '[  ]'}
                                    </span>
                                    <span className="font-handwritten text-lg font-bold text-[#b91c1c] shrink-0">
                                      {item.time}
                                    </span>
                                    <span className={`font-handwritten text-xl sm:text-2xl font-black text-[#1e3a8a] ${!isSelected && 'line-through text-slate-400'}`}>
                                      {item.title}
                                    </span>
                                    {item.location && item.location !== item.title && (
                                      <span className="text-sm font-handwritten text-slate-500">
                                        📍 {item.location}
                                      </span>
                                    )}
                                    {Number(item.cost) > 0 && (
                                      <span className="ml-auto text-sm font-handwritten font-bold text-emerald-800 bg-[#dcfce7]/70 px-2 py-0.5 rounded border border-[#86efac]/40">
                                        ₹{Number(item.cost).toLocaleString()}
                                      </span>
                                    )}
                                  </div>

                                  {/* Line 2: Personal Hand-annotated Note */}
                                  {item.notes && (
                                    <div className="pl-6 font-handwritten text-base sm:text-lg text-[#1d4ed8] leading-snug flex items-start gap-1">
                                      <span className="text-[#b45309] font-bold shrink-0">✎</span>
                                      <span>{item.notes}</span>
                                    </div>
                                  )}

                                  {/* Line 3: Transit Doodle Arrow */}
                                  {item.transitInfo && (
                                    <div className="pl-6 font-handwritten text-sm sm:text-base text-[#0369a1] flex items-center gap-1">
                                      <span>⤹</span>
                                      <span className="marker-highlight-cyan">{item.transitInfo}</span>
                                    </div>
                                  )}

                                  {/* Line 4: Accessibility / Care Note */}
                                  {item.accessibilityNote && (
                                    <div className="pl-6 font-handwritten text-xs sm:text-sm text-[#15803d] flex items-center gap-1">
                                      <span>🌿</span>
                                      <span>{item.accessibilityNote}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Handwritten Sign-off Stamp */}
                  <div className="pt-4 border-t-2 border-dashed border-[#d6cfbe] flex flex-wrap items-center justify-between gap-4 font-handwritten text-slate-600">
                    <div className="text-sm flex items-center gap-1.5">
                      <span>🎒</span>
                      <span>Prepared by RouteWise AI Concierge. Safe journeys!</span>
                    </div>
                    <div className="text-xs border border-slate-400 px-2.5 py-0.5 rounded rotate-1 text-slate-500">
                      Export Ready
                    </div>
                  </div>

                </div>

              </div>
            </>
          )}

        </div>

        {/* Modal Bottom Sticky Action Bar */}
        {!isLoading && (
          <div className="no-print p-4 sm:p-5 border-t border-[#2E3440] bg-[#1A1E24] flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Left Counter & Cost */}
            <div className="text-xs text-[#D8DEE9] flex items-center gap-3">
              <span>
                Selected: <strong className="text-[#ECEFF4] font-mono">{selectedItems.length}</strong> of {items.length} notes
              </span>
              <span>•</span>
              <span>
                Est. Cost: <strong className="text-[#A3BE8C] font-mono">{city.currency?.split(' ')[0] || '₹'} {selectedTotalCost.toLocaleString()}</strong>
              </span>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2.5 rounded-xl bg-[#242933] hover:bg-[#2E3440] border border-[#3B4252] text-xs font-semibold text-[#D8DEE9] hover:text-white transition-colors flex items-center gap-1.5"
                title="Print notes or save as PDF"
              >
                <Printer className="w-4 h-4 text-[#88C0D0]" />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyNotes}
                className="px-3.5 py-2.5 rounded-xl bg-[#242933] hover:bg-[#2E3440] border border-[#3B4252] text-xs font-semibold text-[#D8DEE9] hover:text-white transition-colors flex items-center gap-1.5"
                title="Copy formatted notes to clipboard"
              >
                {isCopied ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-[#A3BE8C]" />
                    <span className="text-[#A3BE8C]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Notes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={selectedItems.length === 0}
                className="px-5 py-2.5 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] text-xs font-black transition-all shadow-glow flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply Notes to Itinerary Planner</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

