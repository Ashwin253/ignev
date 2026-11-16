import { NextResponse } from "next/server";
import { fetchHeroBanners } from "../../lib/supabase";
import { toInternalHref } from "../../lib/links";

export const revalidate = 300;

export async function GET() {
  try {
    const banners = await fetchHeroBanners();
    const heroBanners = banners.map((banner: any) => ({
      id: String(banner.id),
      href: toInternalHref(banner.href || banner.link || ""),
      cta: banner.cta || "",
      details: banner.details || "",
      label: banner.label || "",
      imageHorizontal: banner.imageHorizontal || banner.image_horizontal || "",
      imageVertical: banner.imageVertical || banner.image_vertical || "",
      videoUrl: banner.video_url || banner.videoUrl || "",
    }));
    return NextResponse.json({ heroBanners });
  } catch {
    return NextResponse.json({ heroBanners: [] });
  }
}
