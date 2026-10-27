# Karim & Dana – Gender Reveal Invitation

Next.js 14 (App Router) + TypeScript.

## Run
```
npm install
npm run dev
```
Open http://localhost:3000

## Edit your details
Open `app/page.tsx` and change the `EVENT` object at the top (date, time, venue, address, map link).

## Testing
Nothing is remembered in the browser, so reloading always starts at the balloon screen.
Votes and RSVPs are saved on the server; open `http://localhost:3000/?reset` in dev mode to wipe them.

## Where the data goes
Votes and RSVPs (with guest names) are saved to `data/store.json`
(git-ignored, created automatically on the first vote).

## Deploying
Works as-is on any Node server / VPS (`npm run build && npm start`).
Vercel's filesystem is read-only: replace `load`/`save` in `app/api/votes/route.ts`
with Vercel KV, Upstash Redis or Supabase.
