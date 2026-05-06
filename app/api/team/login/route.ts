import { NextResponse } from "next/server";
import { verifyWPTeamMember, wpEnabled } from "@/app/lib/wordpress";
import { createTeamSessionToken } from "@/app/lib/team-session";

export async function POST(req: Request) {
  try {
    const body     = await req.json();
    const mobile   = String(body?.mobile   ?? "").trim();
    const password = String(body?.password ?? "").trim();

    if (!mobile || !password) {
      return NextResponse.json(
        { error: "Mobile and password are required." },
        { status: 400 }
      );
    }

    if (!wpEnabled()) {
      return NextResponse.json(
        { error: "Backend not configured. Set WP_BASE_URL, WP_APP_USERNAME, and WP_APP_PASSWORD." },
        { status: 503 }
      );
    }

    const valid = await verifyWPTeamMember(mobile, password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid mobile or password." }, { status: 401 });
    }

    const token = createTeamSessionToken(mobile);
    const response = NextResponse.json({ ok: true, mobile });
    response.cookies.set("team_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Team login error:", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
