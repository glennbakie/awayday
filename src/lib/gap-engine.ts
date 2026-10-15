import { supabase } from '@/lib/supabase';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

export interface GapFuelOption {
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  type?: string;
  category: 'quick-fuel' | 'sit-down' | 'coffee';
}

/**
 * Calculates dining options based on free window between games (-30m buffer).
 */
export async function calculateGapFuel(
  venueId: string,
  venueLat: number,
  venueLng: number,
  gapMinutes: number,
  startTime: string, // ISO string of Game N end time
  endTime: string    // ISO string of Game N+1 tipoff time
): Promise<GapFuelOption[]> {
  // Check Supabase cache
  const { data: cached } = await supabase
    .from('cached_gap_venues')
    .select('places_json')
    .eq('venue_id', venueId)
    .eq('start_time', startTime)
    .eq('end_time', endTime)
    .single();

  if (cached && cached.places_json) {
    return cached.places_json as GapFuelOption[];
  }

  const availableTime = gapMinutes - 30; // 30 min buffer for warmup/arrival
  if (availableTime <= 0) return []; // No time to eat

  let radius = 2000;
  let includedTypes = ['restaurant', 'cafe', 'fast_food'];
  let category: GapFuelOption['category'] = 'quick-fuel';

  if (availableTime < 60) {
    radius = 2000;
    includedTypes = ['fast_food', 'cafe', 'sandwich_shop'];
    category = 'quick-fuel';
  } else if (availableTime <= 120) {
    radius = 4000;
    includedTypes = ['restaurant', 'cafe', 'fast_food'];
    category = 'quick-fuel'; // Fast casual
  } else {
    radius = 6000;
    includedTypes = ['restaurant'];
    category = 'sit-down';
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.primaryType'
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center: {
              latitude: venueLat,
              longitude: venueLng
            },
            radius: radius
          }
        }
      })
    });

    if (!response.ok) {
      console.error('Google Places API Error', await response.text());
      return [];
    }

    const data = await response.json();
    const options: GapFuelOption[] = (data.places || []).map((place: any) => ({
      name: place.displayName?.text,
      address: place.formattedAddress,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      type: place.primaryType,
      category: category
    }));

    // Cache the result
    await supabase.from('cached_gap_venues').insert({
      venue_id: venueId,
      start_time: startTime,
      end_time: endTime,
      places_json: options
    });

    return options;
  } catch (error) {
    console.error('Error fetching gap fuel options:', error);
    return [];
  }
}
