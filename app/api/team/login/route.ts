import { NextResponse } from "next/server";
import { Query } from "appwrite";
import { getServerDatabases } from "@/app/lib/appwrite-server";
import { createTeamSessionToken } from "@/app/lib/team-session";

const databaseId = process.env.APPWRITE_DATABASE_ID || "";
const teamCollectionId = process.env.APPWRITE_TEAM_COLLECTION_ID || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mobile = String(body?.mobile || "").trim();
    const password = String(body?.password || "").trim();

    if (!mobile || !password) {
      return NextResponse.json({ error: "Mobile and password are required." }, { status: 400 });
    }

    if (!databaseId || !teamCollectionId) {
      return NextResponse.json(
        { error: "Missing APPWRITE_DATABASE_ID or APPWRITE_TEAM_COLLECTION_ID in environment." },
        { status: 500 }
      );
    }

    const databases = getServerDatabases();
    const result = await databases.listDocuments(databaseId, teamCollectionId, [
      Query.equal("mobile", mobile),
      Query.equal("password", password),
      Query.limit(1),
    ]);

    if (!result.total) {
      return NextResponse.json({ error: "Invalid mobile or password." }, { status: 401 });
    }

    const token = createTeamSessionToken(mobile);
    const response = NextResponse.json({ ok: true, mobile });
    response.cookies.set("team_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Team login error:", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
