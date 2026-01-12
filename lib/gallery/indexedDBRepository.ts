// IndexedDB Repository Implementation
// This wraps existing IndexedDB operations into the repository interface

import type { GalleryRepository } from './repository';
import type { PostWithAsset } from './types';
import { 
  listPostsWithAssets, 
  getPostWithAsset, 
  uploadImage, 
  updatePostCaption,
  deletePost as dbDeletePost,
  deleteAsset as dbDeleteAsset
} from './db';

export class IndexedDBGalleryRepository implements GalleryRepository {
  async listPosts(limit: number = 100): Promise<PostWithAsset[]> {
    return await listPostsWithAssets(limit);
  }

  async getPost(id: string): Promise<PostWithAsset | null> {
    const post = await getPostWithAsset(id);
    return post || null;
  }

  async createPost(data: {
    imageBlob: Blob;
    caption?: string;
  }): Promise<PostWithAsset> {
    // Convert Blob to File for uploadImage
    const file = new File([data.imageBlob], 'image.jpg', { type: data.imageBlob.type });
    const { post, asset } = await uploadImage(file);
    
    // Update caption if provided
    if (data.caption) {
      await updatePostCaption(post.id, data.caption);
    }
    
    return {
      id: post.id,
      assetId: post.assetId,
      caption: data.caption || post.caption,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      visibility: post.visibility,
      asset: asset
    };
  }

  async updatePost(id: string, data: { caption?: string }): Promise<void> {
    if (data.caption !== undefined) {
      await updatePostCaption(id, data.caption);
    }
  }

  async deletePost(id: string): Promise<void> {
    // Get post to find assetId
    const post = await getPostWithAsset(id);
    if (post) {
      await dbDeletePost(id);
      await dbDeleteAsset(post.assetId);
    }
  }
}
