import { NextResponse } from "next/server";
import { supabase, supabaseEnabled } from "../../lib/supabase";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const CF_AI_TOKEN = process.env.CLOUDFLARE_AI_TOKEN ?? "";
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

type VehicleInfo = { brand: string; title: string; slug: string; fullName: string };

export async function POST(req: Request) {
  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  try {
    const { messages, vehicleContext } = await req.json();

    // Fetch available vehicles for recommendations
    let vehicleList = "";
    let vehicles: VehicleInfo[] = [];
    if (supabaseEnabled()) {
      const { data } = await supabase.from("evlistings").select("brand, title, slug, types, body_type, price_bracket").or("deleted.is.null,deleted.eq.false");
      if (data?.length) {
        vehicles = data.map((v: any) => ({
          brand: (v.brand || "").trim(),
          title: (v.title || "").trim(),
          slug: v.slug,
          fullName: `${(v.brand || "").trim()} ${(v.title || "").trim()}`,
        }));
        vehicleList = data.map((v: any) => {
          const type = v.types?.[0] || v.body_type || "EV";
          const price = v.price_bracket ? ` [${v.price_bracket}]` : "";
          return `- ${v.brand} ${v.title} (${type}${price}) → /product/${v.slug}`;
        }).join("\n");
      }
    }

    const systemPrompt = `You are EVPULSE AI, a helpful electric vehicle assistant for Indian consumers. You help users understand EV specs, compare vehicles, and make purchase decisions.

Rules:
- Keep answers concise (2-4 sentences max unless asked for detail)
- Use Indian context (₹ prices in Lakhs, Indian cities, FAME subsidies)
- If you don't know something specific, say so honestly
- Be friendly and conversational
- Focus on practical advice for EV buyers
- IMPORTANT: When recommending vehicles, ALWAYS use this exact format for each vehicle on its own line:
- [Brand Model](/product/slug)
- Example: - [Tata Nexon EV](/product/tata-nexon-ev)
- Never put multiple vehicles on one line
- ONLY recommend vehicles from the "Available vehicles" list below. Do NOT invent vehicles.
- Do NOT use ** or * for formatting. Use plain text and - for bullets.
- For EMI queries: approximate EMI = (price in ₹) / loan tenure months. For ₹10,000/month EMI with 5yr loan, budget is ~₹6L
- For seating queries: SUVs typically have 5-7 seats, hatchbacks 5, scooters/bikes 1-2
- For brand queries: list all matching vehicles from that brand
- For type queries (scooter, car, SUV, bike): filter by vehicle type

${vehicleList ? `Available vehicles on EVPULSE:\n${vehicleList}\n` : ""}
${vehicleContext ? `Current vehicle context:\n${vehicleContext}` : "You're on the EVPULSE homepage. Help users explore electric vehicles available in India."}`;

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CF_AI_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-6),
          ],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.warn("CF AI error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }

    const data = await res.json();
    let reply = data.result?.response || "Sorry, I couldn't process that. Try again.";

    // Post-process: Clean up markdown formatting the model uses
    // Remove ** bold markers
    reply = reply.replace(/\*\*([^*]+)\*\*/g, "$1");
    // Convert * bullets to - bullets
    reply = reply.replace(/^\* /gm, "- ");
    // Remove section headers like "Scooters:" or "SUVs:" and keep as plain text
    reply = reply.replace(/^([A-Za-z &]+):$/gm, "\n$1:");

    // Post-process: Find vehicle names in text and convert to links
    // Sort vehicles by full name length (longest first) to match longer names before shorter ones
    const sortedVehicles = [...vehicles].sort((a, b) => b.fullName.length - a.fullName.length);

    // Replace vehicle names with links — only if not already inside a link
    for (const v of sortedVehicles) {
      if (!v.fullName || !v.slug) continue;
      // Escape special regex chars in names
      const escaped = v.fullName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Match the vehicle name that is NOT already inside [...](...) 
      const pattern = new RegExp(`(?<!\\[)\\b(${escaped})\\b(?![^\\[]*\\])`, "gi");
      reply = reply.replace(pattern, `[${v.fullName}](/product/${v.slug})`);
    }

    // Also try matching just the title (without brand) for cases where AI omits brand
    for (const v of sortedVehicles) {
      if (!v.title || !v.slug || v.title.length < 4) continue;
      const escaped = v.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(?<!\\[)(?<!\\w)\\b(${escaped})\\b(?![^\\[]*\\])`, "gi");
      reply = reply.replace(pattern, `[${v.brand} ${v.title}](/product/${v.slug})`);
    }

    // Ensure lines with links become bullet points if they aren't already
    const lines = reply.split("\n");
    const processed = lines.map((line: string) => {
      const hasLink = /\[[^\]]+\]\(\/product\/[^)]+\)/.test(line);
      if (hasLink && !line.trim().startsWith("- ") && !line.trim().startsWith("• ")) {
        // If line has a link but no bullet, make it a bullet
        const trimmed = line.trim();
        // Remove leading "* " or "- " markers that might be partial
        const cleaned = trimmed.replace(/^[*•]\s*/, "");
        
        // If there are multiple links on one line, split each to its own bullet
        const linkPattern = /\[[^\]]+\]\(\/product\/[^)]+\)/g;
        const links = cleaned.match(linkPattern);
        if (links && links.length > 1) {
          const firstLinkIdx = cleaned.indexOf(links[0]);
          const intro = cleaned.substring(0, firstLinkIdx).trim();
          const bulletList = links.map((l: string) => `- ${l}`).join("\n");
          return intro ? `${intro}\n${bulletList}` : bulletList;
        }
        
        // Single link — check if line is mostly the link or has useful context
        return `- ${cleaned}`;
      }
      return line;
    });
    reply = processed.join("\n");

    // Clean up excessive newlines
    reply = reply.replace(/\n{3,}/g, "\n\n");

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
