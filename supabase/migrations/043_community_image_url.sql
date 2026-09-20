-- Migration 043: Community image URL and logo storage support
-- Target: communities table
-- Reference: PR #95 handoff (FE-1.5, Section 2.2)

ALTER TABLE communities ADD COLUMN IF NOT EXISTS image_url text null;

COMMENT ON COLUMN communities.image_url IS 'Public HTTPS URL to community logo image stored in Supabase Storage or CDN';

-- Create storage buckets if storage schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('community-logos', 'community-logos', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
