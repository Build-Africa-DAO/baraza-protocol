-- 022_enable_avalanche_rail.sql
--
-- Allows communities and proposals to select Avalanche as a target EVM
-- governance rail (Fuji testnet first; C-Chain later). Contract execution
-- remains gated in the app roadmap — as with 007, this only permits durable
-- community/proposal metadata.
--
-- Run after 021. Idempotent: constraint swap uses DROP IF EXISTS.

ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_chain_chk;
ALTER TABLE communities
  ADD CONSTRAINT communities_chain_chk
    CHECK (chain IN ('solana', 'stellar', 'base', 'avalanche', 'arbitrum', 'optimism', 'celo'));
ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_chain_chk;
ALTER TABLE proposals
  ADD CONSTRAINT proposals_chain_chk
    CHECK (chain IN ('solana', 'stellar', 'base', 'avalanche', 'arbitrum', 'optimism', 'celo'));
