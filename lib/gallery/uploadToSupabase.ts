/**
 * Upload images directly to Supabase Storage + Database
 * Upload = Publish (no local storage)
 */

import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client";

export type UploadResult = {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
};

/**
 * Upload image to Supabase Storage and return public URL
 */
export async function uploadImageToSupabase(
  file: File
): Promise<UploadResult> {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Supabase not configured. Please set environment variables.",
    };
  }

  try {
    const supabase = getSupabaseClient();

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("gallery-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("gallery-images")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Create database record
    const { data: postData, error: dbError } = await supabase
      .from("gallery_posts")
      .insert({
        image_url: imageUrl,
        caption: null,
        visibility: "unlisted",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Clean up uploaded file
      await supabase.storage.from("gallery-images").remove([filePath]);
      return {
        success: false,
        error: `Database error: ${dbError.message}`,
      };
    }

    return {
      success: true,
      url: imageUrl,
      path: filePath,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

/**
 * Delete image from Supabase
 */
export async function deleteImageFromSupabase(
  postId: string,
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const supabase = getSupabaseClient();
    
    // Extract file path from URL
    const urlParts = imageUrl.split("/");
    const filePath = `uploads/${urlParts[urlParts.length - 1]}`;

    // Delete from database
    const { error: dbError } = await supabase
      .from("gallery_posts")
      .delete()
      .eq("id", postId);

    if (dbError) {
      console.error("Database delete error:", dbError);
      return { success: false, error: dbError.message };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("gallery-images")
      .remove([filePath]);

    if (storageError) {
      console.warn("Storage delete warning:", storageError);
      // Don't fail if storage delete fails (orphaned file is OK)
    }

    return { success: true };
  } catch (err) {
    console.error("Delete error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}
