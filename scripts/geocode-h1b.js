#!/usr/bin/env node

/**
 * Geocode H-1B worksite addresses
 * Uses Census Bureau geocoder (free, no API key)
 *
 * Usage:
 *   node scripts/geocode-h1b.js [--limit=100] [--dry-run]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const dryRun = args.includes('--dry-run');
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

// Delay between requests (Census geocoder has no official limit but be respectful)
const DELAY_MS = 200;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Census Bureau geocoder
async function geocodeCensus(city, state, zip) {
  const address = `${city}, ${state} ${zip || ''}`.trim();
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.result?.addressMatches?.length > 0) {
      const match = data.result.addressMatches[0];
      return {
        latitude: match.coordinates.y,
        longitude: match.coordinates.x,
        matched: match.matchedAddress
      };
    }
    return null;
  } catch (err) {
    console.error(`  Geocode error for ${address}:`, err.message);
    return null;
  }
}

// Fallback: city center lookup via Nominatim
async function geocodeNominatim(city, state) {
  const query = `${city}, ${state}, USA`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SomaliScan/1.0 (fraud-transparency-project)' }
    });
    const data = await res.json();

    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        matched: data[0].display_name
      };
    }
    return null;
  } catch (err) {
    console.error(`  Nominatim error for ${city}, ${state}:`, err.message);
    return null;
  }
}

async function geocodeH1B() {
  console.log('\n=== H-1B Worksite Geocoder ===');
  console.log(`Dry run: ${dryRun}`);
  console.log(`Limit: ${limit || 'None'}\n`);

  // Get unique city/state/zip combinations that need geocoding
  let query = supabase
    .from('h1b_applications')
    .select('worksite_city, worksite_state, worksite_postal_code')
    .is('latitude', null);

  const { data: allRecords, error } = await query;

  if (error) {
    console.error('Query error:', error);
    return;
  }

  // Group by unique location
  const locations = new Map();
  allRecords?.forEach(r => {
    const key = `${r.worksite_city}|${r.worksite_state}|${r.worksite_postal_code || ''}`;
    if (!locations.has(key)) {
      locations.set(key, {
        city: r.worksite_city,
        state: r.worksite_state,
        zip: r.worksite_postal_code,
        count: 0
      });
    }
    locations.get(key).count++;
  });

  console.log(`Records needing geocoding: ${allRecords?.length}`);
  console.log(`Unique locations: ${locations.size}`);

  // Sort by count (geocode most common first)
  const sortedLocations = [...locations.values()].sort((a, b) => b.count - a.count);
  const toProcess = limit ? sortedLocations.slice(0, limit) : sortedLocations;

  console.log(`Processing: ${toProcess.length} locations\n`);

  let geocoded = 0;
  let failed = 0;
  let updated = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const loc = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    process.stdout.write(`${progress} ${loc.city}, ${loc.state} ${loc.zip || ''} (${loc.count} records)... `);

    // Try Census first
    let result = await geocodeCensus(loc.city, loc.state, loc.zip);

    // Fallback to Nominatim if Census fails
    if (!result) {
      await sleep(1000); // Nominatim requires 1 req/sec
      result = await geocodeNominatim(loc.city, loc.state);
      if (result) {
        console.log(`Nominatim: ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`);
      }
    } else {
      console.log(`Census: ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`);
    }

    if (result) {
      geocoded++;

      if (!dryRun) {
        // Update all records matching this location
        const { data: updatedData, error: updateError } = await supabase
          .from('h1b_applications')
          .update({
            latitude: result.latitude,
            longitude: result.longitude
          })
          .eq('worksite_city', loc.city)
          .eq('worksite_state', loc.state)
          .is('latitude', null)
          .select('id');

        if (updateError) {
          console.error(`  Update error:`, updateError.message);
        } else {
          updated += updatedData?.length || 0;
        }
      } else {
        updated += loc.count;
      }
    } else {
      console.log('FAILED');
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log('\n=== Geocoding Complete ===');
  console.log(`Locations geocoded: ${geocoded}`);
  console.log(`Locations failed: ${failed}`);
  console.log(`Records updated: ${updated}`);

  // Check remaining
  const { count } = await supabase
    .from('h1b_applications')
    .select('*', { count: 'exact', head: true })
    .is('latitude', null);

  console.log(`Remaining without geocoding: ${count}`);
}

geocodeH1B().catch(console.error);
