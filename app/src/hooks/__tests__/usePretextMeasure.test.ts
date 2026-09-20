import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePretextMeasure, isCanvasMeasurementSupported } from '../usePretextMeasure';

describe('usePretextMeasure hook', () => {
  it('detects canvas measurement support safely without throwing', () => {
    const supported = isCanvasMeasurementSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('returns zero height and lineCount for empty or whitespace-only text', () => {
    const { result } = renderHook(() => usePretextMeasure('', '14px Geist, sans-serif', 300));
    expect(result.current.height).toBe(0);
    expect(result.current.lineCount).toBe(0);

    const { result: wsResult } = renderHook(() => usePretextMeasure('   \n  ', '14px Geist, sans-serif', 300));
    expect(wsResult.current.height).toBe(0);
    expect(wsResult.current.lineCount).toBe(0);
  });

  it('calculates positive height and line count for multiline content', () => {
    const text = 'Baraza Protocol empowers savings groups and chamas across Africa with transparent treasury governance.';
    const { result } = renderHook(() => usePretextMeasure(text, '14px Geist, sans-serif', 250, { lineHeight: 22 }));

    expect(result.current.height).toBeGreaterThan(0);
    expect(result.current.lineCount).toBeGreaterThanOrEqual(1);
    expect(typeof result.current.isFallback).toBe('boolean');
  });

  it('accounts for explicit newlines in multiline text', () => {
    const multiline = 'Line 1\nLine 2\nLine 3\nLine 4';
    const { result } = renderHook(() => usePretextMeasure(multiline, '14px Geist, sans-serif', 400, { lineHeight: 24 }));

    expect(result.current.lineCount).toBeGreaterThanOrEqual(4);
    expect(result.current.height).toBeGreaterThanOrEqual(4 * 24);
  });

  it('dynamically adapts when container width narrows', () => {
    const text = 'This is a long sentence that should require more lines when the container width is narrow than when wide.';
    const { result: wideResult } = renderHook(() => usePretextMeasure(text, '14px Geist, sans-serif', 600, { lineHeight: 20 }));
    const { result: narrowResult } = renderHook(() => usePretextMeasure(text, '14px Geist, sans-serif', 120, { lineHeight: 20 }));

    expect(narrowResult.current.lineCount).toBeGreaterThanOrEqual(wideResult.current.lineCount);
    expect(narrowResult.current.height).toBeGreaterThanOrEqual(wideResult.current.height);
  });
});
