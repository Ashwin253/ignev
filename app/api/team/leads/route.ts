import { NextRequest, NextResponse } from "next/server";
import { fetchWPLeads, wpEnabled } from "@/app/lib/wordpress";
import { verifyTeamSessionToken } from "@/app/lib/team-session";

export async function GET(req: NextRequest) {
  try {
    const token   = req.cookies.get("team_session")?.value;
    const session = verifyTeamSessionToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!wpEnabled()) {
      return NextResponse.json(
        { error: "Backend not configured. Set WP_BASE_URL, WP_APP_USERNAME, and WP_APP_PASSWORD." },
        { status: 503 }
      );
    }

    const leads = await fetchWPLeads();
    return NextResponse.json({ leads, total: leads.length });
  } catch (error) {
    console.error("Fetch team leads error:", error);
    return NextResponse.json({ error: "Failed to fetch leads." }, { status: 500 });
  }
}
