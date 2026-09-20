// Council-agent surface (council.ts)
export {
  invokeCouncilAgent,
  routeToCouncilAgent,
  buildCouncilSessionContext,
  COUNCIL_AGENTS,
} from './council.js';
export type {
  CouncilAgent,
  CouncilAgentName,
  InvokeCouncilOptions,
  InvokeCouncilResult,
} from './council.js';

// Character / relay surface (prompts.ts)
export {
  AKILI_RELAY,
  AKILI_PRINCIPALS,
  DECISION_STACK_GUARD,
  FACT_LOCKS,
  SIGNATURE_PHRASES,
  buildRelationshipTensionContext,
  listTensionPairs,
} from './prompts.js';
export type {
  AkiliPrincipalName,
  AkiliRelay,
  CastPosition,
  Orientation,
  Register,
  Speed,
} from './prompts.js';
