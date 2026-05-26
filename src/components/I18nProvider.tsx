"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Locale = "en" | "bm";

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (k: string) => k,
});

async function loadMessages(locale: Locale): Promise<Record<string, any>> {
  try {
    const mod = await import(`@/locales/${locale}/common.json`);
    return mod.default || mod;
  } catch {
    return {};
  }
}

function resolve(obj: any, path: string): string | null {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return null;
    current = current[part];
  }
  return typeof current === "string" ? current : null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [messages, setMessages] = useState<Record<string, any>>({});

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    const browser = navigator.language.startsWith("ms") ? "bm" : "en";
    const detected = stored || browser;
    setLocaleState(detected);
  }, []);

  useEffect(() => {
    loadMessages(locale).then(setMessages);
    localStorage.setItem("locale", locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let value = resolve(messages, key) || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{{${k}}}`, String(v));
        }
      }
      return value;
    },
    [messages],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
