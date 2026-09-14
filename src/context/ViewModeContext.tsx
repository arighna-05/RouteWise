import React, { createContext, useContext, useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type OrientationType = 'portrait' | 'landscape';

export interface ViewModeContextType {
  deviceType: DeviceType;
  isMobileView: boolean;
  isTabletView: boolean;
  isDesktopView: boolean;
  isLandscape: boolean;
  windowWidth: number;
  windowHeight: number;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1200, height: 800 };
  });

  useEffect(() => {
    // Clean up old simulated device storage key if any exists
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('routewise_device_mode');
      } catch {
        // ignore
      }
    }

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;

  // Viewport breakpoints
  const isMobileView = width < 768;
  const isTabletView = width >= 768 && width < 1024;
  const isDesktopView = width >= 1024;
  const isLandscape = width > height;

  const deviceType: DeviceType = isMobileView ? 'mobile' : isTabletView ? 'tablet' : 'desktop';

  return (
    <ViewModeContext.Provider
      value={{
        deviceType,
        isMobileView,
        isTabletView,
        isDesktopView,
        isLandscape,
        windowWidth: width,
        windowHeight: height,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = (): ViewModeContextType => {
  const context = useContext(ViewModeContext);
  if (!context) {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      deviceType: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      isMobileView: width < 768,
      isTabletView: width >= 768 && width < 1024,
      isDesktopView: width >= 1024,
      isLandscape: width > height,
      windowWidth: width,
      windowHeight: height,
    };
  }
  return context;
};

