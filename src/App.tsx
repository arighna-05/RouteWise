import React, { useState } from 'react';
import { TripProvider, useTrip } from './context/TripContext';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { Navbar } from './components/layout/Navbar';
import { DestinationSearchHero } from './components/search/DestinationSearchHero';
import { CityHero } from './components/dashboard/CityHero';
import { AttractionRecommendations } from './components/recommendations/AttractionRecommendations';
import { ItineraryTimeline } from './components/itinerary/ItineraryTimeline';
import { TravelExpenseCalculator } from './components/expense/TravelExpenseCalculator';
import { FloatingAITourConcierge } from './components/assistant/FloatingAITourConcierge';
import { Calendar, Compass, ArrowLeft } from 'lucide-react';

const MainContent: React.FC = () => {
  const { isSearchMode, setIsSearchMode, activeTrip } = useTrip();
  const { isMobileView } = useViewMode();
  const [activeSection, setActiveSection] = useState<'itinerary' | 'attractions'>('itinerary');

  const scrollToExpenses = () => {
    const el = document.getElementById('expense-calculator-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5D5FEF] to-[#88C0D0] flex items-center justify-center text-white font-black text-sm shadow-sm">
                RW
              </div>
              <div>
                <span className="block text-[11px] font-medium text-[#7E859B]">Welcome to</span>
                <h2 className="text-sm font-black text-[#1A1D2E] leading-tight">
                  {activeTrip.cityName || 'RouteWise'} Trip
                </h2>
              </div>
            </div>

            {/* Right: Search / Switch Destination Pill */}
            <button
              type="button"
              onClick={() => setIsSearchMode(!isSearchMode)}
              className="w-9 h-9 rounded-full bg-[#F4F6FB] border border-[#E2E6F0] flex items-center justify-center text-[#5D5FEF] hover:bg-[#EEF0FF] transition-colors"
              title={isSearchMode ? "Return to itinerary" : "Search other destinations"}
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </header>
      ) : (
        <Navbar />
      )}

      {/* Main Container */}
      <main className={`flex-1 max-w-6xl w-full mx-auto ${isMobileView ? 'px-3 py-4 pb-28' : 'px-4 sm:px-6 lg:px-8 py-6 pb-28'}`}>
        {isSearchMode ? (
          /* Step 1: Destination Search View */
          <DestinationSearchHero />
        ) : (
          /* Step 2: Planning Workspace */
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Destination Hero Header with Local Time & Dates */}
            <CityHero />

            {/* Top Switcher Navigation */}
            {isMobileView ? (
              <div className="p-1.5 rounded-2xl bg-white/90 border border-[#E2E6F0] shadow-sm backdrop-blur-md grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSection('itinerary')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                    activeSection === 'itinerary'
                      ? 'bg-[#5D5FEF] text-white shadow-sm font-extrabold'
                      : 'text-[#67708A] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="truncate">Itinerary</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                    activeSection === 'itinerary' ? 'bg-white/20 text-white' : 'bg-[#F2F4FA] text-[#5D5FEF]'
                  }`}>
                    {activeTrip.items.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('attractions')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                    activeSection === 'attractions'
                      ? 'bg-[#5D5FEF] text-white shadow-sm font-extrabold'
                      : 'text-[#67708A] hover:text-[#1A1D2E] hover:bg-[#F4F6FB]'
                  }`}
                >
                  <Compass className="w-4 h-4 shrink-0 text-[#EBCB8B]" />
                  <span>Attractions</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#242933]/90 border border-[#3B4252] backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection('itinerary')}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                      activeSection === 'itinerary'
                        ? 'bg-[#88C0D0] text-[#1A1E24] shadow-glow font-extrabold'
                        : 'text-[#D8DEE9] hover:text-white hover:bg-[#2E3440]'
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Day-by-Day Itinerary</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                      activeSection === 'itinerary' ? 'bg-[#1A1E24]/25 text-[#1A1E24]' : 'bg-[#1A1E24] text-[#88C0D0]'
                    }`}>
                      {activeTrip.items.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection('attractions')}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-w-0 ${
                      activeSection === 'attractions'
                        ? 'bg-[#88C0D0] text-[#1A1E24] shadow-glow font-extrabold'
                        : 'text-[#D8DEE9] hover:text-white hover:bg-[#2E3440]'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-[#EBCB8B] shrink-0" />
                    <span>Tourist Attractions in {activeTrip.cityName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#EBCB8B]/20 text-[#EBCB8B] text-[10px] font-bold">
                      Special Section
                    </span>
                  </button>
                </div>

                {activeSection === 'attractions' && (
                  <button
                    type="button"
                    onClick={() => setActiveSection('itinerary')}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#88C0D0] hover:bg-[#2E3440] transition-colors w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Schedule</span>
                  </button>
                )}
              </div>
            )}

            {/* Section Content: Itinerary or Tourist Attraction */}
            {activeSection === 'itinerary' ? (
              <ItineraryTimeline onOpenAttractions={() => setActiveSection('attractions')} />
            ) : (
              <div className="space-y-6">
                <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isMobileView 
                    ? 'matte-card text-[#1A1D2E]' 
                    : 'glass-card border-[#3B4252] text-[#ECEFF4]'
                }`}>
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <span>🏛️ Special Section: Tourist Attractions in {activeTrip.cityName}</span>
                    </h3>
                    <p className={`text-xs mt-1 ${isMobileView ? 'text-[#67708A]' : 'text-[#D8DEE9]/80'}`}>
                      Browse top attractions and recommendations. Click "+ Add to Day" on any spot to automatically schedule it with terrain-aware travel times.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('itinerary')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm ${
                      isMobileView
                        ? 'bg-[#5D5FEF] text-white hover:bg-[#4D4FD9]'
                        : 'bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24]'
                    }`}
                  >
                    View Scheduled Days
                  </button>
                </div>

                <AttractionRecommendations />
              </div>
            )}

            {/* Dedicated Travel Expense Calculator Section at the Very End */}
            <div id="expense-calculator-section">
              <TravelExpenseCalculator />
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Tour Concierge (bottom-right) */}
      {!isSearchMode && <FloatingAITourConcierge />}

      {/* Mobile Floating Bottom Navigation Bar (Screen 1 Inspiration) */}
      {isMobileView && !isSearchMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E8ECF5] py-2 px-6 shadow-[0_-4px_25px_rgba(20,30,50,0.06)]">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* Itinerary Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveSection('itinerary');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <Calendar className={`w-5 h-5 transition-colors ${activeSection === 'itinerary' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`} />
              <span className={`text-[10px] font-bold ${activeSection === 'itinerary' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`}>
                Itinerary
              </span>
              {activeSection === 'itinerary' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#5D5FEF] -mt-0.5"></div>
              )}
            </button>

            {/* Attractions Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveSection('attractions');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <Compass className={`w-5 h-5 transition-colors ${activeSection === 'attractions' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`} />
              <span className={`text-[10px] font-bold ${activeSection === 'attractions' ? 'text-[#5D5FEF]' : 'text-[#94A3B8]'}`}>
                Attractions
              </span>
              {activeSection === 'attractions' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#5D5FEF] -mt-0.5"></div>
              )}
            </button>

            {/* Expenses Tab */}
            <button
              type="button"
              onClick={scrollToExpenses}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <div className="w-5 h-5 flex items-center justify-center text-[#94A3B8] hover:text-[#5D5FEF]">
                💳
              </div>
              <span className="text-[10px] font-bold text-[#94A3B8]">
                Expenses
              </span>
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
