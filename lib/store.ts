import { promises as fs } from 'fs';
import path from 'path';

export type Side = 'boy' | 'girl';
export type Store = {
  guesses: { id: string; side: Side; name: string; at: string }[];
  rsvps: { name: string; guests: number; note: string; at: string }[];
};
const FILE = path.join(process.cwd(), 'data', 'store.json');

export async function read(): Promise<Store> {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')) as Store; }
  catch { return { guesses: [], rsvps: [] }; }
}
export async function write(s: Store): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(s, null, 2));
}
export function counts(s: Store) {
  return { boy: s.guesses.filter(g => g.side === 'boy').length, girl: s.guesses.filter(g => g.side === 'girl').length };
}
