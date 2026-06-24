import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const response = await fetch(url, { redirect: "follow" });
    const finalUrl = response.url;

    let name = "";
    let lat = null;
    let lng = null;

    // Parse name from /place/Name+Here/
    const placeMatch = finalUrl.match(/\/place\/([^/]+)\//);
    if (placeMatch) {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    }

    // Parse lat/lng from !3d... !4d...
    const d3Match = finalUrl.match(/!3d(-?\d+\.\d+)/);
    const d4Match = finalUrl.match(/!4d(-?\d+\.\d+)/);

    if (d3Match && d4Match) {
      lat = parseFloat(d3Match[1]);
      lng = parseFloat(d4Match[1]);
    } else {
      // Fallback to @lat,lng
      const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        lat = parseFloat(atMatch[1]);
        lng = parseFloat(atMatch[2]);
      }
    }

    // Additional check for google.com/maps?q=lat,lng format
    if (!lat || !lng) {
      const qMatch = finalUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        lat = parseFloat(qMatch[1]);
        lng = parseFloat(qMatch[2]);
      }
    }

    return NextResponse.json({ name, lat, lng, finalUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
