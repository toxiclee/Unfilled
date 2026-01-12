// Gallery Repository Abstraction Layer
// This allows switching between storage backends without changing UI code

import type { PostWithAsset } from './types';

/**
 * Abstract interface for gallery storage operations
 * Implementations: IndexedDB (local), Supabase (cloud)
 */
export interface GalleryRepository {
  listPosts(limit?: number): Promise<PostWithAsset[]>;
  getPost(id: string): Promise<PostWithAsset | null>;
  createPost(data: {
    imageBlob: Blob;
    caption?: string;
    visibility?: 'private' | 'unlisted' | 'public';
  }): Promise<PostWithAsset>;
  updatePost(id: string, data: { caption?: string }): Promise<void>;
  deletePost(id: string): Promise<void>;
}

/**
 * Feature flag for Supabase publishing
 * When false: All operations use IndexedDB only
 * When true: Can optionally publish to Supabase
 */
export const ENABLE_SUPABASE_PUBLISH = false;
