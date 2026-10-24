/**
 * CMS banners often store absolute links to the live site (https://www.evplse.com/catalog).
 * Convert those to in-app paths so clicks stay on the current host (localhost, preview, prod).
 */
const OWN_HOSTS = /^(www\.)?(evplse\.com|ignev\.in)$/i;

export function toInternalHref(href?: string | null): string {
  if (!href) return "";
  const h = href.trim();
  if (h.startsWith("/") || h.startsWith("#")) return h;
  try {
    const u = new URL(h, "https://placeholder.invalid");
    if (OWN_HOSTS.test(u.hostname)) return (u.pathname || "/") + u.search + u.hash;
  } catch {
    /* fall through */
  }
  return h;
}

export const isInternalHref = (href?: string | null) => {
  const h = toInternalHref(href);
  return h.startsWith("/") || h.startsWith("#");
};
