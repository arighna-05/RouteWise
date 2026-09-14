import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Baby, 
  UserCheck, 
  ChevronDown, 
  Plus, 
  Minus, 
  Sparkles, 
  X, 
  HeartHandshake,
  Check
} from 'lucide-react';
import { useViewMode } from '../../context/ViewModeContext';
import type { FamilyMember } from '../../types/travel';

interface FamilyMembersSelectorProps {
  members: FamilyMember[];
  onChange: (members: FamilyMember[]) => void;
  className?: string;
  compact?: boolean;
}

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'adult-1', type: 'adult', age: 32, label: 'Adult 1' },
  { id: 'adult-2', type: 'adult', age: 30, label: 'Adult 2' },
];

export const getMembersSummary = (members: FamilyMember[]): string => {
  if (!members || members.length === 0) return 'Select Family Members';

  const adults = members.filter(m => m.type === 'adult');
  const children = members.filter(m => m.type === 'child');
  const seniors = members.filter(m => m.type === 'senior');

  const parts: string[] = [];

  if (adults.length > 0) {
    parts.push(`${adults.length} ${adults.length === 1 ? 'Adult' : 'Adults'}`);
  }

  if (children.length > 0) {
    if (children.length === 1) {
      parts.push(`1 Child (${children[0].age}y)`);
    } else {
      const ages = children.map(c => `${c.age}y`).join(', ');
      parts.push(`${children.length} Kids (${ages})`);
    }
  }

  if (seniors.length > 0) {
    if (seniors.length === 1) {
      parts.push(`1 Senior (${seniors[0].age}y)`);
    } else {
      const ages = seniors.map(s => `${s.age}y`).join(', ');
      parts.push(`${seniors.length} Seniors (${ages})`);
    }
  }

  return parts.join(', ');
};

export const getDerivedAgeGroup = (members: FamilyMember[]): string => {
  const hasChildren = members.some(m => m.type === 'child');
  const hasSeniors = members.some(m => m.type === 'senior');
  const adultsOnly = !hasChildren && !hasSeniors;

  if (hasChildren && hasSeniors) {
    const childAges = members.filter(m => m.type === 'child').map(c => `${c.age}y`).join(', ');
    const seniorAges = members.filter(m => m.type === 'senior').map(s => `${s.age}y`).join(', ');
    return `Multi-Gen Family (Kids: ${childAges}, Seniors: ${seniorAges})`;
  }

  if (hasChildren) {
    const childAges = members.filter(m => m.type === 'child').map(c => `${c.age}y`).join(', ');
    return `Family with Children (${childAges})`;
  }

  if (hasSeniors) {
    const seniorAges = members.filter(m => m.type === 'senior').map(s => `${s.age}y`).join(', ');
    return `Seniors Group (${seniorAges})`;
  }

  if (adultsOnly) {
    if (members.length === 1) return 'Solo Traveler';
    if (members.length === 2) return 'Couple / 2 Adults';
    return `Adult Group (${members.length} Adults)`;
  }

  return 'Family / Friends Group';
};

// All ages arrays so every single age is selectable
const ALL_ADULT_AGES = Array.from({ length: 47 }, (_, i) => 18 + i); // 18 to 64
const ALL_CHILD_AGES = Array.from({ length: 18 }, (_, i) => i); // 0 to 17
const ALL_SENIOR_AGES = Array.from({ length: 36 }, (_, i) => 65 + i); // 65 to 100

export const FamilyMembersSelector: React.FC<FamilyMembersSelectorProps> = ({
  members = DEFAULT_FAMILY_MEMBERS,
  onChange,
  className = '',
  compact = false,
}) => {
  const { isMobileView } = useViewMode();
  const [isOpen, setIsOpen] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const adults = members.filter(m => m.type === 'adult');
  const children = members.filter(m => m.type === 'child');
  const seniors = members.filter(m => m.type === 'senior');

  // Adults counter
  const handleUpdateAdultsCount = (delta: number) => {
    const newCount = Math.max(1, Math.min(12, adults.length + delta));
    if (newCount === adults.length) return;

    if (delta > 0) {
      const newAdult: FamilyMember = {
        id: `adult-${Date.now()}-${adults.length + 1}`,
        type: 'adult',
        age: 30,
        label: `Adult ${adults.length + 1}`,
      };
      onChange([...members, newAdult]);
    } else {
      let removed = false;
      const updated = members.filter(m => {
        if (!removed && m.type === 'adult' && m.id === adults[adults.length - 1].id) {
          removed = true;
          return false;
        }
        return true;
      });
      onChange(updated);
    }
  };

  // Adult Age Update
  const handleUpdateAdultAge = (id: string, age: number) => {
    const clamped = Math.max(18, Math.min(64, age));
    onChange(members.map(m => (m.id === id ? { ...m, age: clamped } : m)));
  };

  // Children counter
  const handleUpdateChildrenCount = (delta: number) => {
    const newCount = Math.max(0, Math.min(10, children.length + delta));
    if (newCount === children.length) return;

    if (delta > 0) {
      const defaultAge = children.length === 0 ? 6 : children.length === 1 ? 10 : 8;
      const newChild: FamilyMember = {
        id: `child-${Date.now()}-${children.length + 1}`,
        type: 'child',
        age: defaultAge,
        label: `Child ${children.length + 1}`,
      };
      onChange([...members, newChild]);
    } else {
      let removed = false;
      const updated = members.filter(m => {
        if (!removed && m.type === 'child' && m.id === children[children.length - 1].id) {
          removed = true;
          return false;
        }
        return true;
      });
      onChange(updated);
    }
  };

  // Child Age Update
  const handleUpdateChildAge = (id: string, age: number) => {
    const clamped = Math.max(0, Math.min(17, age));
    onChange(members.map(m => (m.id === id ? { ...m, age: clamped } : m)));
  };

  // Seniors counter
  const handleUpdateSeniorsCount = (delta: number) => {
    const newCount = Math.max(0, Math.min(8, seniors.length + delta));
    if (newCount === seniors.length) return;

    if (delta > 0) {
      const newSenior: FamilyMember = {
        id: `senior-${Date.now()}-${seniors.length + 1}`,
        type: 'senior',
        age: 68,
        label: `Senior ${seniors.length + 1}`,
      };
      onChange([...members, newSenior]);
    } else {
      let removed = false;
      const updated = members.filter(m => {
        if (!removed && m.type === 'senior' && m.id === seniors[seniors.length - 1].id) {
          removed = true;
          return false;
        }
        return true;
      });
      onChange(updated);
    }
  };

  // Senior Age Update
  const handleUpdateSeniorAge = (id: string, age: number) => {
    const clamped = Math.max(65, Math.min(100, age));
    onChange(members.map(m => (m.id === id ? { ...m, age: clamped } : m)));
  };

  // Quick Preset Handlers
  const handleApplyPreset = (type: 'solo' | 'couple' | 'family1' | 'family2' | 'multigen' | 'seniors') => {
    let preset: FamilyMember[] = [];
    switch (type) {
      case 'solo':
        preset = [{ id: 'a1', type: 'adult', age: 28, label: 'Adult 1' }];
        break;
      case 'couple':
        preset = [
          { id: 'a1', type: 'adult', age: 30, label: 'Adult 1' },
          { id: 'a2', type: 'adult', age: 32, label: 'Adult 2' },
        ];
        break;
      case 'family1':
        preset = [
          { id: 'a1', type: 'adult', age: 34, label: 'Adult 1' },
          { id: 'a2', type: 'adult', age: 32, label: 'Adult 2' },
          { id: 'c1', type: 'child', age: 6, label: 'Child 1' },
        ];
        break;
      case 'family2':
        preset = [
          { id: 'a1', type: 'adult', age: 36, label: 'Adult 1' },
          { id: 'a2', type: 'adult', age: 34, label: 'Adult 2' },
          { id: 'c1', type: 'child', age: 7, label: 'Child 1' },
          { id: 'c2', type: 'child', age: 11, label: 'Child 2' },
        ];
        break;
      case 'multigen':
        preset = [
          { id: 'a1', type: 'adult', age: 38, label: 'Adult 1' },
          { id: 'a2', type: 'adult', age: 36, label: 'Adult 2' },
          { id: 'c1', type: 'child', age: 8, label: 'Child 1' },
          { id: 's1', type: 'senior', age: 68, label: 'Senior 1' },
        ];
        break;
      case 'seniors':
        preset = [
          { id: 's1', type: 'senior', age: 68, label: 'Senior 1' },
          { id: 's2', type: 'senior', age: 70, label: 'Senior 2' },
        ];
        break;
    }
    onChange(preset);
  };

  const summary = getMembersSummary(members);
  const totalCount = members.length;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full px-3.5 py-2.5 rounded-xl border ${
          isMobileView
            ? isOpen
              ? 'border-[#5D5FEF] ring-2 ring-[#5D5FEF]/20 bg-white text-[#1A1D2E]'
              : 'border-[#E2E6F0] hover:border-[#5D5FEF] bg-white text-[#1A1D2E] shadow-sm'
            : isOpen
              ? 'border-[#88C0D0] ring-2 ring-[#88C0D0]/30 bg-[#1A1E24] text-[#ECEFF4]'
              : 'border-[#3B4252] hover:border-[#81A1C1] bg-[#1A1E24] text-[#ECEFF4]'
        } text-xs transition-all flex items-center justify-between text-left group select-none shadow-sm`}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            isMobileView
              ? 'bg-[#EEF0FF] text-[#5D5FEF] group-hover:bg-[#5D5FEF] group-hover:text-white'
              : 'bg-[#88C0D0]/15 text-[#88C0D0] group-hover:bg-[#88C0D0] group-hover:text-[#1A1E24]'
          }`}>
            {children.length > 0 ? (
              <Baby className="w-3.5 h-3.5" />
            ) : seniors.length > 0 ? (
              <HeartHandshake className="w-3.5 h-3.5" />
            ) : (
              <Users className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="truncate">
            <div className={`font-bold text-xs truncate ${isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'}`}>
              {summary}
            </div>
            {!compact && (
              <div className={`text-[10px] truncate ${isMobileView ? 'text-[#7E859B]' : 'text-[#81A1C1]'}`}>
                {totalCount} {totalCount === 1 ? 'Traveler' : 'Total Heads'} • Tap to customize ages
              </div>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${
            isOpen
              ? isMobileView ? 'rotate-180 text-[#5D5FEF]' : 'rotate-180 text-[#88C0D0]'
              : isMobileView ? 'text-[#94A3B8] group-hover:text-[#1A1D2E]' : 'text-[#81A1C1] group-hover:text-[#ECEFF4]'
          }`}
        />
      </button>

      {/* Centered Modal Overlay via Portal to prevent clipping */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div 
            className={`relative w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left border ${
              isMobileView
                ? 'bg-white border-[#E2E6F0] text-[#1A1D2E]'
                : 'bg-[#242933] border-[#3B4252] text-[#ECEFF4]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b flex items-start justify-between shrink-0 ${
              isMobileView
                ? 'bg-[#F8FAFC] border-[#E8ECF5]'
                : 'bg-[#1A1E24]/60 border-[#2E3440]'
            }`}>
              <div>
                <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${
                  isMobileView ? 'text-[#1A1D2E]' : 'text-[#ECEFF4]'
                }`}>
                  <Users className={`w-5 h-5 ${isMobileView ? 'text-[#5D5FEF]' : 'text-[#88C0D0]'}`} />
                  <span>Family Members & Ages</span>
                </h3>
                <p className={`text-xs mt-1 ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]/80'}`}>
                  Adjust traveler counts and specify exact ages so activities, pacing, and vehicle transit fit everyone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-xl transition-colors ml-2 ${
                  isMobileView
                    ? 'text-[#7E859B] hover:text-[#1A1D2E] hover:bg-[#EEF0FF]'
                    : 'text-[#D8DEE9]/70 hover:text-white hover:bg-[#3B4252]'
                }`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              
              {/* Quick Presets */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#81A1C1] flex items-center justify-between">
                  <span>Quick Presets</span>
                  <span className="text-[10px] lowercase text-[#D8DEE9]/50 font-normal">tap to apply</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('couple')}
                    className="px-3 py-2 rounded-xl bg-[#1A1E24] hover:bg-[#2E3440] border border-[#3B4252] text-[#ECEFF4] text-xs font-semibold transition-all text-left flex items-center gap-1.5"
                  >
                    <span>👫 Couple (2)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('family1')}
                    className="px-3 py-2 rounded-xl bg-[#1A1E24] hover:bg-[#2E3440] border border-[#3B4252] text-[#88C0D0] text-xs font-semibold transition-all text-left flex items-center gap-1.5"
                  >
                    <span>👨‍👩‍👧 1 Kid (6y)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('family2')}
                    className="px-3 py-2 rounded-xl bg-[#1A1E24] hover:bg-[#2E3440] border border-[#3B4252] text-[#88C0D0] text-xs font-semibold transition-all text-left flex items-center gap-1.5"
                  >
                    <span>👨‍👩‍👦‍👦 2 Kids (7, 11y)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('multigen')}
                    className="px-3 py-2 rounded-xl bg-[#1A1E24] hover:bg-[#2E3440] border border-[#3B4252] text-[#EBCB8B] text-xs font-semibold transition-all text-left flex items-center gap-1.5"
                  >
                    <span>🏡 Multi-Gen (4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('seniors')}
                    className="px-3 py-2 rounded-xl bg-[#1A1E24] hover:bg-[#2E3440] border border-[#3B4252] text-[#EBCB8B] text-xs font-semibold transition-all text-left flex items-center gap-1.5"
                  >
                    <span>👴 Elders (2)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('solo')}
                    className="px-3 py-2 rounded-xl bg-[#1A1E24] hover:bg-[#2E3440] border border-[#3B4252] text-[#D8DEE9] text-xs font-semibold transition-all text-left flex items-center gap-1.5"
                  >
                    <span>👤 Solo Traveler</span>
                  </button>
                </div>
              </div>

              {/* 1. Adults Section */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#1A1E24]/70 border border-[#2E3440]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#88C0D0]/15 flex items-center justify-center text-[#88C0D0]">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#ECEFF4]">
                        Adults
                      </div>
                      <div className="text-[10px] text-[#D8DEE9]/70">Ages 18 to 64</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#242933] px-2.5 py-1 rounded-xl border border-[#3B4252]">
                    <button
                      type="button"
                      onClick={() => handleUpdateAdultsCount(-1)}
                      disabled={adults.length <= 1}
                      className="w-7 h-7 rounded-lg bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 disabled:cursor-not-allowed text-[#ECEFF4] flex items-center justify-center transition-colors font-bold"
                      title="Remove an adult"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center font-mono font-black text-sm text-[#ECEFF4]">
                      {adults.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateAdultsCount(1)}
                      disabled={adults.length >= 12}
                      className="w-7 h-7 rounded-lg bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 disabled:cursor-not-allowed text-[#ECEFF4] flex items-center justify-center transition-colors font-bold"
                      title="Add an adult"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Adult Age Selectors - Every age 18-64 available with +/- steppers */}
                <div className="space-y-2 pt-2 border-t border-[#2E3440]/60">
                  <div className="text-[10px] font-bold text-[#81A1C1] uppercase tracking-wider">
                    Select Exact Age for each Adult:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {adults.map((adult, idx) => (
                      <div
                        key={adult.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#242933] border border-[#3B4252]/80"
                      >
                        <span className="text-xs font-semibold text-[#ECEFF4] whitespace-nowrap">
                          Adult {idx + 1}
                        </span>

                        <div className="flex items-center gap-1 bg-[#1A1E24] px-1.5 py-1 rounded-lg border border-[#3B4252]">
                          <button
                            type="button"
                            onClick={() => handleUpdateAdultAge(adult.id, adult.age - 1)}
                            disabled={adult.age <= 18}
                            className="w-5 h-5 rounded bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 text-[#D8DEE9] flex items-center justify-center"
                            title="Decrease age by 1"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>

                          <select
                            value={adult.age}
                            onChange={(e) => handleUpdateAdultAge(adult.id, Number(e.target.value))}
                            className="bg-transparent text-xs font-mono font-bold text-[#88C0D0] px-1 outline-none cursor-pointer text-center"
                          >
                            {ALL_ADULT_AGES.map(age => (
                              <option key={age} value={age} className="bg-[#242933] text-[#ECEFF4]">
                                {age} yrs
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleUpdateAdultAge(adult.id, adult.age + 1)}
                            disabled={adult.age >= 64}
                            className="w-5 h-5 rounded bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 text-[#D8DEE9] flex items-center justify-center"
                            title="Increase age by 1"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Children Section */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#1A1E24]/70 border border-[#2E3440]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#88C0D0]/15 flex items-center justify-center text-[#88C0D0]">
                      <Baby className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#ECEFF4]">
                        Children
                      </div>
                      <div className="text-[10px] text-[#D8DEE9]/70">Ages 0 to 17</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#242933] px-2.5 py-1 rounded-xl border border-[#3B4252]">
                    <button
                      type="button"
                      onClick={() => handleUpdateChildrenCount(-1)}
                      disabled={children.length <= 0}
                      className="w-7 h-7 rounded-lg bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 disabled:cursor-not-allowed text-[#ECEFF4] flex items-center justify-center transition-colors font-bold"
                      title="Remove a child"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center font-mono font-black text-sm text-[#ECEFF4]">
                      {children.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateChildrenCount(1)}
                      disabled={children.length >= 10}
                      className="w-7 h-7 rounded-lg bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 disabled:cursor-not-allowed text-[#ECEFF4] flex items-center justify-center transition-colors font-bold"
                      title="Add a child"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {children.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#2E3440]/60">
                    <div className="text-[10px] font-bold text-[#88C0D0] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Select Exact Age for each Child:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {children.map((child, idx) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#242933] border border-[#3B4252]/80"
                        >
                          <div>
                            <span className="text-xs font-semibold text-[#ECEFF4] whitespace-nowrap">
                              Child {idx + 1}
                            </span>
                            <div className="text-[9px] text-[#A3BE8C]">
                              {child.age <= 1 ? '🍼 Infant' : child.age <= 4 ? '🧸 Toddler' : child.age <= 11 ? '🎒 Kid' : '🎧 Teen'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-[#1A1E24] px-1.5 py-1 rounded-lg border border-[#3B4252]">
                            <button
                              type="button"
                              onClick={() => handleUpdateChildAge(child.id, child.age - 1)}
                              disabled={child.age <= 0}
                              className="w-5 h-5 rounded bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 text-[#D8DEE9] flex items-center justify-center"
                              title="Decrease age by 1"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>

                            <select
                              value={child.age}
                              onChange={(e) => handleUpdateChildAge(child.id, Number(e.target.value))}
                              className="bg-transparent text-xs font-mono font-bold text-[#88C0D0] px-1 outline-none cursor-pointer text-center"
                            >
                              {ALL_CHILD_AGES.map(age => (
                                <option key={age} value={age} className="bg-[#242933] text-[#ECEFF4]">
                                  {age === 0 ? '< 1 yr (Infant)' : `${age} yrs`}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleUpdateChildAge(child.id, child.age + 1)}
                              disabled={child.age >= 17}
                              className="w-5 h-5 rounded bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 text-[#D8DEE9] flex items-center justify-center"
                              title="Increase age by 1"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Seniors Section */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#1A1E24]/70 border border-[#2E3440]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EBCB8B]/15 flex items-center justify-center text-[#EBCB8B]">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#ECEFF4]">
                        Seniors / Elders
                      </div>
                      <div className="text-[10px] text-[#D8DEE9]/70">Ages 65 to 100</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#242933] px-2.5 py-1 rounded-xl border border-[#3B4252]">
                    <button
                      type="button"
                      onClick={() => handleUpdateSeniorsCount(-1)}
                      disabled={seniors.length <= 0}
                      className="w-7 h-7 rounded-lg bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 disabled:cursor-not-allowed text-[#ECEFF4] flex items-center justify-center transition-colors font-bold"
                      title="Remove a senior"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center font-mono font-black text-sm text-[#ECEFF4]">
                      {seniors.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateSeniorsCount(1)}
                      disabled={seniors.length >= 8}
                      className="w-7 h-7 rounded-lg bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 disabled:cursor-not-allowed text-[#ECEFF4] flex items-center justify-center transition-colors font-bold"
                      title="Add a senior"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {seniors.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#2E3440]/60">
                    <div className="text-[10px] font-bold text-[#EBCB8B] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Select Exact Age for each Senior:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {seniors.map((senior, idx) => (
                        <div
                          key={senior.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#242933] border border-[#3B4252]/80"
                        >
                          <span className="text-xs font-semibold text-[#ECEFF4] whitespace-nowrap">
                            Senior {idx + 1}
                          </span>

                          <div className="flex items-center gap-1 bg-[#1A1E24] px-1.5 py-1 rounded-lg border border-[#3B4252]">
                            <button
                              type="button"
                              onClick={() => handleUpdateSeniorAge(senior.id, senior.age - 1)}
                              disabled={senior.age <= 65}
                              className="w-5 h-5 rounded bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 text-[#D8DEE9] flex items-center justify-center"
                              title="Decrease age by 1"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>

                            <select
                              value={senior.age}
                              onChange={(e) => handleUpdateSeniorAge(senior.id, Number(e.target.value))}
                              className="bg-transparent text-xs font-mono font-bold text-[#EBCB8B] px-1 outline-none cursor-pointer text-center"
                            >
                              {ALL_SENIOR_AGES.map(age => (
                                <option key={age} value={age} className="bg-[#242933] text-[#ECEFF4]">
                                  {age} yrs
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleUpdateSeniorAge(senior.id, senior.age + 1)}
                              disabled={senior.age >= 100}
                              className="w-5 h-5 rounded bg-[#2E3440] hover:bg-[#3B4252] disabled:opacity-30 text-[#D8DEE9] flex items-center justify-center"
                              title="Increase age by 1"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Sticky Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#2E3440] bg-[#1A1E24]/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-[#ECEFF4] font-medium text-center sm:text-left">
                <span className="font-bold text-[#88C0D0]">{totalCount} {totalCount === 1 ? 'Traveler' : 'Travelers'}</span>
                <span className="text-[#D8DEE9]/60 mx-1.5">•</span>
                <span className="text-[#D8DEE9]/80">{getDerivedAgeGroup(members)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] font-extrabold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Apply Members</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
