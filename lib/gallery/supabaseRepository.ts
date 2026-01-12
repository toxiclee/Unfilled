// Supabase Repository Implementation
// Phase 1: Stub implementation - returns empty/not implemented
// Phase 2+: Will implement actual Supabase operations

import type { GalleryRepository } from './repository';
import type { PostWithAsset } from './types';
import { supabase, isSupabaseConfigured } from '../supabase/client';

export class SupabaseGalleryRepository implements GalleryRepository {
  async listPosts(limit: number = 100): Promise<PostWithAsset[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return [];
    }

    // TODO Phase 2: Implement Supabase query
    // const { data, error } = await supabase
    //   .from('gallery_posts')
    //   .select('*')
    //   .order('created_at', { ascending: false })
    //   .limit(limit);
    
    return [];
  }

  async getPost(id: string): Promise<PostWithAsset | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }

    // TODO Phase 2: Implement Supabase query
    return null;
  }

  async createPost(data: {
    imageBlob: Blob;
    caption?: string;
    visibility?: 'private' | 'unlisted' | 'public';
  }): Promise<PostWithAsset> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // TODO Phase 2: Implement Supabase upload
    // 1. Upload blob to Supabase Storage
    // 2. Create post record in gallery_posts table
    // 3. Return PostWithAsset
    
    throw new Error('Supabase createPost not yet implemented');
  }

  async updatePost(id: string, data: { caption?: string }): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // TODO Phase 2: Implement Supabase update
    throw new Error('Supabase updatePost not yet implemented');
  }

  async deletePost(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // TODO Phase 2: Implement Supabase delete
    throw new Error('Supabase deletePost not yet implemented');
  }
}
