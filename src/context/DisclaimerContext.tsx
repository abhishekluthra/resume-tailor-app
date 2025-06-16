'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DisclaimerContextType } from '@/types/context';

const DisclaimerContext = createContext<DisclaimerContextType | undefined>(undefined);

export function DisclaimerProvider({ children }: { children: React.ReactNode }) {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  useEffect(() => {
    const savedValue = localStorage.getItem('hasAcceptedDisclaimer');
    if (savedValue) {
      setHasAcceptedDisclaimer(JSON.parse(savedValue));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hasAcceptedDisclaimer', JSON.stringify(hasAcceptedDisclaimer));
  }, [hasAcceptedDisclaimer]);

  return (
    <DisclaimerContext.Provider value={{ hasAcceptedDisclaimer, setHasAcceptedDisclaimer }}>
      {children}
    </DisclaimerContext.Provider>
  );
}

export function useDisclaimer() {
  const context = useContext(DisclaimerContext);
  if (context === undefined) {
    throw new Error('useDisclaimer must be used within a DisclaimerProvider');
  }
  return context;
} 