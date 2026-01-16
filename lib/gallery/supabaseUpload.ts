/**
 * Supabase upload utilities
 * Upload images directly to Supabase Storage + create database records
 */

import { getSupabaseClient } from "../supabase/client";

export async function uploadToSupabase(file: File) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = fileName;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('gallery-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('gallery-images')
    .getPublicUrl(filePath);

  // Create database record
  const { data: post, error: dbError } = await supabase
    .from('gallery_posts')
    .insert({
      image_url: publicUrl,
      caption: '',
      visibility: 'unlisted'
    })
    .select()
    .single();

  if (dbError) {
    console.error("Database error:", dbError);
    // Try to clean up uploaded file
    await supabase.storage.from('gallery-images').remove([filePath]);
    throw dbError;
  }

  return {
    id: post.id,
    image_url: publicUrl,
    caption: post.caption,
    created_at: post.created_at
  };
}

export async function deleteFromSupabase(imageUrl: string, postId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Extract filename from URL
  const urlParts = imageUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];

  // Delete from database
  const { error: dbError } = await supabase
    .from('gallery_posts')
    .delete()
    .eq('id', postId);

  if (dbError) {
    console.error("Database delete error:", dbError);
    throw dbError;
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('gallery-images')
    .remove([fileName]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    // Don't throw - database record is already deleted
  }
}
