import fs from 'fs';

const cities = [
  'bengaluru', 'gurgaon', 'delhi', 'mumbai', 'hyderabad', 'jaipur', 'nashik', 'meerut', 
  'pune', 'ahmedabad', 'noida', 'mangaluru', 'dehradun', 'goa', 'lucknow', 'chandigarh', 
  'surat', 'kolkata', 'chennai', 'mysore', 'udaipur', 'ludhiana', 'nagpur', 'indore', 
  'raipur', 'agra', 'vijaywada', 'aurangabad', 'cuttack', 'ranchi', 'vadodara', 'kanpur', 
  'rajkot', 'madurai'
];

async function scrapeAll() {
  const uniqueStations = new Map();

  for (const city of cities) {
    const url = `https://www.statiq.in/${city}-ev-charging-station`;
    console.log(`Fetching ${url}...`);
    try {
      const res = await fetch(url);
      const html = await res.text();

      // Look for station_name, latitude, longitude
      const regex = /\\"station_name\\":\\"(.*?)\\",\\"latitude\\":([0-9.-]+),\\"longitude\\":([0-9.-]+)/g;
      let match;
      let count = 0;
      while ((match = regex.exec(html)) !== null) {
        const name = match[1].replace(/\\\\/g, '\\');
        const lat = parseFloat(match[2]);
        const lng = parseFloat(match[3]);
        
        const key = `${lat},${lng}`;
        if (!uniqueStations.has(key)) {
          uniqueStations.set(key, { name, lat, lng });
          count++;
        }
      }
      console.log(`  -> Found ${count} new stations in ${city}`);
    } catch (err) {
      console.error(`  -> Error fetching ${city}: ${err.message}`);
    }
  }

  const allStations = Array.from(uniqueStations.values());
  console.log(`\nTotal unique stations found: ${allStations.length}`);

  fs.writeFileSync('public/statiq_stations.json', JSON.stringify(allStations, null, 2));
  console.log('Saved to public/statiq_stations.json');
}

scrapeAll();
