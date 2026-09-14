import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, RotateCw, Wifi, Battery } from 'lucide-react';
import { useViewMode } from '../../context/ViewModeContext';

interface MobileScreenWrapperProps {
  children: React.ReactNode;
}

export const MobileScreenWrapper: React.FC<MobileScreenWrapperProps> = ({ children }) => {
  const { deviceMode, setDeviceMode, isLandscape, setIsLandscape } = useViewMode();
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // If "full" is selected, render standard edge-to-edge layout with a discreet floating switch
  if (deviceMode === 'full') {
    return (
      <div className="relative min-h-screen">
        {/* Floating Quick Switch to Mobile Screen */}
        <div className="fixed top-3 right-3 z-50 animate-in fade-in">
          <button
            type="button"
            onClick={() => setDeviceMode('iphone')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242933]/90 hover:bg-[#2E3440] border border-[#88C0D0]/40 text-[#88C0D0] text-xs font-bold shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            title="Switch to Mobile Screen Preview"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Mobile Screen View</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Determine width/height based on device mode & orientation
  const isCompact = deviceMode === 'compact';
  const widthPx = isLandscape ? (isCompact ? 740 : 844) : (isCompact ? 360 : 390);
  const heightPx = isLandscape ? (isCompact ? 360 : 390) : (isCompact ? 740 : 844);

  return (
    <div className="min-h-screen bg-[#0F1216] py-3 sm:py-6 px-2 sm:px-4 flex flex-col items-center justify-start selection:bg-[#88C0D0] selection:text-[#1A1E24]">
      {/* Top Device Simulator Controller Bar */}
      <header className="mb-4 w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-[#1E232B]/90 border border-[#333B4A] shadow-xl backdrop-blur-md text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#88C0D0]/15 flex items-center justify-center text-[#88C0D0]">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-[#ECEFF4] text-xs tracking-tight">
              Mobile Screen Mode
            </span>
            <span className="hidden sm:inline text-[10px] text-[#D8DEE9]/60 ml-2 font-mono">
              {widthPx} × {heightPx} px
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1 bg-[#14181D] p-1 rounded-xl border border-[#2E3440]">
          <button
            type="button"
            onClick={() => setDeviceMode('iphone')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              deviceMode === 'iphone'
                ? 'bg-[#88C0D0] text-[#1A1E24] shadow-sm font-extrabold'
                : 'text-[#D8DEE9]/70 hover:text-white hover:bg-[#242933]'
            }`}
          >
            iPhone (390px)
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('compact')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              deviceMode === 'compact'
                ? 'bg-[#88C0D0] text-[#1A1E24] shadow-sm font-extrabold'
                : 'text-[#D8DEE9]/70 hover:text-white hover:bg-[#242933]'
            }`}
          >
            Compact (360px)
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('full')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#D8DEE9]/70 hover:text-white hover:bg-[#242933] transition-all"
            title="Switch to full-width responsive view"
          >
            <Monitor className="w-3 h-3" />
            <span>Full Width</span>
          </button>
        </div>

        {/* Rotate Button */}
        <button
          type="button"
          onClick={() => setIsLandscape(!isLandscape)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
            isLandscape
              ? 'bg-[#EBCB8B]/20 border-[#EBCB8B]/50 text-[#EBCB8B]'
              : 'bg-[#242933] border-[#3B4252] text-[#D8DEE9]/80 hover:text-white'
          }`}
          title="Rotate device screen"
        >
          <RotateCw className="w-3 h-3" />
          <span className="hidden sm:inline">{isLandscape ? 'Landscape' : 'Rotate'}</span>
        </button>
      </header>

      {/* Realistic Mobile Device Frame */}
      <div
        style={{
          width: '100%',
          maxWidth: `${widthPx}px`,
          minHeight: `${heightPx}px`,
          height: `${heightPx}px`,
          transform: 'translateZ(0)', // Establishes containing block for fixed overlays
        }}
        className="relative bg-[#1A1E24] rounded-[48px] border-[9px] border-[#2C3340] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/10 flex flex-col overflow-hidden transition-all duration-300"
      >
        {/* Dynamic Island / Bezel Top Bar */}
        <div className="relative w-full h-9 bg-[#1A1E24] flex items-center justify-between px-6 pt-1 select-none shrink-0 z-40 border-b border-[#242933]/50">
          {/* Status Clock */}
          <span className="text-[11px] font-bold text-[#ECEFF4] font-mono tracking-tight">
            {currentTime}
          </span>

          {/* Dynamic Island Pill */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-[#2E3440]/90"></div>
          </div>

          {/* Status Icons */}
          <div className="flex items-center gap-1.5 text-[#ECEFF4]">
            <Wifi className="w-3 h-3 text-[#ECEFF4]" />
            <span className="text-[10px] font-extrabold tracking-tighter">5G</span>
            <Battery className="w-3.5 h-3.5 text-[#ECEFF4]" />
          </div>
        </div>

        {/* Scrollable Mobile Screen Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col overscroll-contain">
          {children}
        </div>

        {/* Bottom iOS Home Indicator */}
        <div className="h-5 bg-[#1A1E24] w-full flex items-center justify-center shrink-0 border-t border-[#242933]/40 select-none">
          <div className="w-32 h-1 bg-[#ECEFF4]/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
