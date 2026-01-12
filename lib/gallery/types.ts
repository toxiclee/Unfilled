// Gallery Data Model
// MVP for local-first image gallery with IndexedDB storage
// Future: migrate to Supabase while keeping IndexedDB as offline cache

export interface Asset {
  id: string;
  blob: Blob;
  mime: string;
  width?: number;
  height?: number;
  createdAt: string; // ISO 8601
}

export interface Post {
  id: string;
  assetId: string; // Reference to Asset
  caption: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  visibility: "private" | "unlisted" | "public";
}

// View model for rendering (Post + Asset joined)
export interface PostWithAsset extends Post {
  asset: Asset;
}
