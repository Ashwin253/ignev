import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const PDF_EXTS   = new Set([".pdf"]);

export async function GET() {
  try {
    const statsDir = path.join(process.cwd(), "public", "stats");

    if (!fs.existsSync(statsDir)) {
      return NextResponse.json({ images: [], pdfs: [] });
    }

    const files = fs.readdirSync(statsDir);

    const images: string[] = [];
    const pdfs:   string[] = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (IMAGE_EXTS.has(ext)) images.push(`/stats/${file}`);
      else if (PDF_EXTS.has(ext)) pdfs.push(`/stats/${file}`);
    }

    return NextResponse.json({ images, pdfs });
  } catch (err) {
    console.error("stats-files error:", err);
    return NextResponse.json({ images: [], pdfs: [] }, { status: 500 });
  }
}
