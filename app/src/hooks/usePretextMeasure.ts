import { useMemo } from 'react';
import { prepare, layout, type PrepareOptions } from '@chenglou/pretext';

export interface PretextMeasureResult {
  height: number;
  lineCount: number;
  isFallback: boolean;
}

export interface UsePretextMeasureOptions extends PrepareOptions {
  lineHeight?: number;
}

/**
 * Checks whether the environment supports Canvas 2D measurement.
 * Safe for SSR, Node.js unit test runners, and browsers.
 */
export function isCanvasMeasurementSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const offscreen = new OffscreenCanvas(1, 1);
      return Boolean(offscreen.getContext('2d'));
    } catch {
      // ignore
    }
  }
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Custom React hook that uses @chenglou/pretext for pure-arithmetic,
 * off-DOM text measurement.
 *
 * It preserves 100% of existing CSS styling, font classes, and layout rules,
 * providing ahead-of-time height calculations to prevent scroll jitter and
 * layout shift (CLS) without triggering browser layout reflows.
 *
 * @param text The multiline text string to measure
 * @param font The CSS font shorthand (e.g. '14px Geist, sans-serif')
 * @param width The available container width in pixels
 * @param options Additional options (lineHeight, whiteSpace, wordBreak)
 */
export function usePretextMeasure(
  text: string,
  font: string,
  width: number,
  options: UsePretextMeasureOptions = {},
): PretextMeasureResult {
  const { lineHeight = 20, whiteSpace, wordBreak, letterSpacing } = options;
  const supported = useMemo(() => isCanvasMeasurementSupported(), []);

  // Memoize the prepared handle so unicode segmentation and segment measurement
  // only run when text, font, or prepare options change.
  const prepared = useMemo(() => {
    if (!supported || !text.trim()) return null;
    try {
      return prepare(text, font, { whiteSpace, wordBreak, letterSpacing });
    } catch {
      return null;
    }
  }, [text, font, supported, whiteSpace, wordBreak, letterSpacing]);

  return useMemo(() => {
    if (!text.trim()) {
      return { height: 0, lineCount: 0, isFallback: false };
    }

    if (prepared && width > 0) {
      try {
        const res = layout(prepared, width, lineHeight);
        return {
          height: Math.ceil(res.height),
          lineCount: res.lineCount,
          isFallback: false,
        };
      } catch {
        // fall through to arithmetic fallback
      }
    }

    // Heuristic fallback for SSR, test environments without Canvas, or width <= 0
    const safeWidth = width > 0 ? width : 300;
    const estCharWidth = 8; // average 14px font char width
    const charsPerLine = Math.max(1, Math.floor(safeWidth / estCharWidth));
    const lines = text.split('\n').reduce((acc, line) => {
      return acc + Math.max(1, Math.ceil(line.length / charsPerLine));
    }, 0);

    return {
      height: lines * lineHeight,
      lineCount: lines,
      isFallback: true,
    };
  }, [prepared, text, width, lineHeight]);
}
