// Shared Supabase Storage settings for the team dashboard uploads.

// Cache lifetime for uploaded objects, in seconds (31 days). Supabase stores
// this as `Cache-Control: max-age=<seconds>` on the object itself, so it
// applies from the moment of upload — browsers and Supabase's CDN reuse the
// file instead of re-downloading it.
//
// Next.js's image optimizer uses whichever is larger between this and
// `images.minimumCacheTTL` in next.config.ts, so the two are kept in sync.
export const UPLOAD_CACHE_CONTROL = "2678400"; // 31 days
