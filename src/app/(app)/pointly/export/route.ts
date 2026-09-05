import { NextRequest } from "next/server";
import { exportLeadsCsv } from "@/lib/leads/export";

export async function GET(request: NextRequest) {
  return exportLeadsCsv(request, "pointly");
}
