// Council-agent surface (council.ts)
export {
  invokeCouncilAgent,
  routeToCouncilAgent,
  buildCouncilSessionContext,
  COUNCIL_AGENTS,
} from '@/lib/akili/council';
export type {
  CouncilAgent,
  CouncilAgentName,
  InvokeCouncilOptions,
  InvokeCouncilResult,
} from '@/lib/akili/council';

// Character / relay surface (prompts.ts)
export {
  AKILI_RELAY,
  AKILI_PRINCIPALS,
  DECISION_STACK_GUARD,
  FACT_LOCKS,
  SIGNATURE_PHRASES,
  buildRelationshipTensionContext,
  listTensionPairs,
} from '@/lib/akili/prompts';
export type {
  AkiliPrincipalName,
  AkiliRelay,
  CastPosition,
  Orientation,
  Register,
  Speed,
} from '@/lib/akili/prompts';
