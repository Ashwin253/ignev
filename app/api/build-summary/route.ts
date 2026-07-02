import { NextResponse } from "next/server";

export async function GET() {
  // In serverless production environments, the filesystem is read-only.
  // We serve /summary.json and /llms.txt dynamically via Next.js dynamic routes instead.
  // This endpoint returns a mock success so admin dashboard calls do not fail.
  return NextResponse.json({ 
    success: true, 
    message: "Dynamic mode: summary files are served on-demand by Next.js routes." 
  });
}
