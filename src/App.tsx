import React, { useState } from 'react';
import { TripProvider, useTrip } from './context/TripContext';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { Navbar } from './components/layout/Navbar';
import { DestinationSearchHero } from './components/search/DestinationSearchHero';
import { CityHero } from './components/dashboard/CityHero';
import { AttractionRecommendations } from './components/recommendations/AttractionRecommendations';
import { ItineraryTimeline } from './components/itinerary/ItineraryTimeline';
import { AddTourPlanSection } from './components/itinerary/AddTourPlanSection';
import { TravelExpenseCalculator } from './components/expense/TravelExpenseCalculator';
import { FloatingAITourConcierge } from './components/assistant/FloatingAITourConcierge';
import { Calendar, Compass, ArrowRight, CalendarPlus, Calculator } from 'lucide-react';

export type AppSection = 'addPlan' | 'schedule' | 'attractions' | 'expenses';

const MainContent: React.FC = () => {
  const { isSearchMode, setIsSearchMode, activeTrip } = useTrip();
  const { isMobileView } = useViewMode();
  const [activeSection, setActiveSection] = useState<AppSection>('schedule');

  const handleSelectSection = (section: AppSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={
      isMobileView 
        ? "min-h-screen flex flex-col matte-mobile-bg text-[#1A1D2E] selection:bg-[#5D5FEF] selection:text-white" 
        : "min-h-screen flex flex-col bg-[#1A1E24] text-[#E5E9F0] selection:bg-[#88C0D0] selection:text-[#1A1E24]"
    }>
      {/* Top Header: Mobile modern header vs Desktop Navbar */}
      {isMobileView ? (
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-[#E8ECF5] px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left: Avatar & Greeting */}
            <button
              type="button"
              onClick={() => setIsSearchMode(true)}
              className="flex items-center gap-2.5 text-left cursor-pointer"
              title="Go to RouteWise Home"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#88C0D0] flex items-center justify-center text-white font-black text-sm shadow-sm">
                RW
              </div>
              <div>
                <span className="block text-[11px] font-medium text-[#7E859B]">Welcome to</span>
                <h2 className="text-sm font-black text-[#1A1D2E] leading-tight">
                  {isSearchMode ? 'RouteWise Planner' : `${activeTrip.cityName || 'RouteWise'} Trip`}
                </h2>
              </div>
            </button>

            {/* Right: Search / Switch Destination Pill */}
            <button
              type="button"
              onClick={() => setIsSearchMode(!isSearchMode)}
              className="px-3 py-1.5 rounded-full bg-[#F4F6FB] border border-[#E2E6F0] flex items-center gap-1.5 text-xs font-bold text-[#5D5FEF] hover:bg-[#EEF0FF] transition-colors shadow-sm"
              title={isSearchMode ? "Return to planning" : "Search other destinations"}
            >
              {isSearchMode ? (
                <>
                  <span className="text-[11px]">Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Search</span>
                </>
              )}
            </button>
          </div>
        </header>
      ) : (
        <Navbar />
      )}

      {/* Main Container */}
      <main className={`flex-1 max-w-6xl w-full mx-auto ${isMobileView ? 'px-3 py-4 pb-28' : 'px-4 sm:px-6 lg:px-8 py-6 pb-28'}`}>
        {isSearchMode ? (
          /* Step 1: Destination Search View (Always opens first on launch) */
          <DestinationSearchHero />
        ) : (
          /* Step 2: Planning Workspace with 4 Unclustered Dedicated Sections */
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Destination Hero Header with Local Time & Dates */}
            <CityHero />

            {/* Top Switcher Navigation - 4 Clear Dedicated Sections */}
            {isMobileView ? (
              <div className="p-1.5 rounded-2xl bg-white/90 border border-[#E2E6F0] shadow-sm backdrop-blur-md grid grid-cols-4 gap-1">
                {/* 1. Add Tour Plans */}
                <button
                  type="button"
                  onClick={() => handleSelectSection('addPlan')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
                    activeSection === 'addPlan'
                      ? 'bg-[#5D5FEF] text-white shadow-sm font-extrabold'
                      : 'text-[#67708A] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                  }`}
                >
                  <CalendarPlus className="w-4 h-4 mb-0.5" />
                  <span className="truncate">Add Plan</span>
                </button>

                {/* 2. Day-wise Schedule */}
                <button
                  type="button"
                  onClick={() => handleSelectSection('schedule')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all relative ${
                    activeSection === 'schedule'
                      ? 'bg-[#5D5FEF] text-white shadow-sm font-extrabold'
                      : 'text-[#67708A] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                  }`}
                >
                  <Calendar className="w-4 h-4 mb-0.5" />
                  <span className="truncate">Schedule</span>
                  {activeTrip.items.length > 0 && (
                    <span className={`absolute top-1 right-1 px-1 rounded-full text-[8px] font-mono ${
                      activeSection === 'schedule' ? 'bg-white/30 text-white' : 'bg-[#5D5FEF]/10 text-[#5D5FEF]'
                    }`}>
                      {activeTrip.items.length}
                    </span>
                  )}
                </button>

                {/* 3. Attractions */}
                <button
                  type="button"
                  onClick={() => handleSelectSection('attractions')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
                    activeSection === 'attractions'
                      ? 'bg-[#5D5FEF] text-white shadow-sm font-extrabold'
                      : 'text-[#67708A] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                  }`}
                >
                  <Compass className="w-4 h-4 mb-0.5 text-[#EBCB8B]" />
                  <span className="truncate">Attractions</span>
                </button>

                {/* 4. Expenses */}
                <button
                  type="button"
                  onClick={() => handleSelectSection('expenses')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
                    activeSection === 'expenses'
                      ? 'bg-[#5D5FEF] text-white shadow-sm font-extrabold'
                      : 'text-[#67708A] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                  }`}
                >
                  <Calculator className="w-4 h-4 mb-0.5 text-[#00BA88]" />
                  <span className="truncate">Expenses</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#242933]/90 border border-[#3B4252] backdrop-blur-md">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 1. Add Tour Plans */}
                  <button
                    type="button"
                    onClick={() => handleSelectSection('addPlan')}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                      activeSection === 'addPlan'
                        ? 'bg-[#88C0D0] text-[#1A1E24] shadow-glow font-extrabold'
                        : 'text-[#D8DEE9] hover:text-white hover:bg-[#2E3440]'
                    }`}
                  >
                    <CalendarPlus className="w-4 h-4 shrink-0" />
                    <span>Add Tour Plans</span>
                  </button>

                  {/* 2. Day-wise Schedule */}
                  <button
                    type="button"
                    onClick={() => handleSelectSection('schedule')}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                      activeSection === 'schedule'
                        ? 'bg-[#88C0D0] text-[#1A1E24] shadow-glow font-extrabold'
                        : 'text-[#D8DEE9] hover:text-white hover:bg-[#2E3440]'
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Day-wise Schedule</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                      activeSection === 'schedule' ? 'bg-[#1A1E24]/25 text-[#1A1E24]' : 'bg-[#1A1E24] text-[#88C0D0]'
                    }`}>
                      {activeTrip.items.length}
                    </span>
                  </button>

                  {/* 3. Attractions */}
                  <button
                    type="button"
                    onClick={() => handleSelectSection('attractions')}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                      activeSection === 'attractions'
                        ? 'bg-[#88C0D0] text-[#1A1E24] shadow-glow font-extrabold'
                        : 'text-[#D8DEE9] hover:text-white hover:bg-[#2E3440]'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-[#EBCB8B] shrink-0" />
                    <span>Tourist Attractions</span>
                  </button>

                  {/* 4. Expenses */}
                  <button
                    type="button"
                    onClick={() => handleSelectSection('expenses')}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                      activeSection === 'expenses'
                        ? 'bg-[#88C0D0] text-[#1A1E24] shadow-glow font-extrabold'
                        : 'text-[#D8DEE9] hover:text-white hover:bg-[#2E3440]'
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-[#A3BE8C] shrink-0" />
                    <span>Expense Calculator</span>
                  </button>
                </div>
              </div>
            )}

            {/* Section 1: Add Tour Plans */}
            {activeSection === 'addPlan' && (
              <AddTourPlanSection 
                onViewSchedule={() => handleSelectSection('schedule')}
                onOpenAttractions={() => handleSelectSection('attractions')}
              />
            )}

            {/* Section 2: Day-wise Schedule */}
            {activeSection === 'schedule' && (
              <ItineraryTimeline 
                onOpenAddPlan={() => handleSelectSection('addPlan')}
                onOpenAttractions={() => handleSelectSection('attractions')}
              />
            )}

            {/* Section 3: Tourist Attractions */}
            {activeSection === 'attractions' && (
              <div className="space-y-6">
                <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isMobileView 
                    ? 'matte-card text-[#1A1D2E]' 
                    : 'glass-card border-[#3B4252] text-[#ECEFF4]'
                }`}>
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <span>🏛️ Tourist Attractions in {activeTrip.cityName}</span>
                    </h3>
                    <p className={`text-xs mt-1 ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]/80'}`}>
                      Browse top attractions and recommendations. Click "+ Add to Day" on any spot to automatically schedule it with terrain-aware travel times.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSection('addPlan')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm border ${
                        isMobileView
                          ? 'border-[#E2E6F0] bg-white text-[#1A1D2E] hover:bg-[#F4F6FB]'
                          : 'border-[#3B4252] bg-[#1A1E24] text-[#ECEFF4] hover:bg-[#2E3440]'
                      }`}
                    >
                      Add Custom Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSection('schedule')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm ${
                        isMobileView
                          ? 'bg-[#5D5FEF] text-white hover:bg-[#4D4FD9]'
                          : 'bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24]'
                      }`}
                    >
                      View Schedule
                    </button>
                  </div>
                </div>

                <AttractionRecommendations />
              </div>
            )}

            {/* Section 4: Expense Calculator */}
            {activeSection === 'expenses' && (
              <div className="space-y-6">
                <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isMobileView 
                    ? 'matte-card text-[#1A1D2E]' 
                    : 'glass-card border-[#3B4252] text-[#ECEFF4]'
                }`}>
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <span>💳 Travel Expense Calculator</span>
                    </h3>
                    <p className={`text-xs mt-1 ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]/80'}`}>
                      Detailed budget calculations for {activeTrip.cityName}, including lodging, transit, dining, and activities.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectSection('schedule')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm ${
                      isMobileView
                        ? 'bg-[#5D5FEF] text-white hover:bg-[#4D4FD9]'
                        : 'bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24]'
                    }`}
                  >
                    View Schedule
                  </button>
                </div>

                <TravelExpenseCalculator />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating AI Tour Concierge (bottom-right) */}
      {!isSearchMode && <FloatingAITourConcierge />}

      {/* Mobile Floating Bottom Navigation Bar (4 Dedicated Tabs) */}
      {isMobileView && !isSearchMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E8ECF5] py-2 px-3 shadow-[0_-4px_25px_rgba(20,30,50,0.06)]">
          <div className="grid grid-cols-4 max-w-md mx-auto">
            {/* 1. Add Plan */}
            <button
              type="button"
              onClick={() => handleSelectSection('addPlan')}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <CalendarPlus className={`w-5 h-5 transition-colors ${activeSection === 'addPlan' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`} />
              <span className={`text-[10px] font-bold ${activeSection === 'addPlan' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`}>
                Add Plan
              </span>
              {activeSection === 'addPlan' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#5D5FEF]"></div>
              )}
            </button>

            {/* 2. Schedule */}
            <button
              type="button"
              onClick={() => handleSelectSection('schedule')}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <Calendar className={`w-5 h-5 transition-colors ${activeSection === 'schedule' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`} />
              <span className={`text-[10px] font-bold ${activeSection === 'schedule' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`}>
                Schedule
              </span>
              {activeSection === 'schedule' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#5D5FEF]"></div>
              )}
            </button>

            {/* 3. Attractions */}
            <button
              type="button"
              onClick={() => handleSelectSection('attractions')}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <Compass className={`w-5 h-5 transition-colors ${activeSection === 'attractions' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`} />
              <span className={`text-[10px] font-bold ${activeSection === 'attractions' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`}>
                Attractions
              </span>
              {activeSection === 'attractions' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#5D5FEF]"></div>
              )}
            </button>

            {/* 4. Expenses */}
            <button
              type="button"
              onClick={() => handleSelectSection('expenses')}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <Calculator className={`w-5 h-5 transition-colors ${activeSection === 'expenses' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`} />
              <span className={`text-[10px] font-bold ${activeSection === 'expenses' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`}>
                Expenses
              </span>
              {activeSection === 'expenses' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#5D5FEF]"></div>
              )}
            </button>
          </div>
        </nav>
      )}

      {/* Modern Footer (hidden on mobile to allow clean native app feel, kept on desktop) */}
      {!isMobileView && (
        <footer className="border-t border-[#2E3440] py-6 mt-16 bg-[#1A1E24]/90 backdrop-blur text-center text-xs text-[#D8DEE9]/70">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} RouteWise • your trip.your way</p>
            <div className="flex items-center gap-4 text-[#D8DEE9]/60">
              <span>Spot Accessibility Checks</span>
              <span>•</span>
              <span>Day-Wise Scheduling</span>
              <span>•</span>
              <span>Estimated Cost Tracking</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <TripProvider>
      <ViewModeProvider>
        <MainContent />
      </ViewModeProvider>
    </TripProvider>
  );
}
