import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Plus, 
  Check, 
  Car, 
  Compass, 
  Loader2, 
  Utensils, 
  Camera, 
  Ticket, 
  Hotel
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { askTourConcierge, type ConciergePlaceSuggestion } from '../../services/geminiService';
import type { ActivityCategory } from '../../types/travel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestedPlaces?: ConciergePlaceSuggestion[];
  timestamp: string;
}

export const FloatingAITourConcierge: React.FC = () => {
  const { activeTrip, selectedDay, addActivity } = useTrip();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addedPlaces, setAddedPlaces] = useState<Record<string, number>>({}); // id -> dayIndex added to
  const [targetDays, setTargetDays] = useState<Record<string, number>>({}); // id -> target day
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cityName = activeTrip?.cityName || 'Darjeeling';

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your dedicated ${cityName} Tour Concierge. I can suggest must-visit spots, hidden cafes, viewpoints, and transit timings. Ask me anything about your tour—any place I suggest can be added to your plan with one tap!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // If active city changes, reset to new city welcome
  useEffect(() => {
    if (activeTrip?.cityName) {
      setMessages([
        {
          id: `welcome-${activeTrip.cityName}`,
          role: 'assistant',
          text: `Hello! I am your dedicated ${activeTrip.cityName} Tour Concierge. Ask me to suggest places to visit, scenic cafes, sunset viewpoints, or transit timings. Any place I suggest can be added to your plan with one tap!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [activeTrip?.cityName]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading || !activeTrip?.city) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askTourConcierge(
        query,
        activeTrip.city,
        activeTrip.items,
        selectedDay,
        activeTrip.groupProfile
      );

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.replyText,
        suggestedPlaces: response.suggestedPlaces,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Concierge chat failed:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `I'm having a brief connection hitch, but I'm right here! Feel free to ask again about spots, restaurants, or routes in ${cityName}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Tap Add suggested place to tour plan
  const handleAddPlaceToTrip = (place: ConciergePlaceSuggestion, chosenDay: number) => {
    addActivity({
      dayIndex: chosenDay,
      time: place.suggestedTime || '14:00',
      title: place.title,
      location: place.location || `${place.title}, ${cityName}`,
      category: place.category || 'sightseeing',
      cost: place.cost || 0,
      notes: place.reason,
      openingHours: place.openingHours || '09:00 - 18:00',
      bestTimeToVisit: place.bestTimeToVisit,
      transitInfo: place.transitInfo,
    });

    setAddedPlaces(prev => ({ ...prev, [place.id]: chosenDay }));
  };

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case 'food':
        return <Utensils className="w-3.5 h-3.5 text-[#EBCB8B]" />;
      case 'sightseeing':
        return <Camera className="w-3.5 h-3.5 text-[#88C0D0]" />;
      case 'lodging':
        return <Hotel className="w-3.5 h-3.5 text-[#B48EAD]" />;
      case 'activity':
        return <Ticket className="w-3.5 h-3.5 text-[#A3BE8C]" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-[#81A1C1]" />;
    }
  };

  const QUICK_PROMPTS = [
    '🌅 Suggest a sunset spot',
    '☕ Best tea cafe or bakery',
    '🏔️ Must-visit local landmark',
    '🚗 Traffic/transit advice'
  ];

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50">
      
      {/* Floating Minimized Button - Sleek FAB that expands on hover without blocking content */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center p-2 rounded-full bg-[#242933]/95 hover:bg-[#2E3440] border border-[#88C0D0]/50 text-[#ECEFF4] shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 shadow-black/80 hover:shadow-[#88C0D0]/20"
          title={`Chat with your ${cityName} Tour Concierge`}
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#88C0D0] to-[#81A1C1] flex items-center justify-center text-[#1A1E24] shadow-md">
              <Sparkles className="w-4 h-4 text-[#1A1E24]" />
            </div>
            {/* Pulsing indicator */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A3BE8C] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A3BE8C]" />
            </span>
          </div>

          {/* Expandable Title on Hover */}
          <div className="text-left max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:px-2.5 transition-all duration-300 overflow-hidden whitespace-nowrap">
            <div className="text-xs font-black text-[#ECEFF4]">
              AI Tour Assistant
            </div>
            <div className="text-[10px] text-[#88C0D0] font-medium">
              {cityName} Concierge
            </div>
          </div>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-24px)] max-w-[410px] h-[520px] max-h-[82vh] bg-[#242933] border border-[#3B4252] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-[#1A1E24] border-b border-[#2E3440] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#88C0D0]/20 text-[#88C0D0]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#ECEFF4] flex items-center gap-1.5">
                  <span>{cityName} Tour Concierge</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#A3BE8C]/20 text-[#A3BE8C]">
                    Tour Only
                  </span>
                </h4>
                <p className="text-[10px] text-[#D8DEE9]/70">
                  Ask for spots & add to your tour with 1 tap
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-[#D8DEE9]/70 hover:text-white hover:bg-[#3B4252] transition-colors"
              title="Minimize chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Exclusive Tour Guardrail Banner */}
          <div className="px-3.5 py-1.5 bg-[#88C0D0]/10 border-b border-[#88C0D0]/20 flex items-center gap-1.5 text-[10px] text-[#88C0D0] font-medium shrink-0">
            <Compass className="w-3 h-3 text-[#88C0D0] shrink-0" />
            <span className="truncate">Exclusively chats about your {cityName} tour & itinerary</span>
          </div>

          {/* Messages Scrollable Area */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 scrollbar-thin text-left">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#88C0D0] text-[#1A1E24] font-medium shadow-sm'
                      : 'bg-[#1A1E24] text-[#ECEFF4] border border-[#3B4252] shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* If assistant returned suggested places, render 1-tap interactive cards */}
                  {msg.suggestedPlaces && msg.suggestedPlaces.length > 0 && (
                    <div className="w-full space-y-2 pt-1">
                      {msg.suggestedPlaces.map((place) => {
                        const targetDay = targetDays[place.id] || selectedDay;
                        const addedToDay = addedPlaces[place.id];
                        const isAdded = addedToDay !== undefined;

                        return (
                          <div 
                            key={place.id}
                            className="p-3 rounded-2xl bg-[#1A1E24] border border-[#88C0D0]/40 space-y-2 shadow-md hover:border-[#88C0D0] transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="p-1 rounded-lg bg-[#242933] shrink-0">
                                  {getCategoryIcon(place.category)}
                                </div>
                                <h5 className="text-xs font-bold text-[#ECEFF4] truncate">
                                  {place.title}
                                </h5>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-mono font-bold text-[#A3BE8C]">
                                  {place.cost === 0 ? 'Free' : `${activeTrip.currency?.split(' ')[0] || '₹'} ${place.cost}`}
                                </span>
                              </div>
                            </div>

                            {/* Reason / Advice */}
                            <p className="text-[11px] text-[#D8DEE9] leading-snug">
                              {place.reason}
                            </p>

                            {/* Transit advice note */}
                            {place.transitInfo && (
                              <div className="text-[10px] text-[#81A1C1] flex items-center gap-1">
                                <Car className="w-3 h-3 text-[#81A1C1] shrink-0" />
                                <span className="truncate">{place.transitInfo}</span>
                              </div>
                            )}

                            {/* 1-Tap Add Action Bar */}
                            <div className="pt-2 border-t border-[#2E3440] flex items-center justify-between gap-2">
                              {/* Day Selector */}
                              <div className="flex items-center gap-1 text-[10px] text-[#D8DEE9]">
                                <span>Day:</span>
                                <select
                                  value={targetDay}
                                  disabled={isAdded}
                                  onChange={(e) => setTargetDays(prev => ({ ...prev, [place.id]: Number(e.target.value) }))}
                                  className="bg-[#242933] border border-[#3B4252] rounded-lg px-2 py-0.5 text-xs text-[#ECEFF4] font-semibold focus:outline-none cursor-pointer disabled:opacity-50"
                                >
                                  {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((d) => (
                                    <option key={d} value={d}>Day {d}</option>
                                  ))}
                                </select>
                              </div>

                              {/* 1-Tap Add Button */}
                              <button
                                type="button"
                                disabled={isAdded}
                                onClick={() => handleAddPlaceToTrip(place, targetDay)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                  isAdded
                                    ? 'bg-[#A3BE8C]/20 border border-[#A3BE8C]/40 text-[#A3BE8C] cursor-default'
                                    : 'bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] shadow-glow active:scale-95'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#A3BE8C] stroke-[3]" />
                                    <span>Added to Day {addedToDay}!</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5 text-[#1A1E24] stroke-[3]" />
                                    <span>Add to Day {targetDay}</span>
                                  </>
                                )}
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                  <span className="text-[9px] text-[#D8DEE9]/50 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Bouncing typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#1A1E24] border border-[#3B4252] w-fit text-xs text-[#88C0D0]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[11px]">Thinking of the best spots for your tour...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-3 pt-2 pb-1 bg-[#1A1E24]/60 border-t border-[#2E3440] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-xl bg-[#242933] hover:bg-[#2E3440] border border-[#3B4252] text-[10px] text-[#D8DEE9] hover:text-[#ECEFF4] whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#1A1E24] border-t border-[#2E3440] shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask to suggest a place for your trip..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#242933] border border-[#3B4252] text-[#ECEFF4] placeholder-[#4C566A] text-xs focus:outline-none focus:ring-1 focus:ring-[#88C0D0] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputQuery.trim()}
                className="p-2.5 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] transition-all disabled:opacity-40 shrink-0 shadow-sm active:scale-95"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5 text-[#1A1E24]" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
