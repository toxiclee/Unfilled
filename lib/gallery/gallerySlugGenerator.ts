// lib/gallery/gallerySlugGenerator.ts

export type SlugValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

export type SlugOptions = {
  minLength?: number;
  maxLength?: number;
  forbidReserved?: boolean;
};

export function validateSlug(input: string, opts: SlugOptions = {}): SlugValidationResult {
  const minLength = opts.minLength ?? 3;
  const maxLength = opts.maxLength ?? 40;
  const forbidReserved = opts.forbidReserved ?? true;

  const raw = (input ?? "").trim();
  if (!raw) {
    return { ok: false, error: "Slug cannot be empty." };
  }

  let normalized = raw.toLowerCase();
  normalized = normalized.replace(/[\s_]+/g, "-");
  normalized = normalized.replace(/[^a-z0-9-]/g, "");
  normalized = normalized.replace(/-+/g, "-");
  normalized = normalized.replace(/^-+/, "").replace(/-+$/, "");

  if (!normalized) {
    return {
      ok: false,
      error: "Slug must contain at least one letter or number.",
    };
  }

  if (normalized.length < minLength) {
    return {
      ok: false,
      error: `Slug must be at least ${minLength} characters.`,
    };
  }

  if (normalized.length > maxLength) {
    return {
      ok: false,
      error: `Slug must be at most ${maxLength} characters.`,
    };
  }

  if (!/^[a-z0-9]/.test(normalized)) {
    return { ok: false, error: "Slug must start with a letter or number." };
  }

  if (!/[a-z0-9]$/.test(normalized)) {
    return { ok: false, error: "Slug must end with a letter or number." };
  }

  if (forbidReserved && isReservedSlug(normalized)) {
    return { ok: false, error: "This slug is reserved. Please choose another one." };
  }

  return { ok: true, normalized };
}

export function generateRandomSlug(prefix?: string): string {
  const wordsA = ["silent", "bright", "soft", "golden", "midnight", "little", "wild", "calm", "warm", "cool"];
  const wordsB = ["forest", "studio", "window", "river", "shadow", "archive", "gallery", "memory", "frame", "season"];

  const a = wordsA[Math.floor(Math.random() * wordsA.length)];
  const b = wordsB[Math.floor(Math.random() * wordsB.length)];
  const suffix = Math.random().toString(36).slice(2, 6);

  const base = `${a}-${b}-${suffix}`;
  const withPrefix = prefix ? `${prefix}-${base}` : base;

  const v = validateSlug(withPrefix, { minLength: 3, maxLength: 40, forbidReserved: true });
  return v.ok ? v.normalized : base;
}

export function generateSlugWithSuffix(base: string, suffix: string | number): string {
  const cleanedBase = validateSlug(base, { forbidReserved: false });
  const baseNormalized = cleanedBase.ok ? cleanedBase.normalized : normalizeLoose(base);

  const suffixNormalized = String(suffix).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const combined = `${baseNormalized}-${suffixNormalized}`;

  const v = validateSlug(combined, { forbidReserved: false });
  return v.ok ? v.normalized : combined.slice(0, 40);
}

function normalizeLoose(input: string): string {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 40);
}

export function isReservedSlug(slug: string): boolean {
  const reserved = new Set([
    "api",
    "admin",
    "login",
    "logout",
    "signup",
    "signin",
    "settings",
    "account",
    "profile",
    "dashboard",
    "billing",
    "pricing",
    "support",
    "help",
    "terms",
    "privacy",
    "month",
    "gallery",
    "_next",
    "favicon.ico",
  ]);

  return reserved.has(slug);
}
