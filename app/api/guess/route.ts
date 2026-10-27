import { NextResponse } from 'next/server';
import { read, write, counts, Side } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET() { return NextResponse.json(counts(await read())); }

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || (b.side !== 'boy' && b.side !== 'girl') || typeof b.id !== 'string') {
    return NextResponse.json({ error: 'Invalid guess' }, { status: 400 });
  }
  const s = await read();
  s.guesses = s.guesses.filter(g => g.id !== b.id); // one guess per guest, changeable
  s.guesses.push({ id: b.id.slice(0, 64), side: b.side as Side, name: String(b.name ?? '').slice(0, 60), at: new Date().toISOString() });
  await write(s);
  return NextResponse.json(counts(s));
}
