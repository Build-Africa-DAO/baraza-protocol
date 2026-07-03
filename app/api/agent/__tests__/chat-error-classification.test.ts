// @vitest-environment node
//
// Pure unit tests for the Akili chat endpoint's error classifier.
// The classifier is the only piece of chat.ts that's safe to load in a
// test environment without standing up an SSE stream and mocking the
// Anthropic SDK — that's the layer we cover here.

import { describe, expect, it } from 'vitest';
import { classifyChatError } from '../chat';

describe('classifyChatError', () => {
  it('classifies 401 as auth_failed', () => {
    const result = classifyChatError({ status: 401, message: 'invalid x-api-key' });
    expect(result.category).toBe('auth_failed');
    expect(result.message).toMatch(/key/i);
  });

  it('classifies 403 as auth_failed', () => {
    expect(classifyChatError({ status: 403 }).category).toBe('auth_failed');
  });

  it('classifies 429 as rate_limited', () => {
    const result = classifyChatError({ status: 429, message: 'rate limit exceeded' });
    expect(result.category).toBe('rate_limited');
  });

  it('classifies 529 as overloaded', () => {
    expect(classifyChatError({ status: 529 }).category).toBe('overloaded');
  });

  it('classifies "overloaded" in message body even when status is missing', () => {
    expect(classifyChatError(new Error('server overloaded, try again')).category).toBe('overloaded');
  });

  it('classifies the Anthropic credit-balance 400 as credits_exhausted', () => {
    // Real-world body returned by Anthropic when a workspace has zero credits.
    const result = classifyChatError({
      status: 400,
      message:
        'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.',
    });
    expect(result.category).toBe('credits_exhausted');
    expect(result.message).toMatch(/credits/i);
    // Member-facing message should NOT echo the raw Anthropic URL/billing language
    // — that's an admin concern, not a member concern.
    expect(result.message).not.toMatch(/Anthropic API/);
  });

  it('does NOT classify a generic 400 as credits_exhausted (false-positive guard)', () => {
    const result = classifyChatError({
      status: 400,
      message: 'prompt too long',
    });
    expect(result.category).toBe('unknown');
  });

  it('classifies non-API errors (network, parse) as unknown with the raw message', () => {
    const result = classifyChatError(new Error('ETIMEDOUT'));
    expect(result.category).toBe('unknown');
    expect(result.message).toBe('ETIMEDOUT');
  });

  it('handles null/undefined without crashing', () => {
    expect(classifyChatError(null).category).toBe('unknown');
    expect(classifyChatError(undefined).category).toBe('unknown');
  });

  it('matches "insufficient credits" wording variant', () => {
    // Defensive — Anthropic may reword the body. Classifier accepts a few
    // variants so a minor copy change doesn't silently route to "unknown".
    expect(
      classifyChatError({ status: 400, message: 'insufficient credits remaining' }).category,
    ).toBe('credits_exhausted');
  });
});
