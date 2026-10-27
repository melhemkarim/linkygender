import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Store = { boy: number; girl: number; rsvps: { name: string; going: boolean; at: number }[] };
const FILE = path.join(process.cwd(), "data", "store.json");
let mem: Store = { boy: 0, girl: 0, rsvps: [] };

// File storage works locally / on a VPS. On Vercel, swap load/save for Vercel KV, Upstash or Supabase.
async function load(): Promise<Store> {
  try { mem = JSON.parse(await fs.readFile(FILE, "utf8")); } catch {}
  return mem;
}
async function save(s: Store) {
  mem = s;
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(s, null, 2));
  } catch {}
}
const summary = (s: Store) => ({
  boy: s.boy,
  girl: s.girl,
  going: s.rsvps.filter((r) => r.going).length,
  notGoing: s.rsvps.filter((r) => !r.going).length,
});

export async function GET() {
  return NextResponse.json(summary(await load()));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const s = await load();
  if (body.kind === "vote" && (body.team === "boy" || body.team === "girl")) {
    s[body.team as "boy" | "girl"]++;
  } else if (body.kind === "rsvp" && typeof body.name === "string" && body.name.trim()) {
    s.rsvps.push({ name: body.name.trim().slice(0, 60), going: !!body.going, at: Date.now() });
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await save(s);
  return NextResponse.json(summary(s));
}

// Dev-only: wipe all votes and RSVPs (used by /?reset while testing)
export async function DELETE() {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Disabled" }, { status: 403 });
  await save({ boy: 0, girl: 0, rsvps: [] });
  return NextResponse.json(summary(mem));
}
