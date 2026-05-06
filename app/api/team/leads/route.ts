import { NextRequest, NextResponse } from "next/server";
import { Query } from "appwrite";
import { getServerDatabases } from "@/app/lib/appwrite-server";
import { verifyTeamSessionToken } from "@/app/lib/team-session";

const databaseId = process.env.APPWRITE_DATABASE_ID || "";
const assistCollectionId = process.env.APPWRITE_ASSIST_COLLECTION_ID || "";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("team_session")?.value;
    const session = verifyTeamSessionToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!databaseId || !assistCollectionId) {
      return NextResponse.json(
        {
          error:
            "Missing APPWRITE_DATABASE_ID or APPWRITE_ASSIST_COLLECTION_ID in environment.",
        },
        { status: 500 }
      );
    }

    const databases = getServerDatabases();
    const leads = await databases.listDocuments(databaseId, assistCollectionId, [
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);

    return NextResponse.json({
      leads: leads.documents.map((doc) => ({
        id: doc.$id,
        name: doc.name || "",
        phone: doc.phone || "",
        pincode: doc.pincode || "",
        interest: doc.interest || "",
        message: doc.message || "",
        createdAt: doc.$createdAt,
      })),
      total: leads.total,
    });
  } catch (error) {
    console.error("Fetch team leads error:", error);
    return NextResponse.json({ error: "Failed to fetch leads." }, { status: 500 });
  }
}
