
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const allLocations = [
  { type: "charging", lat: 28.638807, lng: 77.085715, name: "EV Fast Charger",       address: "West Delhi" },
  { type: "charging", lat: 28.600843, lng: 77.087613, name: "Supercharger IndianOil", address: "North Delhi" },
  { type: "spare",    lat: 28.627204, lng: 77.071554, name: "EV Repair and Spare",    address: "West Delhi" },
];

async function main() {
  const payload = allLocations.map(loc => ({
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    address: loc.address,
    city: loc.address,
    network: "Internal",
    type: loc.type,
    is_active: true,
    added_by_email: "admin@evplse.com"
  }));

  const { data, error } = await supabase.from("ev_stations").insert(payload).select();
  if (error) {
    console.error("Error inserting data:", error);
  } else {
    console.log("Successfully inserted:", data.length, "rows.");
  }
}

main();
