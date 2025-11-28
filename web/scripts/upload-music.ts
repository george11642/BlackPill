/**
 * Script to download royalty-free music tracks and upload them to Supabase
 * 
 * These tracks are from CC0/public domain sources:
 * - Kevin MacLeod (incompetech.com) - CC BY 3.0
 * - Free Music Archive CC0 tracks
 * 
 * Run with: npx tsx scripts/upload-music.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Royalty-free music tracks with direct download URLs
// These are from Kevin MacLeod (incompetech.com) - CC BY 3.0 license
// and other CC0/public domain sources
const musicTracks = [
  {
    id: 'f334dbc0-c08d-4165-a18e-d3850a2d8866', // Rise Up
    name: 'Rise Up',
    description: 'Uplifting motivational track',
    mood: 'inspiring',
    // Kevin MacLeod - Inspired (similar feel to Rise Up)
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Inspired.mp3',
    filename: 'rise-up.mp3',
    duration: 180,
  },
  {
    id: '1befbc02-5a18-4dc4-a69c-c54156a02b36', // Chill Vibes
    name: 'Chill Vibes',
    description: 'Relaxed lo-fi beats',
    mood: 'chill',
    // Kevin MacLeod - Carefree
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3',
    filename: 'chill-vibes.mp3',
    duration: 180,
  },
  {
    id: '3caef37e-432f-4cc4-9624-ff36f3411540', // Epic Journey
    name: 'Epic Journey',
    description: 'Dramatic cinematic score',
    mood: 'dramatic',
    // Kevin MacLeod - Epic Unease
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Epic%20Unease.mp3',
    filename: 'epic-journey.mp3',
    duration: 180,
  },
  {
    id: 'a4d65204-0900-46b7-a5e7-ac3d1cbb2cdd', // Feel Good
    name: 'Feel Good',
    description: 'Upbeat positive energy',
    mood: 'upbeat',
    // Kevin MacLeod - Happy Boy End Theme
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Happy%20Boy%20End%20Theme.mp3',
    filename: 'feel-good.mp3',
    duration: 180,
  },
  {
    id: '6f5212cb-9120-42fe-a26d-0654209b7c2d', // Transformation
    name: 'Transformation',
    description: 'Building momentum track',
    mood: 'inspiring',
    // Kevin MacLeod - Breaktime (smaller file)
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Breaktime.mp3',
    filename: 'transformation.mp3',
    duration: 180,
  },
];

async function downloadFile(url: string): Promise<Buffer> {
  console.log(`Downloading: ${url}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToSupabase(
  buffer: Buffer,
  filename: string
): Promise<string> {
  console.log(`Uploading to Supabase: ${filename}`);
  
  const { data, error } = await supabase.storage
    .from('music')
    .upload(`timelapse/${filename}`, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload ${filename}: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('music')
    .getPublicUrl(`timelapse/${filename}`);

  return urlData.publicUrl;
}

async function updateDatabase(trackId: string, filePath: string): Promise<void> {
  console.log(`Updating database for track ${trackId}`);
  
  const { error } = await supabase
    .from('timelapse_music_tracks')
    .update({ file_path: filePath })
    .eq('id', trackId);

  if (error) {
    throw new Error(`Failed to update database: ${error.message}`);
  }
}

async function main() {
  console.log('Starting music upload process...\n');

  for (const track of musicTracks) {
    try {
      console.log(`\n--- Processing: ${track.name} ---`);
      
      // Download the file
      const buffer = await downloadFile(track.url);
      console.log(`Downloaded ${buffer.length} bytes`);
      
      // Upload to Supabase
      const publicUrl = await uploadToSupabase(buffer, track.filename);
      console.log(`Uploaded to: ${publicUrl}`);
      
      // Update database
      await updateDatabase(track.id, publicUrl);
      console.log(`Database updated for ${track.name}`);
      
      console.log(`✅ ${track.name} completed successfully!`);
    } catch (error) {
      console.error(`❌ Error processing ${track.name}:`, error);
    }
  }

  console.log('\n=== Music upload process completed ===');
}

main().catch(console.error);

