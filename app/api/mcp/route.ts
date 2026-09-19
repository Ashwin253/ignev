import { NextRequest, NextResponse } from "next/server";
import {
  searchEvs,
  getEvDetails,
  compareEvs,
  findChargingStations,
  calculateSavings,
  getCatalogResource,
  getStationsResource,
} from "../../lib/mcp-service";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-protocol-version",
};

const TOOLS = [
  {
    name: "search_evs",
    description:
      "Search and filter electric vehicles (cars, scooters, bikes) in India by budget, range, brand, or vehicle type.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free-text search query (e.g. 'Tata', 'Punch', 'SUV', 'Ather')",
        },
        brand: {
          type: "string",
          description: "Brand name filter (e.g. 'Tata', 'MG', 'Ola', 'Mahindra', 'Ather')",
        },
        type: {
          type: "string",
          description: "Vehicle type filter: 'car', 'scooter', 'bike', or 'auto'",
        },
        maxPrice: {
          type: "number",
          description: "Maximum budget in Lakhs (INR), e.g. 15 for ₹15 Lakhs",
        },
        minPrice: {
          type: "number",
          description: "Minimum price in Lakhs (INR), e.g. 10 for ₹10 Lakhs",
        },
        minRange: {
          type: "number",
          description: "Minimum single-charge range in km (e.g. 300 for 300+ km)",
        },
        baasOnly: {
          type: "boolean",
          description: "Set to true to only show vehicles with Battery-as-a-Service (BaaS)",
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default 20)",
        },
      },
    },
  },
  {
    name: "get_ev_details",
    description:
      "Get complete specifications, real-world range, battery capacity, fast charging, pros/cons, and pricing for a specific EV model.",
    inputSchema: {
      type: "object",
      properties: {
        slugOrName: {
          type: "string",
          description: "Slug or model name of the vehicle (e.g. 'tata-curvv-ev' or 'MG Windsor')",
        },
      },
      required: ["slugOrName"],
    },
  },
  {
    name: "compare_evs",
    description:
      "Compare 2 to 4 electric vehicles side-by-side on price, battery, driving range, top speed, and features.",
    inputSchema: {
      type: "object",
      properties: {
        slugs: {
          type: "array",
          items: { type: "string" },
          description: "Array of 2 to 4 vehicle slugs or names to compare (e.g. ['tata-curvv-ev', 'mg-windsor-ev'])",
        },
      },
      required: ["slugs"],
    },
  },
  {
    name: "find_charging_stations",
    description:
      "Find active EV charging stations by city, charging network (e.g. Statiq, Tata Power), or keyword.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name to filter charging stations (e.g. 'Delhi', 'Mumbai', 'Bengaluru')",
        },
        network: {
          type: "string",
          description: "Charging network provider (e.g. 'Statiq', 'Tata Power')",
        },
        query: {
          type: "string",
          description: "Location keyword or area name",
        },
        limit: {
          type: "number",
          description: "Maximum stations to return (default 20)",
        },
      },
    },
  },
  {
    name: "calculate_savings",
    description:
      "Calculate monthly and annual running cost savings of driving an electric vehicle vs petrol/diesel based on daily commute.",
    inputSchema: {
      type: "object",
      properties: {
        dailyKm: {
          type: "number",
          description: "Average daily driving distance in kilometers (e.g. 40)",
        },
        vehicleType: {
          type: "string",
          enum: ["car", "scooter"],
          description: "Type of vehicle ('car' or 'scooter')",
        },
        fuelPrice: {
          type: "number",
          description: "Petrol price per litre in INR (default: 102)",
        },
        electricityRate: {
          type: "number",
          description: "Cost per electricity unit (kWh) in INR (default: 7.5)",
        },
      },
      required: ["dailyKm"],
    },
  },
];

const RESOURCES = [
  {
    uri: "ev://catalog",
    name: "EVPULSE EV Catalog",
    description: "Database of electric cars, scooters, and vehicles listed on EVPULSE",
    mimeType: "text/markdown",
  },
  {
    uri: "ev://stations",
    name: "EVPULSE Charging Stations",
    description: "Active EV charging stations across India",
    mimeType: "text/markdown",
  },
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "www.evplse.com";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;

  return NextResponse.json(
    {
      name: "evpulse-mcp",
      title: "EVPULSE Model Context Protocol Server",
      version: "1.0.0",
      description: "Connect Claude Desktop, Cursor, Gemini, and ChatGPT to live Indian EV data.",
      protocolVersion: "2024-11-05",
      endpoints: {
        mcp: `${baseUrl}/api/mcp`,
        openapi: `${baseUrl}/api/openapi.json`,
        llmstxt: `${baseUrl}/llms.txt`,
        connectGuide: `${baseUrl}/mcp`,
      },
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
      resources: RESOURCES,
      instructions: "To call MCP methods, send HTTP POST requests with standard JSON-RPC 2.0 format.",
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: Invalid JSON" },
      },
      { status: 400, headers: corsHeaders }
    );
  }

  // Support batch JSON-RPC or single
  const isBatch = Array.isArray(body);
  const requests = isBatch ? body : [body];

  const responses = await Promise.all(
    requests.map(async (request: any) => {
      const { id, method, params } = request || {};

      // 1. Initialize
      if (method === "initialize") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: "evpulse-mcp",
              version: "1.0.0",
            },
          },
        };
      }

      // 2. Initialized Notification
      if (method === "notifications/initialized") {
        return id !== undefined ? { jsonrpc: "2.0", id, result: {} } : null;
      }

      // 3. Ping
      if (method === "ping") {
        return { jsonrpc: "2.0", id, result: {} };
      }

      // 4. Tools List
      if (method === "tools/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: TOOLS,
          },
        };
      }

      // 5. Tools Call
      if (method === "tools/call") {
        const { name, arguments: toolArgs = {} } = params || {};
        try {
          let toolResult: any;

          switch (name) {
            case "search_evs":
              toolResult = await searchEvs(toolArgs);
              break;

            case "get_ev_details":
              toolResult = await getEvDetails(toolArgs.slugOrName);
              break;

            case "compare_evs":
              toolResult = await compareEvs(toolArgs.slugs || []);
              break;

            case "find_charging_stations":
              toolResult = await findChargingStations(toolArgs);
              break;

            case "calculate_savings":
              toolResult = calculateSavings(toolArgs);
              break;

            default:
              return {
                jsonrpc: "2.0",
                id,
                error: {
                  code: -32601,
                  message: `Tool '${name}' not found`,
                },
              };
          }

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(toolResult, null, 2),
                },
              ],
              isError: false,
            },
          };
        } catch (err: any) {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Error executing tool '${name}': ${err.message}`,
                },
              ],
              isError: true,
            },
          };
        }
      }

      // 6. Resources List
      if (method === "resources/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            resources: RESOURCES,
          },
        };
      }

      // 7. Resources Read
      if (method === "resources/read") {
        const { uri } = params || {};
        try {
          let content = "";
          if (uri === "ev://catalog") {
            content = await getCatalogResource();
          } else if (uri === "ev://stations") {
            content = await getStationsResource();
          } else {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: `Resource '${uri}' not found` },
            };
          }

          return {
            jsonrpc: "2.0",
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: "text/markdown",
                  text: content,
                },
              ],
            },
          };
        } catch (err: any) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32603, message: `Failed to read resource: ${err.message}` },
          };
        }
      }

      // Unknown method
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method '${method}' not supported` },
      };
    })
  );

  // Filter out notifications (null responses)
  const validResponses = responses.filter(Boolean);
  if (validResponses.length === 0) {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const finalResponse = isBatch ? validResponses : validResponses[0];
  return NextResponse.json(finalResponse, { headers: corsHeaders });
}
