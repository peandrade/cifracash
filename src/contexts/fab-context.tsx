"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface FabContextType {
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const FabContext = createContext<FabContextType | null>(null);

export function FabProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const setExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
  }, []);

  return (
    <FabContext.Provider value={{ isExpanded, setExpanded }}>
      {children}
    </FabContext.Provider>
  );
}

export function useFab() {
  const context = useContext(FabContext);
  // Return default values if not in provider (for pages without FAB)
  if (!context) {
    return { isExpanded: false, setExpanded: () => {} };
  }
  return context;
}
