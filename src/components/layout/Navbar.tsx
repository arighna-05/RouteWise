import React from 'react';
import { Compass } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export const Navbar: React.FC = () => {
  const { 
    activeTrip, 
    isSearchMode, 
    setIsSearchMode 
  } = useTrip();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2E3440] bg-[#1A1E24]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <button 
            type="button"
            onClick={() => {
              if (activeTrip) {
                setIsSearchMode(!isSearchMode);
              } else {
                setIsSearchMode(true);
              }
            }}
            className="flex items-center gap-2.5 text-left group"
            title={isSearchMode && activeTrip ? "Return to active tour plan" : "Search destinations"}
          >
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-glow text-[#1A1E24] group-hover:scale-105 transition-transform font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight gradient-text">
                RouteWise
              </span>
              <span className="block text-[10px] font-semibold tracking-widest uppercase text-[#88C0D0]/90">
                your trip.your way
              </span>
            </div>
          </button>

        </div>
      </div>
    </header>
  );
};
