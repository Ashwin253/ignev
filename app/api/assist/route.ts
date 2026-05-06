// import { ID } from "appwrite";
// import { NextResponse } from "next/server";
// import { getServerDatabases } from "@/app/lib/appwrite-server";

// const databaseId = process.env.APPWRITE_DATABASE_ID || "";
// const assistCollectionId = process.env.APPWRITE_ASSIST_COLLECTION_ID || "";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const name = String(body?.name || "").trim();
//     const phone = String(body?.phone || "").trim();
//     const pincode = String(body?.pincode || "").trim();
//     const interest = String(body?.interest || "").trim();
//     const message = String(body?.message || "").trim();

//     if (!name || !phone || !pincode || !interest) {
//       return NextResponse.json(
//         { error: "Missing required fields: name, phone, pincode, interest." },
//         { status: 400 }
//       );
//     }

//     if (!databaseId || !assistCollectionId) {
//       return NextResponse.json(
//         {
//           error:
//             "Missing APPWRITE_DATABASE_ID or APPWRITE_ASSIST_COLLECTION_ID in environment.",
//         },
//         { status: 500 }
//       );
//     }

//     const databases = getServerDatabases();

//     await databases.createDocument(databaseId, assistCollectionId, ID.unique(), {
//       name,
//       phone,
//       pincode,
//       interest,
//       message,
//       source: "get-assist",
//     });

//     return NextResponse.json({ ok: true });
//   } catch (error) {
//     console.error("Assist lead save error:", error);
//     return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
//   }
// }
