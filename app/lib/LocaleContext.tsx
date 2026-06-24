"use client";

/**
 * Baraza locale state — English / Swahili toggle.
 *
 * Default is always 'en' (server render + first client render = English).
 * After mount, a useEffect reads localStorage and switches to 'sw' if the
 * user previously chose it. This pattern avoids hydration mismatches: the
 * server and the initial client render always agree on 'en'.
 *
 * Swahili is a community-beta layer. The sw dictionary is intact and
 * complete, but still needs a native-speaker review before wide release.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { en, sw } from "@/app/lib/i18n";

export type Locale = "en" | "sw";

const STORAGE_KEY = "baraza_locale";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleCtx>({
  locale: "en",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate from storage after mount only — keeps SSR/client render identical.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "sw") setLocaleState("sw");
    } catch {
      // localStorage unavailable (private browsing restriction etc.) — stay 'en'
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // best-effort persist
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export function useSetLocale(): (l: Locale) => void {
  return useContext(LocaleContext).setLocale;
}

/**
 * useT — returns a t() function bound to the active locale.
 * Call sites stay identical to the static t(): `t("hero.eyebrow")`.
 *
 * active 'en' → en[key] ?? sw[key] ?? key
 * active 'sw' → sw[key] ?? en[key] ?? key
 */
export function useT(): (key: string) => string {
  const { locale } = useContext(LocaleContext);
  return useCallback(
    (key: string): string => {
      if (locale === "sw") return sw[key] ?? en[key] ?? key;
      return en[key] ?? sw[key] ?? key;
    },
    [locale],
  );
}
