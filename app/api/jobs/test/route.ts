import { NextResponse } from 'next/server';

/** GET /api/jobs/test - no dependencies, use to confirm API routes work. */
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Jobs API is reachable' });
}
