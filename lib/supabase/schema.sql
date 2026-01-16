-- Supabase Database Schema for Gallery
-- Execute this in Supabase SQL Editor

-- Table: gallery_posts
-- Stores published gallery images
CREATE TABLE IF NOT EXISTS gallery_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: gallery_shares
-- Stores ONE share link for the entire gallery (portfolio-level)
CREATE TABLE IF NOT EXISTS gallery_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT DEFAULT 'Unfilled Gallery',
  description TEXT,
  visibility TEXT DEFAULT 'unlisted' CHECK (visibility IN ('unlisted', 'public')),
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: image_edits
-- Stores crop/zoom/rotation edits for exported wallpapers
CREATE TABLE IF NOT EXISTS image_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id TEXT NOT NULL,
  preset TEXT NOT NULL,
  crop_x FLOAT DEFAULT 0.5,
  crop_y FLOAT DEFAULT 0.5,
  zoom FLOAT DEFAULT 1.0,
  rotation INTEGER DEFAULT 0,
  fit_mode TEXT DEFAULT 'contain' CHECK (fit_mode IN ('contain', 'cover')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(image_id, preset)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_posts_visibility ON gallery_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_created_at ON gallery_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_shares_slug ON gallery_shares(slug);
CREATE INDEX IF NOT EXISTS idx_gallery_shares_default ON gallery_shares(is_default) WHERE (is_default = TRUE);
CREATE INDEX IF NOT EXISTS idx_image_edits_image_preset ON image_edits(image_id, preset);

-- Disable RLS for now (enable in production with proper policies)
ALTER TABLE gallery_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_edits DISABLE ROW LEVEL SECURITY;
