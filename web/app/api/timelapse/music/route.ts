import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface MusicTrack {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  duration_seconds: number;
  mood: string | null;
}

/**
 * GET /api/timelapse/music
 * Get available background music tracks for timelapse videos
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    const { data: tracks, error } = await supabase
      .from('timelapse_music_tracks')
      .select('id, name, description, file_path, duration_seconds, mood')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    // Generate URLs for each track
    const tracksWithUrls: MusicTrack[] = (tracks || []).map((track) => ({
      id: track.id,
      name: track.name,
      description: track.description,
      file_url: track.file_path,
      duration_seconds: track.duration_seconds,
      mood: track.mood,
    }));

    return NextResponse.json({
      tracks: tracksWithUrls,
    });
  } catch (error) {
    console.error('Error fetching music tracks:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch music tracks',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
