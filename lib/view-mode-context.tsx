"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ViewMode = "ON" | "OFF";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available, otherwise default to "OFF"
  const [viewMode, setViewModeState] = useState<ViewMode>("OFF");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("viewMode") as ViewMode;
    if (savedMode === "ON" || savedMode === "OFF") {
      setViewModeState(savedMode);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever viewMode changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("viewMode", viewMode);
    }
  }, [viewMode, isInitialized]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  const toggleViewMode = () => {
    setViewModeState((prev) => (prev === "OFF" ? "ON" : "OFF"));
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
