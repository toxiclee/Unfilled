// Day wallpaper export API
// GET /api/export/day-image?dayId=...&preset=...&mode=contain

import { NextRequest, NextResponse } from 'next/server';
import { getPreset, type PresetId, type FitMode } from '../../../../lib/export/presets';
import { renderDayWallpaper } from '../../../../lib/export/renderer';
import { getSupabaseClient } from '../../../../lib/supabase/client';
import type { ImageEdits } from '../../../../lib/export/presets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dayId = searchParams.get('dayId');
    const presetParam = searchParams.get('preset') as PresetId | null;
    const modeParam = searchParams.get('mode') as FitMode | null;

    // Validate required params
    if (!dayId) {
      return NextResponse.json(
        { error: 'Missing dayId parameter' },
        { status: 400 }
      );
    }

    if (!presetParam) {
      return NextResponse.json(
        { error: 'Missing preset parameter' },
        { status: 400 }
      );
    }

    // Validate preset
    const preset = getPreset(presetParam);
    if (!preset) {
      return NextResponse.json(
        { error: 'Invalid preset' },
        { status: 400 }
      );
    }

    const mode: FitMode = modeParam === 'cover' ? 'cover' : 'contain';

    // Get base image from client (sent as base64 in query or POST body)
    // For now, we expect the client to send the canvas data via POST
    return NextResponse.json(
      { error: 'Please use POST method with image data' },
      { status: 405 }
    );

  } catch (error) {
    console.error('Error in day-image export:', error);
    return NextResponse.json(
      { error: 'Failed to export wallpaper' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dayId = searchParams.get('dayId');
    const presetParam = searchParams.get('preset') as PresetId | null;
    const modeParam = searchParams.get('mode') as FitMode | null;
    const backgroundParam = searchParams.get('background') || '#000000';

    // Validate required params
    if (!dayId) {
      return NextResponse.json(
        { error: 'Missing dayId parameter' },
        { status: 400 }
      );
    }

    if (!presetParam) {
      return NextResponse.json(
        { error: 'Missing preset parameter' },
        { status: 400 }
      );
    }

    // Validate preset
    const preset = getPreset(presetParam);
    if (!preset) {
      return NextResponse.json(
        { error: 'Invalid preset' },
        { status: 400 }
      );
    }

    const mode: FitMode = modeParam === 'cover' ? 'cover' : 'contain';

    // Get image data from request body
    const contentType = request.headers.get('content-type');
    let inputBuffer: Buffer;

    if (contentType?.includes('application/json')) {
      // Expect base64 encoded image
      const body = await request.json();
      if (!body.imageData) {
        return NextResponse.json(
          { error: 'Missing imageData in request body' },
          { status: 400 }
        );
      }

      // Remove data URL prefix if present
      const base64Data = body.imageData.replace(/^data:image\/\w+;base64,/, '');
      inputBuffer = Buffer.from(base64Data, 'base64');
    } else if (contentType?.includes('image/')) {
      // Raw image data
      const arrayBuffer = await request.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/json or image/*' },
        { status: 400 }
      );
    }

    // Load edits from Supabase if mode is cover
    let edits: ImageEdits | undefined;
    if (mode === 'cover') {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('image_edits')
          .select('*')
          .eq('image_id', dayId)
          .eq('preset', presetParam)
          .single();

        if (data && !error) {
          edits = data as ImageEdits;
        } else {
          console.warn('No edits found for cover mode, falling back to contain');
        }
      } catch (error) {
        console.warn('Failed to load edits from Supabase:', error);
        // Continue without edits (will use contain mode)
      }
    }

    // Render the wallpaper
    const outputBuffer = await renderDayWallpaper(
      inputBuffer,
      preset.width,
      preset.height,
      mode,
      edits,
      backgroundParam
    );

    // Return as downloadable image
    const filename = `unfilled-day-${dayId}-${presetParam}.jpg`;
    
    return new NextResponse(Buffer.from(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error in day-image export:', error);
    return NextResponse.json(
      { error: 'Failed to export wallpaper', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
