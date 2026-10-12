import { NextResponse } from "next/server";
import { getStoreAnalytics } from "@/backend/services/analytics-service";

export async function GET() {
  try {
    const data = await getStoreAnalytics();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
