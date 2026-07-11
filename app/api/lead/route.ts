import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { supabase, supabaseEnabled } from "../../lib/supabase";

async function sendPushNotification(title: string, bodyText: string) {
  if (!supabaseEnabled()) return;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[FCM Push] Skipping notification: Missing Google Service Account env credentials.");
    return;
  }

  try {
    // 1. Fetch active device tokens from database
    const { data: tokensData, error: tokensError } = await supabase
      .from("fcm_tokens")
      .select("token");

    if (tokensError) {
      console.warn("[FCM Push] Failed to fetch device tokens from Supabase:", tokensError.message);
      return;
    }

    const tokens = tokensData?.map((t: any) => t.token).filter(Boolean) || [];
    if (tokens.length === 0) {
      console.log("[FCM Push] No registered device tokens found.");
      return;
    }

    // 2. Initialize firebase-admin SDK if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }

    // 3. Send notifications to all active tokens using FCM HTTP v1 API
    const response = await getMessaging().sendEachForMulticast({
      tokens: tokens,
      notification: {
        title,
        body: bodyText,
      },
    });

    console.log(`[FCM Push] Successfully delivered ${response.successCount} push notifications. ${response.failureCount} failed.`);

    // 4. Prune expired or unregistered tokens from the database
    if (response.responses.length > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(tokens[index]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await supabase
          .from("fcm_tokens")
          .delete()
          .in("token", invalidTokens);
        console.log(`[FCM Push] Pruned ${invalidTokens.length} expired registration tokens from the database.`);
      }
    }
  } catch (err: any) {
    console.error("[FCM Push] Multicast send execution failed:", err.message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, pincode, interest, message, source } = body;

    if (!supabaseEnabled()) {
      return NextResponse.json({ ok: true, note: "Supabase not configured" });
    }

    // Insert the lead
    const { error } = await supabase.from("leads").insert({
      name: name || "",
      phone: phone || "",
      pincode: pincode || "",
      interest: interest || "",
      message: message || "",
      source: source || "get-assist",
    });

    if (error) {
      console.warn("[Lead] Supabase insert failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Dispatch background push notification dynamically (non-blocking)
    const isForYou = source === "/foryou Recommendation";
    const title = isForYou ? "New Curation Request" : "New Enquiry Received";
    const bodyText = isForYou
      ? `${name || "A customer"} requested a curated EV recommendation report!`
      : `${name || "A customer"} is interested in: ${interest || "EV Assistance"}.`;

    // Trigger push notification asynchronously
    sendPushNotification(title, bodyText).catch((err) => {
      console.error("[Lead POST] Push notification error:", err);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
