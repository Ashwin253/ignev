/**
 * WordPress REST API helpers
 *
 * Required env vars:
 *   WP_BASE_URL          e.g. https://yoursite.com  (no trailing slash)
 *   WP_APP_USERNAME      WordPress application-password username
 *   WP_APP_PASSWORD      WordPress application password (spaces stripped)
 *
 * Optional:
 *   WP_LEADS_POST_TYPE   custom post type slug for leads (default: "ev-lead")
 *   WP_TEAM_POST_TYPE    custom post type slug for team members (default: "ev-team")
 */

function wpBase() {
  return (process.env.WP_BASE_URL ?? "").replace(/\/$/, "");
}

function wpAuthHeader() {
  const user = process.env.WP_APP_USERNAME ?? "";
  const pass = (process.env.WP_APP_PASSWORD ?? "").replace(/\s/g, "");
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

export function wpEnabled() {
  return !!(process.env.WP_BASE_URL && process.env.WP_APP_USERNAME && process.env.WP_APP_PASSWORD);
}

// ── Types ────────────────────────────────────────────────────────────────────

export type WPLead = {
  id: number;
  name: string;
  phone: string;
  pincode: string;
  interest: string;
  message: string;
  createdAt: string;
};

export type WPTeamMember = {
  id: number;
  mobile: string;
  passwordHash: string; // stored as a meta field — plain text for internal MIS
};

// ── Leads ────────────────────────────────────────────────────────────────────

const leadsPostType = () => process.env.WP_LEADS_POST_TYPE ?? "ev-lead";

/**
 * Create a new lead post in WordPress.
 * The post title is the submitter's name; extra fields go into post meta.
 */
export async function createWPLead(data: {
  name: string;
  phone: string;
  pincode: string;
  interest: string;
  message?: string;
}): Promise<void> {
  const base = wpBase();
  const url = `${base}/wp-json/wp/v2/${leadsPostType()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: wpAuthHeader(),
    },
    body: JSON.stringify({
      title: data.name,
      status: "publish",
      meta: {
        phone: data.phone,
        pincode: data.pincode,
        interest: data.interest,
        message: data.message ?? "",
        source: "get-assist",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WP create lead failed (${res.status}): ${text}`);
  }
}

/**
 * Fetch all leads from WordPress (newest first, up to 100).
 */
export async function fetchWPLeads(): Promise<WPLead[]> {
  const base = wpBase();
  const url = `${base}/wp-json/wp/v2/${leadsPostType()}?per_page=100&orderby=date&order=desc&_fields=id,title,meta,date`;

  const res = await fetch(url, {
    headers: { Authorization: wpAuthHeader() },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`WP fetch leads failed (${res.status})`);
  }

  const posts = (await res.json()) as Array<{
    id: number;
    title: { rendered: string };
    meta: Record<string, string>;
    date: string;
  }>;

  return posts.map((p) => ({
    id: p.id,
    name: p.title.rendered,
    phone: p.meta?.phone ?? "",
    pincode: p.meta?.pincode ?? "",
    interest: p.meta?.interest ?? "",
    message: p.meta?.message ?? "",
    createdAt: p.date,
  }));
}

// ── Team auth ────────────────────────────────────────────────────────────────

const teamPostType = () => process.env.WP_TEAM_POST_TYPE ?? "ev-team";

/**
 * Verify a team member's mobile + password against WordPress.
 * Looks up a custom post type where the title = mobile and meta.password = password.
 */
export async function verifyWPTeamMember(
  mobile: string,
  password: string
): Promise<boolean> {
  const base = wpBase();
  const encoded = encodeURIComponent(mobile);
  const url = `${base}/wp-json/wp/v2/${teamPostType()}?search=${encoded}&per_page=1&_fields=id,title,meta`;

  const res = await fetch(url, {
    headers: { Authorization: wpAuthHeader() },
    cache: "no-store",
  });

  if (!res.ok) return false;

  const posts = (await res.json()) as Array<{
    id: number;
    title: { rendered: string };
    meta: Record<string, string>;
  }>;

  const member = posts.find((p) => p.title.rendered === mobile);
  if (!member) return false;

  return member.meta?.password === password;
}
