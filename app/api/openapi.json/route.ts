import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "www.evplse.com";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "EVPULSE EV Database & Intelligence API",
      description:
        "Comprehensive live database of Electric Vehicles (cars, scooters, bikes) and charging stations in India. Provides vehicle search, specs, side-by-side comparisons, charging station finder, and fuel savings calculator for AI assistants like ChatGPT and Gemini.",
      version: "1.0.0",
    },
    servers: [
      {
        url: baseUrl,
        description: "Live EVPULSE Production Server",
      },
    ],
    paths: {
      "/api/v1/evs": {
        get: {
          operationId: "searchEvs",
          summary: "Search and filter electric vehicles",
          description:
            "Search for electric cars, scooters, bikes, and autos in India by keyword, brand, vehicle type, maximum price, or minimum driving range.",
          parameters: [
            {
              name: "q",
              in: "query",
              required: false,
              description: "Search keyword (e.g. 'Punch', 'Curvv', 'SUV', 'Ather')",
              schema: { type: "string" },
            },
            {
              name: "brand",
              in: "query",
              required: false,
              description: "Filter by brand name (e.g. 'Tata', 'MG', 'Ola', 'Mahindra')",
              schema: { type: "string" },
            },
            {
              name: "type",
              in: "query",
              required: false,
              description: "Vehicle type: 'car', 'scooter', 'bike', or 'auto'",
              schema: { type: "string", enum: ["car", "scooter", "bike", "auto"] },
            },
            {
              name: "maxPrice",
              in: "query",
              required: false,
              description: "Maximum budget in Lakhs (INR), e.g. 20 for ₹20 Lakhs",
              schema: { type: "number" },
            },
            {
              name: "minPrice",
              in: "query",
              required: false,
              description: "Minimum budget in Lakhs (INR), e.g. 10 for ₹10 Lakhs",
              schema: { type: "number" },
            },
            {
              name: "minRange",
              in: "query",
              required: false,
              description: "Minimum single-charge driving range in km (e.g. 350)",
              schema: { type: "number" },
            },
            {
              name: "baasOnly",
              in: "query",
              required: false,
              description: "Set to true to show only Battery-as-a-Service (BaaS) eligible vehicles",
              schema: { type: "boolean" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Maximum number of results to return (default 20)",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: {
            "200": {
              description: "List of matching electric vehicles",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      count: { type: "integer" },
                      totalMatches: { type: "integer" },
                      results: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            brand: { type: "string" },
                            slug: { type: "string" },
                            url: { type: "string" },
                            type: { type: "string" },
                            pricingText: { type: "string" },
                            maxRangeKm: { type: "number", nullable: true },
                            maxBatteryKwh: { type: "number", nullable: true },
                            topSpeedKmh: { type: "number", nullable: true },
                            baasAvailable: { type: "boolean" },
                            status: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/evs/{slug}": {
        get: {
          operationId: "getEvDetails",
          summary: "Get detailed vehicle specifications and pricing",
          description:
            "Retrieve comprehensive information for an EV model including variant pricing, battery capacities, fast charging, pros/cons, and launch date.",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              description: "The vehicle slug or model name (e.g. 'tata-curvv-ev', 'mg-windsor-ev')",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Detailed vehicle specifications",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      found: { type: "boolean" },
                      data: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/compare": {
        get: {
          operationId: "compareEvs",
          summary: "Compare multiple electric vehicles side-by-side",
          description:
            "Compare 2 to 4 electric vehicles side-by-side across pricing, range, battery capacity, top speed, and pros/cons.",
          parameters: [
            {
              name: "slugs",
              in: "query",
              required: true,
              description: "Comma-separated list of vehicle slugs (e.g. 'tata-curvv-ev,mg-windsor-ev')",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Side-by-side comparison data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      totalVehicles: { type: "integer" },
                      vehicles: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/stations": {
        get: {
          operationId: "findChargingStations",
          summary: "Find EV charging stations",
          description:
            "Search for active charging stations across India filtered by city, network provider (e.g. Statiq, Tata Power), or keyword.",
          parameters: [
            {
              name: "city",
              in: "query",
              required: false,
              description: "City name (e.g. 'Delhi', 'Bengaluru', 'Mumbai')",
              schema: { type: "string" },
            },
            {
              name: "network",
              in: "query",
              required: false,
              description: "Network provider (e.g. 'Statiq', 'Tata Power')",
              schema: { type: "string" },
            },
            {
              name: "q",
              in: "query",
              required: false,
              description: "Location keyword or area name",
              schema: { type: "string" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Maximum results to return (default 20)",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: {
            "200": {
              description: "List of charging stations matching criteria",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      count: { type: "integer" },
                      stations: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/savings": {
        get: {
          operationId: "calculateSavings",
          summary: "Calculate fuel savings of driving an EV vs petrol",
          description:
            "Calculates monthly, annual, 3-year, and 5-year running cost savings of driving an EV vs petrol or diesel vehicle.",
          parameters: [
            {
              name: "dailyKm",
              in: "query",
              required: true,
              description: "Average daily driving distance in kilometers (e.g. 40)",
              schema: { type: "number" },
            },
            {
              name: "vehicleType",
              in: "query",
              required: false,
              description: "'car' or 'scooter' (defaults to 'car')",
              schema: { type: "string", enum: ["car", "scooter"], default: "car" },
            },
            {
              name: "fuelPrice",
              in: "query",
              required: false,
              description: "Petrol price per litre in INR (defaults to 102)",
              schema: { type: "number" },
            },
            {
              name: "electricityRate",
              in: "query",
              required: false,
              description: "Electricity rate per kWh in INR (defaults to 7.5)",
              schema: { type: "number" },
            },
          ],
          responses: {
            "200": {
              description: "Savings breakdown and summary",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      inputs: { type: "object" },
                      monthly: { type: "object" },
                      yearly: { type: "object" },
                      projections: { type: "object" },
                      summaryText: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
