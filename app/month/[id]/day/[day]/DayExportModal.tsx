"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { 
  getPresetsByCategory, 
  getDefaultPreset, 
  getPreset,
  type PresetId, 
  type FitMode 
} from '../../../../../lib/export/presets';
import { getSupabaseClient } from '../../../../../lib/supabase/client';

interface DayExportModalProps {
  dayId: string;
  onClose: () => void;
  onGenerateCanvas: () => Promise<HTMLCanvasElement | null>;
}

interface Point {
  x: number;
  y: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function DayExportModal({ dayId, onClose, onGenerateCanvas }: DayExportModalProps) {
  const [category, setCategory] = useState<'phone' | 'desktop'>('phone');
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(getDefaultPreset('phone'));
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [showEditor, setShowEditor] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Crop editor state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Update preset when category changes
  useEffect(() => {
    setSelectedPreset(getDefaultPreset(category));
  }, [category]);

  // Generate preview image for cropper
  useEffect(() => {
    if (showEditor && !previewImage) {
      onGenerateCanvas().then(canvas => {
        if (canvas) {
          setPreviewImage(canvas.toDataURL('image/jpeg', 0.92));
        }
      });
    }
  }, [showEditor, previewImage, onGenerateCanvas]);

  const onCropComplete = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Generate canvas
      const canvas = await onGenerateCanvas();
      if (!canvas) {
        alert('Failed to generate wallpaper');
        return;
      }

      // Convert canvas to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.92);

      // Save edits if in cover mode and editor was used
      if (fitMode === 'cover' && showEditor) {
        await saveEdits();
      }

      // Call API to process with preset
      const preset = getPreset(selectedPreset);
      const url = `/api/export/day-image?dayId=${encodeURIComponent(dayId)}&preset=${selectedPreset}&mode=${fitMode}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Download the result
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `unfilled-day-${dayId}-${selectedPreset}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);

      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const saveEdits = async () => {
    try {
      const supabase = getSupabaseClient();
      
      // Normalize crop position (0-1 range)
      const cropX = croppedAreaPixels ? croppedAreaPixels.x / 1920 : 0.5; // Assuming base canvas is 1920
      const cropY = croppedAreaPixels ? croppedAreaPixels.y / 1080 : 0.5;

      const edits = {
        image_id: dayId,
        preset: selectedPreset,
        crop_x: cropX,
        crop_y: cropY,
        zoom: zoom,
        rotation: rotation,
        fit_mode: fitMode,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('image_edits')
        .upsert(edits, {
          onConflict: 'image_id,preset'
        });

      if (error) {
        console.error('Failed to save edits:', error);
      }
    } catch (error) {
      console.error('Error saving edits:', error);
      // Non-fatal, continue with export
    }
  };

  const handleRotate = (degrees: number) => {
    setRotation((prev) => {
      const newRotation = prev + degrees;
      // Normalize to -180 to 180
      if (newRotation > 180) return newRotation - 360;
      if (newRotation < -180) return newRotation + 360;
      return newRotation;
    });
  };

  const phonePresets = getPresetsByCategory('phone');
  const desktopPresets = getPresetsByCategory('desktop');
  const currentPresets = category === 'phone' ? phonePresets : desktopPresets;
  const currentPreset = getPreset(selectedPreset);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#fff',
          borderRadius: 8,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Export Wallpaper</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>Download as device wallpaper</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Category tabs */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#333' }}>
              Device Type
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCategory('phone')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: category === 'phone' ? 600 : 400,
                  border: category === 'phone' ? '2px solid #333' : '1px solid #ddd',
                  borderRadius: 4,
                  background: category === 'phone' ? '#f9f9f9' : '#fff',
                  color: '#333',
                  cursor: 'pointer'
                }}
              >
                Phone
              </button>
              <button
                onClick={() => setCategory('desktop')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: category === 'desktop' ? 600 : 400,
                  border: category === 'desktop' ? '2px solid #333' : '1px solid #ddd',
                  borderRadius: 4,
                  background: category === 'desktop' ? '#f9f9f9' : '#fff',
                  color: '#333',
                  cursor: 'pointer'
                }}
              >
                Desktop
              </button>
            </div>
          </div>

          {/* Preset selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#333' }}>
              Screen Size & Resolution
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value as PresetId)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: '1px solid #ddd',
                borderRadius: 4,
                background: '#fff',
                color: '#333'
              }}
            >
              {currentPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} ({preset.width} × {preset.height})
                </option>
              ))}
            </select>
          </div>

          {/* Fit mode toggle */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#333' }}>
              Fit Mode
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 8,
              cursor: 'pointer',
              fontSize: 14
            }}>
              <input
                type="checkbox"
                checked={fitMode === 'cover'}
                onChange={(e) => {
                  const newMode = e.target.checked ? 'cover' : 'contain';
                  setFitMode(newMode);
                  if (newMode === 'contain') {
                    setShowEditor(false);
                  }
                }}
                style={{ cursor: 'pointer', marginTop: 2 }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Fill entire screen (may crop edges)</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  {fitMode === 'cover' 
                    ? 'Image will be cropped to fill screen perfectly'
                    : 'Unchecked: Safe mode with letterbox bars, no cropping'}
                </div>
              </div>
            </label>
          </div>

          {/* Crop editor toggle */}
          {fitMode === 'cover' && (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setShowEditor(!showEditor)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: 14,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  background: showEditor ? '#f0f0f0' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{showEditor ? '✓ ' : ''}Adjust Crop Position</span>
                <span style={{ fontSize: 12, color: '#999' }}>{showEditor ? 'Hide' : 'Show'}</span>
              </button>
            </div>
          )}

          {/* Crop editor */}
          {showEditor && fitMode === 'cover' && previewImage && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: 300,
                background: '#000',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <Cropper
                  image={previewImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={currentPreset.width / currentPreset.height}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Crop controls */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500 }}>
                    Zoom
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500 }}>
                    Rotation
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleRotate(-90)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: 13,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        background: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      ↺ -90°
                    </button>
                    <button
                      onClick={() => handleRotate(90)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: 13,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        background: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      ↻ +90°
                    </button>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 4 }}>
                    {rotation}°
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #ddd',
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={exporting}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 4,
              background: '#fff',
              color: '#333',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              borderRadius: 4,
              background: exporting ? '#999' : '#333',
              color: '#fff',
              cursor: exporting ? 'not-allowed' : 'pointer'
            }}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
