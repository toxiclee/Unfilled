// Export presets for Day mode wallpapers

export type ExportKind = 'day_image';

export type PresetId = 
  | 'phone_high' 
  | 'phone_compat' 
  | 'desktop_1080p' 
  | 'desktop_2k';

export interface ExportPreset {
  id: PresetId;
  label: string;
  width: number;
  height: number;
  category: 'phone' | 'desktop';
  aspectRatio: string;
}

export const EXPORT_PRESETS: Record<PresetId, ExportPreset> = {
  phone_high: {
    id: 'phone_high',
    label: 'Phone (High Resolution)',
    width: 1290,
    height: 2796,
    category: 'phone',
    aspectRatio: '19.5:9'
  },
  phone_compat: {
    id: 'phone_compat',
    label: 'Phone (Universal)',
    width: 1080,
    height: 1920,
    category: 'phone',
    aspectRatio: '9:16'
  },
  desktop_1080p: {
    id: 'desktop_1080p',
    label: 'Desktop 1080p',
    width: 1920,
    height: 1080,
    category: 'desktop',
    aspectRatio: '16:9'
  },
  desktop_2k: {
    id: 'desktop_2k',
    label: 'Desktop 2K',
    width: 2560,
    height: 1440,
    category: 'desktop',
    aspectRatio: '16:9'
  }
};

export type FitMode = 'contain' | 'cover';

export interface ImageEdits {
  image_id: string;
  preset: PresetId;
  crop_x: number;
  crop_y: number;
  zoom: number;
  rotation: number;
  fit_mode: FitMode;
}

export function getPresetsByCategory(category: 'phone' | 'desktop'): ExportPreset[] {
  return Object.values(EXPORT_PRESETS).filter(p => p.category === category);
}

export function getPreset(presetId: PresetId): ExportPreset {
  return EXPORT_PRESETS[presetId];
}

export function getDefaultPreset(category: 'phone' | 'desktop'): PresetId {
  return category === 'phone' ? 'phone_high' : 'desktop_1080p';
}
