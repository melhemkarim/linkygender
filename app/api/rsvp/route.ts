import { NextResponse } from 'next/server';
import { read, write } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const name = String(b?.name ?? '').trim().slice(0, 80);
  const guests = Math.min(10, Math.max(1, Number(b?.guests) || 1));
  if (!name) return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
  const s = await read();
  s.rsvps.push({ name, guests, note: String(b?.note ?? '').slice(0, 300), at: new Date().toISOString() });
  await write(s);
  return NextResponse.json({ ok: true });
}
