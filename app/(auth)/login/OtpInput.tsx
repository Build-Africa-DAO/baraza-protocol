"use client";

import {
  useRef,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import gsap from "gsap";

const LENGTH = 6;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Six-box one-time-code input. Controlled via `value` (a string of up to 6
 * digits). Auto-advances, supports backspace-to-previous, and fills from a
 * pasted code. `inputMode="numeric"` + ≥16px text avoids the mobile zoom jump.
 */
export default function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = (value + " ".repeat(LENGTH))
    .slice(0, LENGTH)
    .split("")
    .map((c) => (c === " " ? "" : c));

  function setAt(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").replace(/\s/g, ""));
  }

  function handleChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setAt(index, "");
      return;
    }
    setAt(index, clean.slice(-1));
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    if (prefersReduced()) return;
    gsap.to(e.currentTarget, {
      scale: 1.05,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
    });
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (!text) return;
    onChange(text);
    refs.current[Math.min(text.length, LENGTH - 1)]?.focus();
  }

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length: LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={handleFocus}
          aria-label={`Digit ${i + 1}`}
          className="h-12 min-h-12 w-full rounded-xl border border-baraza-border bg-baraza-surface text-center font-mono text-lg text-baraza-white outline-none transition focus:border-baraza-lime focus:ring-2 focus:ring-baraza-lime/30 disabled:opacity-50"
        />
      ))}
    </div>
  );
}
