"use client";

import { useState } from "react";
import { getSafeReviewUrl } from "../lib/media-ratings";

export default function MediaSourceLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null | undefined;
}) {
  const imageUrl = getSafeReviewUrl(logoUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
      {imageUrl && failedUrl !== imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(imageUrl)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span aria-hidden="true" className="text-xs font-extrabold uppercase text-slate-500">
          {name.trim().slice(0, 2) || "EV"}
        </span>
      )}
    </span>
  );
}
