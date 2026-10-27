import { NextResponse } from 'next/server';
import { read, counts } from '@/lib/store';
export const dynamic = 'force-dynamic';

// Open /api/admin?key=YOUR_ADMIN_KEY to see all guesses and RSVPs.
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key');
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  }
  const s = await read();
  const totalGuests = s.rsvps.reduce((n, r) => n + r.guests, 0);
  return NextResponse.json({ counts: counts(s), totalGuests, ...s });
}
