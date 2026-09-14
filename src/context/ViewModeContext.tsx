import React, { createContext, useContext, useState, useEffect } from 'react';

export type DeviceMode = 'iphone' | 'compact' | 'full';

interface ViewModeContextType {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  isMobileView: boolean;
  isLandscape: boolean;
  setIsLandscape: React.Dispatch<React.SetStateAction<boolean>>;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('routewise_device_mode');
      if (saved === 'iphone' || saved === 'compact' || saved === 'full') {
        return saved;
      }
    }
    return 'iphone';
  });

  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    localStorage.setItem('routewise_device_mode', deviceMode);
  }, [deviceMode]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When deviceMode is 'iphone' or 'compact', it's mobile view.
  // When deviceMode is 'full', it's mobile view ONLY if the actual screen width is < 768px.
  const isMobileView = deviceMode === 'iphone' || deviceMode === 'compact' || windowWidth < 768;

  return (
    <ViewModeContext.Provider value={{ deviceMode, setDeviceMode, isMobileView, isLandscape, setIsLandscape }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = (): ViewModeContextType => {
  const context = useContext(ViewModeContext);
  if (!context) {
    return {
      deviceMode: 'full',
      setDeviceMode: () => {},
      isMobileView: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
      isLandscape: false,
      setIsLandscape: () => {},
    };
  }
  return context;
};
