// Image rendering utilities for Day wallpaper export
// Uses sharp for high-quality image processing

import sharp from 'sharp';
import type { ImageEdits } from './presets';

interface RenderOptions {
  width: number;
  height: number;
  background?: string;
}

interface CoverOptions extends RenderOptions {
  edits: ImageEdits;
}

/**
 * Stage 1: Render with contain (letterbox, no distortion)
 * Default safe mode - never stretches, adds letterbox bars
 */
export async function renderContain(
  inputBuffer: Buffer,
  width: number,
  height: number,
  background: string = '#000000'
): Promise<Buffer> {
  try {
    // First, auto-rotate based on EXIF orientation
    const rotated = await sharp(inputBuffer)
      .rotate() // Auto-rotate based on EXIF
      .toBuffer();

    // Then resize with contain fit
    const result = await sharp(rotated)
      .resize(width, height, {
        fit: 'contain',
        background: background,
        position: 'center'
      })
      .jpeg({
        quality: 90,
        mozjpeg: true
      })
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Error in renderContain:', error);
    throw new Error(`Failed to render contain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stage 2: Render with cover + user edits (crop/zoom/rotate)
 * Advanced mode - applies WYSIWYG crop and transformations
 */
export async function renderCoverWithEdits(
  inputBuffer: Buffer,
  width: number,
  height: number,
  edits: ImageEdits
): Promise<Buffer> {
  try {
    // Auto-rotate based on EXIF first
    let pipeline = sharp(inputBuffer).rotate();

    // Apply user rotation if any (in addition to EXIF)
    if (edits.rotation && edits.rotation !== 0) {
      pipeline = pipeline.rotate(edits.rotation, {
        background: '#000000'
      });
    }

    // Get image metadata after rotation
    const metadata = await pipeline.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Failed to read image dimensions');
    }

    // Apply zoom (crop to zoom region)
    if (edits.zoom && edits.zoom > 1) {
      const zoomFactor = edits.zoom;
      const cropWidth = Math.floor(metadata.width / zoomFactor);
      const cropHeight = Math.floor(metadata.height / zoomFactor);
      
      // Center the crop at the specified position
      const left = Math.max(0, Math.floor(edits.crop_x * metadata.width - cropWidth / 2));
      const top = Math.max(0, Math.floor(edits.crop_y * metadata.height - cropHeight / 2));

      pipeline = pipeline.extract({
        left,
        top,
        width: Math.min(cropWidth, metadata.width - left),
        height: Math.min(cropHeight, metadata.height - top)
      });
    }

    // Final resize with cover fit
    const result = await pipeline
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 90,
        mozjpeg: true
      })
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Error in renderCoverWithEdits:', error);
    // Fallback to contain mode on error
    console.warn('Falling back to contain mode due to error');
    return renderContain(inputBuffer, width, height);
  }
}

/**
 * Main render function - routes to contain or cover based on mode
 */
export async function renderDayWallpaper(
  inputBuffer: Buffer,
  width: number,
  height: number,
  mode: 'contain' | 'cover',
  edits?: ImageEdits,
  background: string = '#000000'
): Promise<Buffer> {
  if (mode === 'cover' && edits) {
    return renderCoverWithEdits(inputBuffer, width, height, edits);
  }
  return renderContain(inputBuffer, width, height, background);
}

/**
 * Validate image buffer
 */
export async function validateImageBuffer(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!(metadata.width && metadata.height);
  } catch {
    return false;
  }
}
