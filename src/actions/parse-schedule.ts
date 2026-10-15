'use server';

import { ai } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { addMinutes } from 'date-fns';

export interface ParseScheduleResponse {
  success: boolean;
  shareSlug?: string;
  error?: string;
  data?: any;
}

export async function parseAndSaveSchedule(formData: FormData): Promise<ParseScheduleResponse> {
  const file = formData.get('file') as File | null;
  const text = formData.get('text') as string | null;

  if (!file && !text) {
    return { success: false, error: 'Please provide either a file or pasted text.' };
  }

  try {
    const promptParts: any[] = [
      { text: `Extract the schedule details from the provided content. 
       Return a structured JSON object matching the requested schema. 
       Use the current year if it's missing in dates, and assume times are local. 
       For the sport, default to "basketball" if unspecified.` }
    ];

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        }
      });
    }

    if (text) {
      promptParts.push({ text });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: promptParts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            tournament_name: { type: 'STRING' },
            sport: { type: 'STRING' },
            team_name: { type: 'STRING' },
            hotel_name: { type: 'STRING', nullable: true },
            hotel_address: { type: 'STRING', nullable: true },
            games: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  opponent: { type: 'STRING' },
                  tipoff_time: { type: 'STRING', description: 'ISO 8601 string' },
                  venue_name: { type: 'STRING' },
                  venue_address: { type: 'STRING' },
                  court_label: { type: 'STRING' },
                },
                required: ['opponent', 'tipoff_time', 'venue_name', 'venue_address', 'court_label'],
              }
            }
          },
          required: ['tournament_name', 'sport', 'team_name', 'games'],
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");

    const parsedData = JSON.parse(resultText);
    
    // Save to Supabase: upsert tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .upsert({ name: parsedData.tournament_name, sport: parsedData.sport || 'basketball' }, { onConflict: 'name' })
      .select('id')
      .single();
    
    if (tournamentError) throw tournamentError;

    // Create team trip
    const baseSlug = `${parsedData.team_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const shareSlug = `${baseSlug}-${randomSuffix}`;

    const { data: teamTrip, error: tripError } = await supabase
      .from('team_trips')
      .insert({
        tournament_id: tournament.id,
        team_name: parsedData.team_name,
        hotel_name: parsedData.hotel_name || null,
        hotel_address: parsedData.hotel_address || null,
        share_slug: shareSlug
      })
      .select('id')
      .single();

    if (tripError) throw tripError;

    // Insert games and upsert venues
    for (const game of parsedData.games) {
      // Upsert venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .upsert({ name: game.venue_name, address: game.venue_address }, { onConflict: 'name' })
        .select('id')
        .single();
      
      if (venueError) throw venueError;

      const tipoffTime = new Date(game.tipoff_time);
      const estimatedEndTime = addMinutes(tipoffTime, 60);

      const { error: gameError } = await supabase
        .from('games')
        .insert({
          trip_id: teamTrip.id,
          opponent: game.opponent,
          tipoff_time: tipoffTime.toISOString(),
          estimated_end_time: estimatedEndTime.toISOString(),
          venue_id: venue.id,
          court_label: game.court_label
        });
        
      if (gameError) throw gameError;
    }

    return { success: true, shareSlug, data: parsedData };

  } catch (error: any) {
    console.error('Error parsing schedule:', error);
    return { success: false, error: error.message || 'Failed to parse schedule.' };
  }
}
