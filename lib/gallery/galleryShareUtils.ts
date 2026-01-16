/**
 * Gallery-wide share utilities
 * Manage the single gallery share link (portfolio-level)
 */

import { getSupabaseClient } from "../supabase/client";
import {
  generateRandomSlug,
  generateSlugWithSuffix,
  validateSlug,
} from "./gallerySlugGenerator";

export interface GalleryShare {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: "unlisted" | "public";
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get the default gallery share link
 * If none exists, creates one with a beautiful slug
 */
export async function getOrCreateDefaultGalleryShare(): Promise<GalleryShare | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("Supabase not configured - gallery sharing disabled");
    return null;
  }

  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn("User not authenticated - cannot create gallery share");
      return null;
    }

    // Try to get existing default
    const { data: existing, error: fetchError } = await supabase
      .from("gallery_shares")
      .select("*")
      .eq("is_default", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (existing && !fetchError) {
      return existing as GalleryShare;
    }

    // No default exists, create one
    const slug = await findAvailableSlug();
    console.log("Attempting to create gallery share with slug:", slug);
    
    const { data: created, error: createError } = await supabase
      .from("gallery_shares")
      .insert({
        slug,
        title: "Unfilled Gallery",
        description: null,
        visibility: "unlisted",
        is_default: true,
      })
      .select()
      .single();

    console.log("Insert result - data:", created, "error:", createError);
    
    if (createError) {
      console.error("Failed to create gallery share:", createError);
      console.error("Error details:", JSON.stringify(createError, null, 2));
      console.error("Error message:", createError.message);
      console.error("Error code:", createError.code);
      return null;
    }

    return created as GalleryShare;
  } catch (err) {
    console.error("Failed to get/create gallery share:", err);
    return null;
  }
}

/**
 * Find an available slug from the word pool
 */
async function findAvailableSlug(): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");

  let baseSlug = generateRandomSlug();
  let attempt = 1;
  let slug = generateSlugWithSuffix(baseSlug, attempt);

  while (attempt < 100) {
    // Safety limit
    const { data } = await supabase
      .from("gallery_shares")
      .select("slug")
      .eq("slug", slug)
      .single();

    if (!data) {
      // Slug is available
      return slug;
    }

    // Try next suffix
    attempt++;
    slug = generateSlugWithSuffix(baseSlug, attempt);
  }

  // Fallback: use timestamp-based slug
  return `gallery-${Date.now()}`;
}

/**
 * Update the slug of the default gallery share
 */
export async function updateGalleryShareSlug(
  galleryShareId: string,
  newSlug: string
): Promise<{ success: boolean; error?: string; share?: GalleryShare }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  // Validate slug format
  const validation = validateSlug(newSlug);
  if (validation.ok === false) {
    return { success: false, error: validation.error };
  }

  try {
    // Check if slug is already taken
    const { data: existing } = await supabase
      .from("gallery_shares")
      .select("id")
      .eq("slug", newSlug)
      .neq("id", galleryShareId)
      .single();

    if (existing) {
      return { success: false, error: "This slug is already in use" };
    }

    // Update the slug
    const { data: updated, error: updateError } = await supabase
      .from("gallery_shares")
      .update({
        slug: newSlug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", galleryShareId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update slug:", updateError);
      return { success: false, error: "Failed to update slug" };
    }

    return { success: true, share: updated as GalleryShare };
  } catch (err) {
    console.error("Failed to update gallery share slug:", err);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Get gallery share by slug (for public viewing)
 */
export async function getGalleryShareBySlug(slug: string): Promise<GalleryShare | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("gallery_shares")
      .select("*")
      .eq("slug", slug)
      .eq("visibility", "unlisted")
      .single();

    if (error || !data) {
      return null;
    }

    return data as GalleryShare;
  } catch (err) {
    console.error("Failed to get gallery share:", err);
    return null;
  }
}

/**
 * Build the full share URL
 */
export function buildGalleryShareUrl(slug: string, origin?: string): string {
  const baseUrl = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl}/g/${slug}`;
}
