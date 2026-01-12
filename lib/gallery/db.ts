// IndexedDB Layer for Gallery
//
// SCHEMA:
// - Database: unfilled_gallery
// - Object Stores:
//   1. assets (keyPath: id) - stores image Blobs with metadata
//   2. posts (keyPath: id, index: createdAt) - stores post metadata referencing assets
//
// WHY IndexedDB:
// - localStorage has 5-10MB limit and doesn't support Blobs
// - IndexedDB handles large binary data (images) efficiently
// - Async API works well with React
// - Can store 100s of MB locally
// - Easy migration path to Supabase (sync pattern)
//
// USAGE:
// - All functions are client-side only (check typeof window)
// - Use from "use client" components only
// - Blobs stored directly, use URL.createObjectURL() for rendering

import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { Asset, Post, PostWithAsset } from "./types";

const DB_NAME = "unfilled_gallery";
const DB_VERSION = 1;

interface GalleryDB extends DBSchema {
  assets: {
    key: string;
    value: Asset;
  };
  posts: {
    key: string;
    value: Post;
    indexes: { createdAt: string };
  };
}

let dbInstance: IDBPDatabase<GalleryDB> | null = null;

// Open/create database
async function getDB(): Promise<IDBPDatabase<GalleryDB>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in browser");
  }

  if (dbInstance) return dbInstance;

  dbInstance = await openDB<GalleryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create assets store
      if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets", { keyPath: "id" });
      }

      // Create posts store with index
      if (!db.objectStoreNames.contains("posts")) {
        const postStore = db.createObjectStore("posts", { keyPath: "id" });
        postStore.createIndex("createdAt", "createdAt");
      }
    },
  });

  return dbInstance;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Add asset to database
export async function addAsset(
  blob: Blob,
  mime: string,
  width?: number,
  height?: number
): Promise<Asset> {
  const db = await getDB();
  
  const asset: Asset = {
    id: generateId(),
    blob,
    mime,
    width,
    height,
    createdAt: new Date().toISOString(),
  };

  await db.add("assets", asset);
  return asset;
}

// Add post to database
export async function addPost(
  assetId: string,
  caption: string = ""
): Promise<Post> {
  const db = await getDB();
  
  const now = new Date().toISOString();
  const post: Post = {
    id: generateId(),
    assetId,
    caption,
    createdAt: now,
    updatedAt: now,
    visibility: "private",
  };

  await db.add("posts", post);
  return post;
}

// List posts (newest first)
export async function listPosts(
  limit: number = 50,
  offset: number = 0
): Promise<Post[]> {
  const db = await getDB();
  
  const tx = db.transaction("posts", "readonly");
  const index = tx.store.index("createdAt");
  
  // Get all posts sorted by createdAt descending
  const posts = await index.getAll();
  posts.reverse(); // Newest first
  
  return posts.slice(offset, offset + limit);
}

// Get single post
export async function getPost(postId: string): Promise<Post | undefined> {
  const db = await getDB();
  return db.get("posts", postId);
}

// Get single asset
export async function getAsset(assetId: string): Promise<Asset | undefined> {
  const db = await getDB();
  return db.get("assets", assetId);
}

// Get post with asset (joined)
export async function getPostWithAsset(
  postId: string
): Promise<PostWithAsset | null> {
  const post = await getPost(postId);
  if (!post) return null;

  const asset = await getAsset(post.assetId);
  if (!asset) return null;

  return { ...post, asset };
}

// List posts with assets (joined)
export async function listPostsWithAssets(
  limit: number = 50,
  offset: number = 0
): Promise<PostWithAsset[]> {
  const posts = await listPosts(limit, offset);
  
  const postsWithAssets: PostWithAsset[] = [];
  for (const post of posts) {
    const asset = await getAsset(post.assetId);
    if (asset) {
      postsWithAssets.push({ ...post, asset });
    }
  }
  
  return postsWithAssets;
}

// Update post caption
export async function updatePostCaption(
  postId: string,
  caption: string
): Promise<void> {
  const db = await getDB();
  const post = await getPost(postId);
  
  if (!post) throw new Error("Post not found");
  
  post.caption = caption;
  post.updatedAt = new Date().toISOString();
  
  await db.put("posts", post);
}

// Delete post (orphan check for asset is caller's responsibility)
export async function deletePost(postId: string): Promise<void> {
  const db = await getDB();
  await db.delete("posts", postId);
}

// Delete asset (only if not referenced by any post)
export async function deleteAsset(assetId: string): Promise<void> {
  const db = await getDB();
  
  // Check if any post references this asset
  const posts = await listPosts(1000); // Check all posts
  const hasReference = posts.some((p) => p.assetId === assetId);
  
  if (hasReference) {
    throw new Error("Cannot delete asset: still referenced by posts");
  }
  
  await db.delete("assets", assetId);
}

// Upload helper: accepts File, creates Asset + Post
export async function uploadImage(file: File): Promise<{ asset: Asset; post: Post }> {
  // Get image dimensions
  const { width, height } = await getImageDimensions(file);
  
  // Create asset
  const asset = await addAsset(file, file.type, width, height);
  
  // Create post
  const post = await addPost(asset.id, "");
  
  return { asset, post };
}

// Helper to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    
    img.src = url;
  });
}
