import { NextRequest, NextResponse } from "next/server";
import type { ScanRequest, ScanResponse, ScanError } from "@font-lover/shared-types";

const COLLECTOR_URL = process.env.COLLECTOR_URL || "http://localhost:8787";
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ScanRequest;
  const { url, mode = "light" } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" } as ScanError, { status: 400 });
  }

  try {
    const workerRes = await fetch(`${COLLECTOR_URL}/api/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WORKER_TOKEN ? { Authorization: `Bearer ${WORKER_TOKEN}` } : {}),
      },
      body: JSON.stringify({ url, mode }),
    });

    const data = (await workerRes.json()) as ScanResponse | ScanError;
    return NextResponse.json(data, { status: workerRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message } as ScanError, { status: 500 });
  }
}
