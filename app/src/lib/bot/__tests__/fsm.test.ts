// app/src/lib/bot/__tests__/fsm.test.ts
// Standard: S&P 500 Enterprise Fintech (ADR-007 Pure FSM Test Suite)
// Objective: Verify 100% totality, determinism, multi-lingual slot extraction, and failure ladder execution.

import { describe, expect, it } from 'vitest';
import {
  processTurn,
  parseAffirmative,
  parseShengAmount,
  type BotSessionState,
} from '../fsm';

describe('ADR-007: Conversational Bot FSM Engine', () => {
  describe('Slot Extractors: parseAffirmative & parseShengAmount', () => {
    it('parses affirmative tokens across English, Swahili, and Sheng', () => {
      // English
      expect(parseAffirmative('yes')).toBe(true);
      expect(parseAffirmative('agree')).toBe(true);
      expect(parseAffirmative('ok')).toBe(true);

      // Swahili
      expect(parseAffirmative('ndio')).toBe(true);
      expect(parseAffirmative('sawa')).toBe(true);
      expect(parseAffirmative('kubali')).toBe(true);

      // Sheng
      expect(parseAffirmative('rada')).toBe(true);
      expect(parseAffirmative('ni poa')).toBe(true);
      expect(parseAffirmative('wazi')).toBe(true);
      expect(parseAffirmative('chapa')).toBe(true);
    });

    it('parses negative tokens across English, Swahili, and Sheng', () => {
      expect(parseAffirmative('no')).toBe(false);
      expect(parseAffirmative('cancel')).toBe(false);
      expect(parseAffirmative('hapana')).toBe(false);
      expect(parseAffirmative('zii')).toBe(false);
      expect(parseAffirmative('apana')).toBe(false);
    });

    it('parses Sheng monetary amounts accurately', () => {
      expect(parseShengAmount('punch')).toBe(100);
      expect(parseShengAmount('soo moja')).toBe(100);
      expect(parseShengAmount('soo mbili')).toBe(200);
      expect(parseShengAmount('soo tano')).toBe(500);
      expect(parseShengAmount('bob soo tano')).toBe(500);
      expect(parseShengAmount('kilo moja')).toBe(1000);
      expect(parseShengAmount('ngiri moja')).toBe(1000);
      expect(parseShengAmount('send 2500 now')).toBe(2500);
      expect(parseShengAmount('invalid random text')).toBeNull();
    });
  });

  describe('Dialogue Flow & State Machine Transitions', () => {
    it('transitions from ROOT to ONBOARDING and prompts for language', () => {
      const state: BotSessionState = { currentNode: 'ROOT', slots: { failureCount: 0 } };
      const res = processTurn(state, 'Habari');

      expect(res.nextState.currentNode).toBe('ONBOARDING');
      expect(res.replyText).toContain('Please choose your preferred language');
      expect(res.commands).toHaveLength(0);
    });

    it('onboards user in Sheng and asks for account intent', () => {
      const state: BotSessionState = { currentNode: 'ONBOARDING', slots: { failureCount: 0 } };
      const res = processTurn(state, '3'); // Sheng

      expect(res.nextState.currentNode).toBe('ACCOUNT_INTENT');
      expect(res.nextState.slots.locale).toBe('sheng');
      expect(res.replyText).toContain('Rada yako ni gani leo?');
    });

    it('routes to COMMUNITY_LOOKUP on join intent and confirms membership', () => {
      const state: BotSessionState = {
        currentNode: 'ACCOUNT_INTENT',
        slots: { locale: 'sheng', failureCount: 0 },
      };
      const res = processTurn(state, '1'); // Join

      expect(res.nextState.currentNode).toBe('COMMUNITY_LOOKUP');
      expect(res.replyText).toContain('Weka join code');

      // Member enters join code
      const lookupRes = processTurn(res.nextState, 'KILIFI_SACCO');
      expect(lookupRes.nextState.currentNode).toBe('ROLE_CONFIRMATION');
      expect(lookupRes.nextState.slots.communityId).toBe('KILIFI_SACCO');

      // Member confirms in Sheng ("rada")
      const confirmRes = processTurn(lookupRes.nextState, 'rada');
      expect(confirmRes.nextState.currentNode).toBe('WALLET_PROVISIONING');
      expect(confirmRes.commands).toHaveLength(1);
      expect(confirmRes.commands[0].type).toBe('JOIN_COMMUNITY');
    });

    it('completes contribution flow with Sheng monetary amount and initiates payment', () => {
      const state: BotSessionState = {
        currentNode: 'DASHBOARD',
        slots: { locale: 'sheng', phone: '254712345678', communityId: 'CHAMA_1', failureCount: 0 },
      };

      // Select 1: Pay dues
      const step1 = processTurn(state, '1');
      expect(step1.nextState.currentNode).toBe('CONTRIBUTION_FLOW');

      // Enter amount in Sheng: "soo tano" (500)
      const step2 = processTurn(step1.nextState, 'soo tano');
      expect(step2.nextState.currentNode).toBe('CONTRIBUTION_CONFIRM');
      expect(step2.nextState.slots.amountKes).toBe(500);

      // Confirm payment with affirmative "wazi"
      const step3 = processTurn(step2.nextState, 'wazi');
      expect(step3.nextState.currentNode).toBe('DASHBOARD');
      expect(step3.commands).toHaveLength(1);
      expect(step3.commands[0]).toEqual({
        type: 'INITIATE_PAYMENT',
        amountKes: 500,
        phone: '254712345678',
        communityId: 'CHAMA_1',
      });
      expect(step3.replyText).toContain('STK Push ya KES 500');
    });

    it('casts on-chain governance vote via WhatsApp turn', () => {
      const state: BotSessionState = {
        currentNode: 'DASHBOARD',
        slots: { locale: 'en', phone: '254712345678', communityId: 'COMM_1', failureCount: 0 },
      };

      // 1. Select Vote
      const step1 = processTurn(state, '2');
      expect(step1.nextState.currentNode).toBe('VOTE_FLOW');

      // 2. Cast vote "yes"
      const step2 = processTurn(step1.nextState, 'yes');
      expect(step2.nextState.currentNode).toBe('DASHBOARD');
      expect(step2.commands).toHaveLength(1);
      expect(step2.commands[0]).toEqual({
        type: 'CAST_VOTE',
        proposalId: 'PROP-101',
        choice: 'YES',
        voterPhone: '254712345678',
      });
    });

    it('triggers global interrupt for human escalation', () => {
      const state: BotSessionState = {
        currentNode: 'DASHBOARD',
        slots: { phone: '254712345678', failureCount: 0 },
      };
      const res = processTurn(state, 'ongea na mtu');

      expect(res.nextState.currentNode).toBe('ESCALATED');
      expect(res.commands[0].type).toBe('ALERT_HUMAN_ADMIN');
    });

    it('executes failure ladder from clarification to Akili rephrase to escalation', () => {
      let state: BotSessionState = {
        currentNode: 'ACCOUNT_INTENT',
        slots: { locale: 'en', phone: '254712345678', failureCount: 0 },
      };

      // Turn 1 failure: Re-prompt
      const t1 = processTurn(state, 'gibberish text');
      expect(t1.nextState.slots.failureCount).toBe(1);
      expect(t1.commands).toHaveLength(0);

      // Turn 2 failure: Re-prompt
      const t2 = processTurn(t1.nextState, 'more gibberish');
      expect(t2.nextState.slots.failureCount).toBe(2);
      expect(t2.commands).toHaveLength(0);

      // Turn 3 failure: Trigger Akili LLM rephrase
      const t3 = processTurn(t2.nextState, 'still confused');
      expect(t3.nextState.slots.failureCount).toBe(3);
      expect(t3.commands).toHaveLength(1);
      expect(t3.commands[0].type).toBe('TRIGGER_AKILI_REPHRASE');

      // Turn 4 failure: Escalate to human admin
      const t4 = processTurn(t3.nextState, 'total failure');
      expect(t4.nextState.currentNode).toBe('ESCALATED');
      expect(t4.commands).toHaveLength(1);
      expect(t4.commands[0].type).toBe('ALERT_HUMAN_ADMIN');
    });
  });
});
