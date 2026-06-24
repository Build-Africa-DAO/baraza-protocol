"use client";

import { useLocale, useSetLocale } from "@/app/lib/LocaleContext";

/**
 * Language switcher — English / Kiswahili.
 * Swahili carries a "beta" marker: the dictionary is complete but awaits
 * native-speaker review before the label is removed.
 */
export default function LanguageToggle() {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      <button
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "en"
            ? "bg-gray-900 text-white"
            : "text-gray-500 hover:text-gray-800"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("sw")}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors ${
          locale === "sw"
            ? "bg-gray-900 text-white"
            : "text-gray-500 hover:text-gray-800"
        }`}
        aria-pressed={locale === "sw"}
      >
        SW
        <span
          className={`rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${
            locale === "sw"
              ? "bg-orange-500 text-white"
              : "bg-orange-100 text-orange-600"
          }`}
        >
          beta
        </span>
      </button>
    </div>
  );
}
