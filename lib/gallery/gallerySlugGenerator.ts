/**
 * Gallery-wide slug generator
 * Generates beautiful, human-friendly slugs for the entire gallery portfolio
 */

// Curated word pool for elegant gallery slugs
const WORD_POOL = [
  "unfilled",
  "not-yet",
  "still",
  "warm",
  "quiet",
  "lingering",
  "afterglow",
  "hush",
  "drift",
  "soft-light",
  "slow-morning",
];

// Reserved slugs that cannot be used
const RESERVED_SLUGS = [
  "month",
  "calendar",
  "gallery",
  "preview",
  "api",
  "login",
  "admin",
  "u",
  "s",
  "p",
  "g",
  "library",
];

/**
 * Validate slug format and availability
 */
export function validateSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  // Check length
  if (slug.length < 3 || slug.length > 40) {
    return { valid: false, error: "Slug must be 3-40 characters" };
  }

  // Check format: lowercase, a-z, 0-9, hyphen only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: "Slug can only contain lowercase letters, numbers, and hyphens",
    };
  }

  // Check if reserved
  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: "This slug is reserved" };
  }

  return { valid: true };
}

/**
 * Generate a random slug from the word pool
 */
export function generateRandomSlug(): string {
  const randomIndex = Math.floor(Math.random() * WORD_POOL.length);
  return WORD_POOL[randomIndex];
}

/**
 * Generate a slug with numeric suffix if base is taken
 */
export function generateSlugWithSuffix(baseSlug: string, attempt: number = 1): string {
  if (attempt === 1) {
    return baseSlug;
  }
  return `${baseSlug}-${attempt}`;
}

/**
 * Check if a slug is from our curated word pool
 */
export function isFromWordPool(slug: string): boolean {
  return WORD_POOL.includes(slug);
}
