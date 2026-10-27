"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

type Team = "boy" | "girl";
type Stats = { boy: number; girl: number; going: number; notGoing: number };

// ✏️ Edit your event details here
const EVENT = {
  weekday: "Saturday",
  day: "21",
  month: "November",
  year: "2026",
  time: "6:00 PM",
  venue: "Your venue name",
  address: "Street address, City",
  mapUrl: "https://maps.google.com",
  note: "Wear pink or blue to show your team.",
};

const PATHS: Record<string, string> = {
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  heart: "M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z",
  star: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5l-5.4 3 1.2-6L3.3 9.3l6.1-.7z",
  sparkle: "M12 3c.8 4.5 2.5 6.2 7 7-4.5.8-6.2 2.5-7 7-.8-4.5-2.5-6.2-7-7 4.5-.8 6.2-2.5 7-7z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
};

function Icon({ n, solid = false, className, style }: { n: string; solid?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill={solid ? "currentColor" : "none"} stroke="currentColor" strokeWidth={solid ? 0 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[n]} />
    </svg>
  );
}

type Mote = { l: number; s: number; b: number; o: number; d: number; y: number; sw: number; t: number };

// Floating golden dust: three depths (sharp & tiny, soft, large out-of-focus) that drift, sway and twinkle.
function Decor() {
  const [m, setM] = useState<Mote[]>([]);
  useEffect(() => {
    const small = window.innerWidth < 640;
    const n = small ? 26 : 70;
    setM(
      Array.from({ length: n }, (_, i) => {
        const z = i % 6 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
        return {
          l: Math.random() * 100,
          s: [2 + Math.random() * 2, 4 + Math.random() * 3, 14 + Math.random() * 16][z],
          b: small ? 0 : [0, 0.8, 5][z],
          o: [0.8, 0.7, 0.28][z],
          d: [34, 26, 18][z] + Math.random() * 10,
          y: -Math.random() * 40,
          sw: (Math.random() - 0.5) * 90,
          t: 2 + Math.random() * 4,
        };
      })
    );
  }, []);
  return (
    <div className="decor" aria-hidden="true">
      {m.map((x, i) => (
        <i key={i} className="mote" style={{ left: `${x.l}%`, width: x.s, height: x.s, filter: x.b ? `blur(${x.b}px)` : undefined, ["--o" as string]: x.o, ["--d" as string]: `${x.d}s`, ["--dl" as string]: `${x.y}s`, ["--sw" as string]: `${x.sw}px`, ["--t" as string]: `${x.t}s` }} />
      ))}
    </div>
  );
}

function Burst({ x, y, kind, cols, n }: { x: number; y: number; kind: "shard" | "confetti"; cols: string[]; n: number }) {
  const [p] = useState(() =>
    Array.from({ length: n }, (_, i) => ({
      dx: (Math.random() - 0.5) * (kind === "shard" ? 90 : 120),
      dy: -(10 + Math.random() * (kind === "shard" ? 30 : 45)),
      r: Math.random() * 720 - 360,
      w: kind === "shard" ? 18 + Math.random() * 26 : 6 + Math.random() * 8,
      c: cols[i % cols.length],
    }))
  );
  return (
    <div className="burst" aria-hidden="true">
      {p.map((q, i) => (
        <i key={i} className={kind} style={{ left: x, top: y, ["--dx" as string]: q.dx, ["--dy" as string]: q.dy, ["--r" as string]: `${q.r}deg`, width: q.w, height: kind === "shard" ? q.w : q.w * 1.7, background: q.c }} />
      ))}
    </div>
  );
}

export default function Page() {
  const [team, setTeam] = useState<Team | null>(null);
  const [phase, setPhase] = useState<"idle" | "inflate" | "popped">("idle");
  const [fx, setFx] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const balloonRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<Stats>({ boy: 0, girl: 0, going: 0, notGoing: 0 });
  const [name, setName] = useState("");
  const [rsvp, setRsvp] = useState<"yes" | "no" | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try { setStats(await (await fetch("/api/votes", { cache: "no-store" })).json()); } catch {}
  }, []);

  useEffect(() => {
    // Nothing is remembered in the browser, so every reload starts fresh.
    // Test helper: open the page with ?reset to also wipe saved votes and RSVPs (dev mode only).
    if (new URLSearchParams(window.location.search).has("reset")) {
      fetch("/api/votes", { method: "DELETE" }).finally(refresh);
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      refresh();
    }
    const id = setInterval(refresh, 6000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (phase !== "popped") return;
    setFx(true);
    const id = setTimeout(() => setFx(false), 4200);
    return () => clearTimeout(id);
  }, [phase]);

  async function post(payload: object) {
    const r = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (r.ok) setStats(await r.json());
  }
  function vote(t: Team) {
    if (phase !== "idle") return;
    const r = balloonRef.current?.getBoundingClientRect();
    if (r) setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setTeam(t);
    setPhase("inflate");
    post({ kind: "vote", team: t });
    setTimeout(() => {
      setPhase("popped");
      try { navigator.vibrate?.(40); } catch {}
    }, 520);
  }
  async function sendRsvp(going: boolean) {
    if (!name.trim()) return;
    setBusy(true);
    await post({ kind: "rsvp", name, going });
    setRsvp(going ? "yes" : "no");
    setBusy(false);
  }
  function onMove(e: PointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.setProperty("--mx", String((e.clientX / window.innerWidth - 0.5) * 2));
    el.style.setProperty("--my", String((e.clientY / window.innerHeight - 0.5) * 2));
  }

  const total = stats.boy + stats.girl;
  const girlPct = total ? Math.round((stats.girl / total) * 100) : 0;
  const boyPct = total ? 100 - girlPct : 0;
  const lead = girlPct === boyPct ? "Tied" : girlPct > boyPct ? "Girl" : "Boy";

  return (
    <main className={`stage ${team ?? "none"} ${phase}`} onPointerMove={onMove}>
      {team && <div className={`wave ${team} ${phase === "popped" ? "on" : ""}`} style={{ ["--ox" as string]: `${origin.x}px`, ["--oy" as string]: `${origin.y}px` }} />}
      <Decor />
      {fx && team && (
        <>
          <div className="flash" style={{ ["--ox" as string]: `${origin.x}px`, ["--oy" as string]: `${origin.y}px` }} />
          <Burst x={origin.x} y={origin.y} kind="shard" cols={["#2a2a33", "#454555", "#66667a"]} n={18} />
          <Burst x={origin.x} y={origin.y} kind="confetti" cols={["#f2d58f", "#ffffff", team === "girl" ? "#ffb3cf" : "#a9cdff"]} n={56} />
        </>
      )}

      <header className="hero">
        <h1 className="names">Karim &amp; Dana</h1>
        <p className="lead">invite you to their gender reveal party</p>
      </header>

      {phase !== "popped" && (
        <section className={`pick ${phase}`}>
          <div className="sway">
            <div className="balloon" ref={balloonRef}>
              <svg className="bsvg" viewBox="0 0 200 240" aria-hidden="true">
                <defs>
                  <radialGradient id="bk" cx="36%" cy="30%" r="80%"><stop offset="0" stopColor="#6a6a78" /><stop offset=".42" stopColor="#1e1e27" /><stop offset="1" stopColor="#040406" /></radialGradient>
                  <radialGradient id="rim" cx="50%" cy="50%" r="50%"><stop offset=".78" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".34" /></radialGradient>
                  <linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
                  <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8e7b0" /><stop offset="1" stopColor="#b88a3e" /></linearGradient>
                </defs>
                <path id="bb" d="M100 6C152 6 190 46 190 102C190 158 142 206 108 224L114 238L100 233L86 238L92 224C58 206 10 158 10 102C10 46 48 6 100 6Z" fill="url(#bk)" />
                <path d="M100 6C152 6 190 46 190 102C190 158 142 206 108 224L114 238L100 233L86 238L92 224C58 206 10 158 10 102C10 46 48 6 100 6Z" fill="url(#rim)" />
                <ellipse cx="62" cy="60" rx="16" ry="30" transform="rotate(32 62 60)" fill="url(#hl)" />
                <ellipse cx="148" cy="146" rx="5" ry="12" transform="rotate(-35 148 146)" fill="#fff" opacity=".12" />
                <text x="100" y="128" textAnchor="middle" fontSize="86" fontStyle="italic" fontWeight="700" fill="url(#gd)" style={{ fontFamily: "var(--f-display)" }}>?</text>
              </svg>
            </div>
            <svg className="string" viewBox="0 0 20 90" aria-hidden="true"><path d="M10 0c-9 18 9 32 0 48s9 28 0 42" /></svg>
          </div>
          <div className="teams">
            <button className="tbtn girl" disabled={phase !== "idle"} onClick={() => vote("girl")}><span>Team Girl</span></button>
            <button className="tbtn boy" disabled={phase !== "idle"} onClick={() => vote("boy")}><span>Team Boy</span></button>
          </div>
          <p className="hint">Choose your team to pop the balloon</p>
        </section>
      )}

      {phase === "popped" && team && (
        <section className="card">
          <div className="badge"><Icon n={team === "girl" ? "heart" : "star"} solid />You chose Team {team === "girl" ? "Girl" : "Boy"}</div>

          <div className="event">
            <div className="date">
              <span className="wd">{EVENT.weekday}</span>
              <span className="dd">{EVENT.day}</span>
              <span className="my">{EVENT.month} {EVENT.year}</span>
            </div>
            <div className="where">
              <div><Icon n="clock" /><span><b>{EVENT.time}</b><small>Please arrive on time</small></span></div>
              <div><Icon n="pin" /><span><b>{EVENT.venue}</b><small>{EVENT.address}</small><a href={EVENT.mapUrl} target="_blank" rel="noreferrer">Open in Maps</a></span></div>
            </div>
          </div>
          <p className="note">{EVENT.note}</p>

          <div className="rsvp">
            <h2>Will you join us?</h2>
            {rsvp ? (
              <p className="thanks">{rsvp === "yes" ? "Wonderful, we can’t wait to celebrate with you." : "We’ll miss you. Thank you for letting us know."}</p>
            ) : (
              <>
                <input aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={60} />
                <div className="row">
                  <button className="btn go" disabled={busy || !name.trim()} onClick={() => sendRsvp(true)}><Icon n="check" />Joyfully accept</button>
                  <button className="btn nogo" disabled={busy || !name.trim()} onClick={() => sendRsvp(false)}><Icon n="x" />Regretfully decline</button>
                </div>
              </>
            )}
            <p className="count">{stats.going} {stats.going === 1 ? "guest has" : "guests have"} accepted</p>
          </div>

          <div className="poll" aria-live="polite">
            <h2>What everyone thinks</h2>
            <div className="pollbody">
              <div className={`donut ${total ? "" : "empty"}`} style={{ ["--p" as string]: girlPct }}>
                <span>{total ? <><strong>{lead === "Tied" ? 50 : Math.max(girlPct, boyPct)}%</strong>{lead}</> : "No votes yet"}</span>
              </div>
              <ul className="legend">
                <li className="g"><i /><span>Team Girl</span><strong>{girlPct}%</strong></li>
                <li className="b"><i /><span>Team Boy</span><strong>{boyPct}%</strong></li>
                <li className="t">{total} {total === 1 ? "vote" : "votes"} so far</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
