import { NextResponse } from "next/server";

const FALLBACK_PRICES: Record<string, { petrol: number; diesel: number; cng: number; electricity: number; cityName: string }> = {
  delhi: { petrol: 94.72, diesel: 87.62, cng: 75.59, electricity: 7.00, cityName: "Delhi" },
  mumbai: { petrol: 104.21, diesel: 92.15, cng: 86.00, electricity: 8.50, cityName: "Mumbai" },
  bangalore: { petrol: 102.84, diesel: 88.95, cng: 82.50, electricity: 8.00, cityName: "Bangalore" },
  chennai: { petrol: 100.75, diesel: 92.34, cng: 87.50, electricity: 7.50, cityName: "Chennai" },
  hyderabad: { petrol: 107.41, diesel: 95.65, cng: 89.50, electricity: 8.00, cityName: "Hyderabad" },
  pune: { petrol: 103.95, diesel: 90.48, cng: 86.00, electricity: 8.00, cityName: "Pune" },
  kolkata: { petrol: 103.94, diesel: 90.76, cng: 85.00, electricity: 7.50, cityName: "Kolkata" },
  ahmedabad: { petrol: 94.44, diesel: 90.11, cng: 81.50, electricity: 7.00, cityName: "Ahmedabad" },
  jaipur: { petrol: 104.88, diesel: 90.36, cng: 88.00, electricity: 7.50, cityName: "Jaipur" },
  kochi: { petrol: 105.41, diesel: 94.32, cng: 88.50, electricity: 7.50, cityName: "Kochi" },
};

async function fetchPrice(type: "petrol" | "diesel" | "cng", city: string): Promise<number | null> {
  const url = `https://www.goodreturns.in/${type}-price-in-${city}.html`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const html = await res.text();

    // 1. Try matching the table row pattern for the city
    // E.g. <td><a ...>Delhi</a></td> <td> &#x20b9;102.12 </td>
    const tableRegex = new RegExp(`<td>(?:<a[^>]*>)?(?:New\\s+)?${city}(?:</a>)?</td>\\s*<td>\\s*(?:&#x20b9;|₹|Rs\\.?)\\s*([\\d\\.]+)`, "i");
    const tableMatch = html.match(tableRegex);
    if (tableMatch && tableMatch[1]) {
      return parseFloat(tableMatch[1]);
    }

    // 2. Try matching a more generic pattern containing the city and price nearby
    const nearRegex = new RegExp(`(?:${city}|todays).*?(?:&#x20b9;|₹|Rs\\.?)\\s*(\\d+\\.\\d+)`, "i");
    const nearMatch = html.match(nearRegex);
    if (nearMatch && nearMatch[1]) {
      return parseFloat(nearMatch[1]);
    }

    // 3. Fallback: Search the body of the page (after header) to ignore USD currency ticker (e.g. ₹94.58)
    const headerIndex = html.indexOf("</header>");
    const searchBody = headerIndex !== -1 ? html.substring(headerIndex) : html;

    const generalRegex = /(?:&#x20b9;|₹|Rs\.?)\s*(\d+\.\d+)/i;
    const generalMatch = searchBody.match(generalRegex);
    if (generalMatch && generalMatch[1]) {
      return parseFloat(generalMatch[1]);
    }

    return null;
  } catch (err) {
    console.error(`Error scraping ${type} for ${city}:`, err);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = (searchParams.get("city") || "delhi").toLowerCase().trim();

    const fallback = FALLBACK_PRICES[cityParam] || FALLBACK_PRICES.delhi;
    
    const [petrol, diesel, cng] = await Promise.all([
      fetchPrice("petrol", cityParam),
      fetchPrice("diesel", cityParam),
      fetchPrice("cng", cityParam),
    ]);

    const result = {
      success: true,
      city: fallback.cityName,
      petrol: petrol || fallback.petrol,
      diesel: diesel || fallback.diesel,
      cng: cng || fallback.cng,
      electricity: fallback.electricity,
      source: (petrol && diesel && cng) ? "live" : "fallback",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Live fuel prices API error:", error);
    return NextResponse.json({ error: "Failed to fetch prices." }, { status: 500 });
  }
}
