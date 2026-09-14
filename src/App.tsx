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
import { MobileScreenWrapper } from './components/layout/MobileScreenWrapper';
import { Calendar, Compass, ArrowLeft } from 'lucide-react';

const MainContent: React.FC = () => {
  const { isSearchMode, activeTrip } = useTrip();
  const { isMobileView } = useViewMode();
  const [activeSection, setActiveSection] = useState<'itinerary' | 'attractions'>('itinerary');

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1E24] text-[#E5E9F0] selection:bg-[#88C0D0] selection:text-[#1A1E24]">
      {/* Top Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        {isSearchMode ? (
          /* Step 1: Destination Search View */
          <DestinationSearchHero />
        ) : (
          /* Step 2: Planning Workspace */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Destination Hero Header with Local Time & Dates */}
            <CityHero />

            {/* Top Switcher Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#242933]/90 border border-[#3B4252] backdrop-blur-md">
              <div className={isMobileView ? "grid grid-cols-2 gap-1.5 w-full" : "flex items-center gap-2"}>
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
                  <span className="truncate">{isMobileView ? 'Itinerary' : 'Day-by-Day Itinerary'}</span>
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
                  <span>{isMobileView ? 'Attractions' : `Tourist Attractions in ${activeTrip.cityName}`}</span>
                  {!isMobileView && (
                    <span className="px-2 py-0.5 rounded-full bg-[#EBCB8B]/20 text-[#EBCB8B] text-[10px] font-bold">
                      Special Section
                    </span>
                  )}
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

            {/* Section Content: Itinerary or Tourist Attraction */}
            {activeSection === 'itinerary' ? (
              <ItineraryTimeline onOpenAttractions={() => setActiveSection('attractions')} />
            ) : (
              <div className="space-y-6">
                <div className="p-4 sm:p-5 rounded-2xl glass-card border border-[#3B4252] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-[#ECEFF4] flex items-center gap-2">
                      <span>🏛️ Special Section: Tourist Attractions in {activeTrip.cityName}</span>
                    </h3>
                    <p className="text-xs text-[#D8DEE9]/80 mt-1">
                      Browse top attractions and recommendations. Click "+ Add to Day" on any spot to automatically schedule it with terrain-aware travel times.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('itinerary')}
                    className="px-4 py-2 rounded-xl bg-[#88C0D0] hover:bg-[#81A1C1] text-[#1A1E24] text-xs font-bold transition-all shrink-0 shadow-sm"
                  >
                    View Scheduled Days
                  </button>
                </div>

                <AttractionRecommendations />
              </div>
            )}

            {/* Dedicated Travel Expense Calculator Section at the Very End */}
            <TravelExpenseCalculator />
          </div>
        )}
      </main>

      {/* Floating AI Tour Concierge (bottom-right) */}
      {!isSearchMode && <FloatingAITourConcierge />}

      {/* Modern Footer */}
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
    </div>
  );
};

export default function App() {
  return (
    <TripProvider>
      <ViewModeProvider>
        <MobileScreenWrapper>
          <MainContent />
        </MobileScreenWrapper>
      </ViewModeProvider>
    </TripProvider>
  );
}
