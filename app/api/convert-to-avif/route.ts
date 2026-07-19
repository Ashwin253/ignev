import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    // Fetch the image from the given URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch image from URL: ${response.statusText}` }, { status: 400 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert the image using sharp
    const avifBuffer = await sharp(buffer)
      .avif({ quality: 80 })
      .toBuffer();

    // Return the AVIF buffer as response
    return new Response(new Uint8Array(avifBuffer), {
      headers: {
        "Content-Type": "image/avif",
        "Content-Disposition": 'inline; filename="converted.avif"',
      },
    });
  } catch (error: any) {
    console.error("AVIF conversion error:", error);
    return NextResponse.json({ error: error.message || "Failed to convert image to AVIF" }, { status: 500 });
  }
}
