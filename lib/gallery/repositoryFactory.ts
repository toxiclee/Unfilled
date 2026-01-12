// Repository Factory
// Determines which repository implementation to use
// Default: IndexedDB (keeps existing behavior)

import type { GalleryRepository } from './repository';
import { IndexedDBGalleryRepository } from './indexedDBRepository';
import { SupabaseGalleryRepository } from './supabaseRepository';
import { ENABLE_SUPABASE_PUBLISH } from './repository';

/**
 * Get the default gallery repository
 * Phase 1: Always returns IndexedDB repository
 * Phase 2+: Can return Supabase repository based on feature flag
 */
export function getDefaultGalleryRepository(): GalleryRepository {
  // Always use IndexedDB for now
  // In Phase 2, this could check ENABLE_SUPABASE_PUBLISH
  return new IndexedDBGalleryRepository();
}

/**
 * Get Supabase repository (for future publish feature)
 * Returns null if Supabase is not enabled/configured
 */
export function getSupabaseGalleryRepository(): GalleryRepository | null {
  if (!ENABLE_SUPABASE_PUBLISH) {
    return null;
  }
  return new SupabaseGalleryRepository();
}
