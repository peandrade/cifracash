"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";

export type Currency = "BRL" | "USD" | "EUR" | "GBP";
export type NumberFormat = "br" | "us";
export type DateFormat = "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";
export type WeekStartDay = "sunday" | "monday";

export interface GeneralSettings {
  currency: Currency;
  financialMonthStartDay: number;
  numberFormat: NumberFormat;
  dateFormat: DateFormat;
  weekStartDay: WeekStartDay;
  timezone: string;
}

interface GeneralSettingsContextType {
  settings: GeneralSettings;
  updateSettings: (settings: Partial<GeneralSettings>) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const defaultSettings: GeneralSettings = {
  currency: "BRL",
  financialMonthStartDay: 1,
  numberFormat: "br",
  dateFormat: "dd/MM/yyyy",
  weekStartDay: "sunday",
  timezone: "auto",
};

export const currencies: Record<Currency, { symbol: string; name: string }> = {
  BRL: { symbol: "R$", name: "Real Brasileiro" },
  USD: { symbol: "$", name: "Dólar Americano" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "Libra Esterlina" },
};

export const numberFormats: Record<NumberFormat, { example: string; name: string }> = {
  br: { example: "1.000,00", name: "Brasileiro" },
  us: { example: "1,000.00", name: "Americano" },
};

export const dateFormats: Record<DateFormat, { example: string; name: string }> = {
  "dd/MM/yyyy": { example: "31/12/2024", name: "DD/MM/AAAA" },
  "MM/dd/yyyy": { example: "12/31/2024", name: "MM/DD/AAAA" },
  "yyyy-MM-dd": { example: "2024-12-31", name: "AAAA-MM-DD" },
};

export const weekStartDays: Record<WeekStartDay, { name: string }> = {
  sunday: { name: "Domingo" },
  monday: { name: "Segunda-feira" },
};

export const commonTimezones = [
  { value: "auto", label: "Detectar automaticamente" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "America/New_York", label: "Nova York (EST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "Europe/London", label: "Londres (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Lisbon", label: "Lisboa (WET)" },
  { value: "Asia/Tokyo", label: "Tóquio (JST)" },
];

const GeneralSettingsContext = createContext<GeneralSettingsContextType | undefined>(undefined);

export function GeneralSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    };

    fetchSettings();
  }, []);

  // Save settings to API (debounced)
  const saveToApi = useCallback(async (newSettings: GeneralSettings) => {
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<GeneralSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      // Debounce API save to avoid too many requests
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveToApi(updated);
      }, 500);

      return updated;
    });
  }, [saveToApi]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveToApi(defaultSettings);
  }, [saveToApi]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <GeneralSettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </GeneralSettingsContext.Provider>
  );
}

export function useGeneralSettings() {
  const context = useContext(GeneralSettingsContext);
  if (context === undefined) {
    throw new Error("useGeneralSettings must be used within a GeneralSettingsProvider");
  }
  return context;
}

export { defaultSettings };
