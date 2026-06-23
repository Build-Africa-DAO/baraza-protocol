-- 007_enable_evm_community_rails.sql
--
-- Allows communities to select Base, Arbitrum, Optimism, and Celo as target
-- EVM governance/settlement rails. Contract execution remains gated in the app
-- roadmap; this only permits durable community metadata.

ALTER TABLE communities
  DROP CONSTRAINT IF EXISTS communities_chain_chk;

ALTER TABLE communities
  ADD CONSTRAINT communities_chain_chk
    CHECK (chain IN ('solana', 'stellar', 'base', 'arbitrum', 'optimism', 'celo'));
