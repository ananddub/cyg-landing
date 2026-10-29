import { useEffect, useMemo, useRef, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import ini from 'highlight.js/lib/languages/ini'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import { Logo } from '../components/Nav.jsx'

hljs.registerLanguage('ini', ini)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)

/* ── tiny doc primitives ─────────────────────────────────────── */

function H2({ id, children }) {
  return (
    <h2 id={id} className="scroll-mt-24 font-display text-2xl font-bold text-fg sm:text-3xl">
      {children}
    </h2>
  )
}
function Sub({ children }) {
  return <p className="mt-3 text-[14.5px] leading-relaxed text-sub">{children}</p>
}
function H3({ children }) {
  return <h3 className="mb-3 mt-8 font-display text-[16px] font-semibold text-fg">{children}</h3>
}
function Code({ children }) {
  return <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[12px] text-oxide">{children}</code>
}
function Pre({ lang, children }) {
  const html = useMemo(
    () => (lang ? hljs.highlight(children, { language: lang }).value : null),
    [lang, children],
  )
  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-[#0a0a0c] p-4">
      {html ? (
        <code className="hljs !text-[12.5px]" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code className="font-mono text-[12.5px] leading-[1.75] text-sub">{children}</code>
      )}
    </pre>
  )
}
function Note({ children }) {
  return <p className="mt-4 text-[13px] leading-relaxed text-mute">{children}</p>
}
function Warn({ label = 'Note', children }) {
  return (
    <div className="mt-6 rounded-xl border border-ember/25 bg-ember/5 p-4 text-[13px] leading-relaxed text-sub">
      <b className="text-ember">{label}:</b> {children}
    </div>
  )
}
function Table({ head, rows, dense = false }) {
  const cell = dense ? 'px-3 py-2.5' : 'px-4 py-3'
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-line">
      <table className={`w-full min-w-[560px] text-left ${dense ? 'text-[12px]' : 'text-[13px]'}`}>
        <thead>
          <tr className="border-b border-line bg-panel-2/60">
            {head.map((h) => (
              <th key={h} className={`${cell} font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mute`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`${cell} align-top ${j === 0 ? 'font-medium text-fg' : 'text-sub'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function FeatureCard({ title, children }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <h3 className="font-display text-[15px] font-semibold text-fg">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-sub [&>b]:font-semibold [&>b]:text-oxide">{children}</p>
    </div>
  )
}
function Section({ children }) {
  return <section className="border-t border-line py-14 first:border-0 first:pt-0">{children}</section>
}

/* numbered deep-dive section (A-to-Z guide) */
function G({ id, n, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-10">
      <h3 className="mb-4 font-display text-xl font-bold text-fg">
        <span className="mr-2 font-mono text-[13px] font-medium text-oxide/70">{n}</span>
        {title}
      </h3>
      <div className="space-y-3 text-[14px] leading-relaxed text-sub">{children}</div>
    </section>
  )
}

/* full API surface list, mono */
function MonoBlock({ title, children }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-panel-2/50 p-4">
      <div className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mute">{title}</div>
      <div className="font-mono text-[12px] leading-[1.9] text-sub">{children}</div>
    </div>
  )
}

function DocList({ children }) {
  return <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sub marker:text-oxide/60">{children}</ul>
}

/* ── scroll-spy sidebar ──────────────────────────────────────── */

const SECTIONS = [
  ['in-the-box', 'In the box'],
  ['see-it', 'See it'],
  ['quick-start', 'Quick start'],
  ['writing-a-game', 'Writing a game'],
  ['guide-setup', '01 · Setup'],
  ['guide-state', '02 · State'],
  ['guide-lifecycle', '03 · Lifecycle'],
  ['guide-inputs', '04 · Inputs'],
  ['guide-2d', '05 · Physics 2D'],
  ['guide-3d', '06 · Physics 3D'],
  ['guide-navmesh', '07 · Navmesh'],
  ['guide-aoi', '08 · AOI'],
  ['guide-util', '09 · RNG & timers'],
  ['guide-messaging', '10 · Messaging'],
  ['guide-maps', '11 · Maps'],
  ['guide-client', '12 · Client SDK'],
  ['guide-console', '13 · Console'],
  ['guide-deploy', '14 · Deploy'],
  ['guide-schema', '15 · Schema DSL'],
  ['netcode', 'Netcode & transports'],
  ['benchmarks', 'Benchmarks'],
  ['compare', 'How it compares'],
  ['architecture', 'Architecture'],
]

function useScrollSpy() {
  const [active, setActive] = useState(SECTIONS[0][0])
  const navRef = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  // keep the active link visible inside the scrollable sidebar
  useEffect(() => {
    const el = navRef.current?.querySelector(`a[href="#${active}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [active])

  return { active, navRef }
}

/* ── page ────────────────────────────────────────────────────── */

export default function DocsPage() {
  const { active, navRef } = useScrollSpy()

  return (
    <div className="min-h-screen bg-ink font-body text-fg">
      {/* top bar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-2.5 text-oxide">
            <Logo />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[18px] font-bold tracking-tight text-fg">CYG</span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-mute">cook your game</span>
            </span>
            <span className="ml-2 rounded-full border border-line bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              docs
            </span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/" className="btn-ghost btn-sm hidden sm:inline-flex">← back to site</a>
            <a href="https://github.com/ananddub/cyg" target="_blank" rel="noopener" className="btn-primary btn-sm">
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-10 px-5 pb-24 pt-28 lg:px-8">
        {/* sidebar */}
        <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-52 flex-none overflow-y-auto pb-4 lg:block">
          <div className="eyebrow mb-5 bg-ink pb-2 pt-1">on this page</div>
          <nav ref={navRef} className="space-y-1">
            {SECTIONS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className={`block rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  active === id ? 'bg-oxide/10 font-medium text-oxide' : 'text-sub hover:text-fg'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* content */}
        <main className="min-w-0 max-w-3xl flex-1">
          <div className="eyebrow mb-5">documentation</div>
          <h1 className="font-display text-3xl font-bold text-fg sm:text-[40px] sm:leading-[1.1]">
            Everything you need to ship a game.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-sub">
            One process, one config file, one console — and every claim below is backed by code and
            tests in the repository. Nothing here is a plugin you assemble.
          </p>

          {/* ── in the box ── */}
          <div id="in-the-box" className="scroll-mt-24 pt-14">
            <Section>
              <H2>Everything in the box</H2>
              <Sub>Every capability ships in the single binary — no sidecars, no marketplace.</Sub>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <FeatureCard title="Sandboxed WASM rooms">
                  Extend <b>Room</b>, mutate a typed reactive state, <b>commitState()</b>. Zero-GC
                  AssemblyScript, hot-reload on save: a trapping room fails alone while the host keeps running.
                </FeatureCard>
                <FeatureCard title="Inbuilt simulation backends">
                  <b>Rapier2D/3D</b> physics, deterministic RNG + tick timers, <b>navmesh A*</b>, spatial{' '}
                  <b>AOI</b>, lag-compensated raycasts — 30+ permission-gated host imports. Plus a flat{' '}
                  <b>ECS backend</b> for template-scale rooms.
                </FeatureCard>
                <FeatureCard title="Three transport lanes">
                  <b>WebRTC DataChannels</b> (dual lane) for browsers, <b>raw UDP</b> for native engines,{' '}
                  <b>QUIC/WebTransport</b> on its own port. QUIC-tier reliability everywhere: per-frame
                  sequence, reorder-safe delivery, SACK selective resends, sendmmsg + UDP-GSO fan-out.
                </FeatureCard>
                <FeatureCard title="Reactive client SDK">
                  Descriptor-driven decode at join — no client codegen. <b>onStateChange</b>, field{' '}
                  <b>listen</b>, collection <b>onAdd/onRemove</b>, <b>room.request()</b> RPC,{' '}
                  <b>client.auth</b>, <b>room.clock</b>. Colyseus-shaped.
                </FeatureCard>
                <FeatureCard title="BaaS in the same process">
                  Accounts (device/email/custom, link/unlink, MFA), friends, groups,{' '}
                  <b>chat + channels + DMs</b>, parties, presence, storage, leaderboards, tournaments,
                  IAP validation, inventory, notifications, matchmaker.
                </FeatureCard>
                <FeatureCard title="Web console, per-game scoped">
                  Live telemetry, live rooms &amp; clients, <b>WASM studio</b> (upload → ABI gate →
                  activate → rollback), <b>map upload</b> (mesh / 2D / navmesh), match terminate, bans
                  that <b>kick live sessions in realtime</b>.
                </FeatureCard>
                <FeatureCard title="Deterministic core">
                  Fixed-tick simulation with deterministic RNG and tick-based timers; rollback and
                  rewind lag-compensation built for competitive play — without the per-CCU bill.
                </FeatureCard>
                <FeatureCard title="Fleet-ready">
                  <b>Agones</b> lifecycle hooks built in, one binary per pod, capacity measured (100
                  rooms × 100 players fits a 2-core / 2 GB pod at 128 Hz). Self-host on a $10/mo
                  VPS or scale on Kubernetes.
                </FeatureCard>
                <FeatureCard title="Typed database layer">
                  FlashORM codegen: named SQL in <b>db/queries/*.sql</b> → typed repositories. Adding a
                  domain is write-the-SQL, run-gen, call-the-methods.
                </FeatureCard>
              </div>
            </Section>
          </div>

          {/* ── see it ── */}
          <div id="see-it" className="scroll-mt-24">
            <Section>
              <H2>See it</H2>
              <Sub>
                Captured from a running deployment. A hosted WASM game's workspace — live telemetry
                on one WebSocket feed, scoped to this game only.
              </Sub>

              <figure className="mt-8">
                <img
                  src="/console-overview.png"
                  alt="Game workspace — live telemetry"
                  className="w-full rounded-xl border border-line"
                  loading="lazy"
                />
                <figcaption className="mt-3 text-[12.5px] leading-relaxed text-mute">
                  Overview &amp; Realtime: CCU, rooms, tick rate, tick-p99, live tick-time trace, tick
                  distribution histogram, transport mix, queue depths.
                </figcaption>
              </figure>

              <figure className="mt-8">
                <img
                  src="/console-wasm-modules.png"
                  alt="Project — WASM modules"
                  className="w-full rounded-xl border border-line"
                  loading="lazy"
                />
                <figcaption className="mt-3 text-[12.5px] leading-relaxed text-mute">
                  Project tab: configure sync rate and capacity, deploy WASM modules with an ABI
                  gate, upload maps, watch live rooms — activate and rollback without touching the
                  server.
                </figcaption>
              </figure>
            </Section>
          </div>

          {/* ── quick start ── */}
          <div id="quick-start" className="scroll-mt-24">
            <Section>
              <H2>Quick start</H2>
              <Sub>One command for the whole stack — Postgres, Redis and the server, mounted live.</Sub>

              <Pre lang="bash">{`git clone https://github.com/ananddub/cyg && cd cyg
just up                     # postgres + redis + server
# console → http://localhost:19224/dashboard/   (admin / change-me in dev)
just status                 # health of all containers
just game my-game           # run a different game · just logs · just down`}</Pre>

              <H3>New project</H3>
              <Pre lang="bash">{`cyg-gaming init my-game && cd my-game
cyg-gaming doctor              # config + schema + ABI health check
cyg-gaming run                 # compile room.ts → wasm and serve`}</Pre>

              <Warn>
                The engine deliberately does not host your game's website — you host the page (any
                static server) and point the client SDK at the server's control port. The control
                plane serves the SDK itself at <Code>/cyg.js</Code> and <Code>/openoxide-client.js</Code>,
                plus matchmake, signaling and the console.
              </Warn>
            </Section>
          </div>

          {/* ── writing a game ── */}
          <div id="writing-a-game" className="scroll-mt-24">
            <Section>
              <H2>Writing a game</H2>
              <Sub>
                A project is <Code>config.toml</Code>, your room source and schema, a website you host,
                and generated <Code>out/</Code>. The server reads only what the config names.
              </Sub>

              <H3>config.toml</H3>
              <Pre lang="ini">{`name = "my-game"
runtime = "assemblyscript"
source = "src/room.ts"
out = "out/room_logic.wasm"
port = 7779                 # game data (WebRTC over UDP)
quic_port = 7780            # QUIC/WebTransport lane (0 = off)
tick_rate = 128
max_clients = 16

[control]
api_port = 8124             # matchmake, signaling, console

[control.session]
database_url = "postgresql://…"`}</Pre>

              <H3>src/schema.ts — declare the state once</H3>
              <Pre lang="typescript">{`import { schema, t } from "cyg";

const Player = schema({ pid: t.int64(), x: t.number(), y: t.number(), score: t.number() }, "Player");
export const State = schema({
    players: t.map(Player),
    coinX: t.number(),
    coinY: t.number(),
}, "State");`}</Pre>
              <Note>
                Codegen emits typed server classes and the browser descriptor — the client gets its
                schema at join, so there is no client-side codegen step.
              </Note>

              <H3>src/room.ts — Colyseus-shaped, physics included</H3>
              <Pre lang="typescript">{`import { Room, InputReader, Rapier2D, BodyType } from "./openoxide-server";
import { GameState, Player } from "./openoxide.schema";

export class Arena extends Room {
    private s: GameState = new GameState();

    onCreate(max: i32): void {
        this.setState(this.s);
        Rapier2D.init(0.0, 0.0);
        const coin = Rapier2D.createBody(BodyType.Fixed, this.s.coinX, this.s.coinY);
        Rapier2D.addCircleCollider(coin, 24.0, true, 0.0, 0.0);
    }

    onInputPacket(id: i64, input: InputReader): void {
        // movement via host physics, mutate state — no byte wrangling
    }

    onTick(dt: f64): i64 {
        return this.commitState();      // dirty-only TLV delta, 128 Hz-ready
    }
}`}</Pre>

              <H3>Browser client — descriptor-driven, no codegen</H3>
              <Pre lang="javascript">{`const client = new CYG.Client(SERVER_ORIGIN);
const room = await client.joinOrCreate("game_room");

room.onStateChange((state) => render(state.players.get(room.playerId).x));
callbacks.onAdd("players", (p) => p.listen("score", (v) => hud(v)));

const reply = await room.request("login", { user });      // request/response RPC
room.send("fire", { dir });                                // reliable lane
room.sendUnreliable("move", input);                        // newest-wins lane`}</Pre>

              <H3>CLI</H3>
              <Pre lang="bash">{`cyg-gaming init [dir]              # scaffold a project
cyg-gaming run [dir]               # compile if needed, then serve
cyg-gaming aot [dir]               # precompile to native .cwasm (<1 ms cold start)
cyg-gaming schema [dir]            # compile schema.ts → bindings + descriptor
cyg-gaming schema-codegen [dir]    # typed client bindings (--lang cs|gdscript|cpp|lua|all)
cyg-gaming doctor [dir]            # config + schema + ABI health check
cyg-gaming cook in.glb out.oxcl    # cook a 3D collision mesh for instant boot`}</Pre>
            </Section>
          </div>

          {/* ════════════ THE A-TO-Z DEVELOPER GUIDE ════════════ */}
          <div className="border-t border-line pt-14">
            <div className="eyebrow mb-5">the a-to-z developer guide</div>
            <h2 className="font-display text-2xl font-bold text-fg sm:text-3xl">Every system, end to end.</h2>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-sub">
              From an empty folder to a deployed multiplayer game. Every API name below matches the
              SDK exactly (<Code>sdk/server/assemblyscript/cyg-server.ts</Code> and{' '}
              <Code>sdk/client/web/cyg.js</Code>).
            </p>
          </div>

          {/* 01 setup */}
          <G id="guide-setup" n="01" title="Project setup">
            <Pre lang="bash">{`cyg-gaming init my-game && cd my-game`}</Pre>
            <p>
              Two runtimes exist: <Code>runtime = "assemblyscript"</Code> (your logic compiles to
              WASM — the standard path) and the inbuilt backends (physics rooms, ECS rooms) the host
              can run natively.
            </p>
            <Table
              head={['Key', 'Meaning']}
              rows={[
                [<Code>name</Code>, 'project name'],
                [<><Code>source</Code> / <Code>out</Code></>, 'room entry file / compiled wasm output'],
                [<Code>port</Code>, 'WebRTC data plane (advertised in seat reservations)'],
                [<Code>quic_port</Code>, <>QUIC lane; <Code>0</Code> = off</>],
                [<Code>tick_rate</Code>, 'simulation Hz (20–128)'],
                [<><Code>max_clients</Code> / <Code>max_rooms</Code></>, 'per-process capacity caps'],
                [<><Code>width</Code> / <Code>height</Code></>, 'default world bounds handed to rooms'],
                [<Code>[control] api_port</Code>, 'matchmake + signaling + /v2 API + console'],
                [<Code>[control.session] database_url</Code>, 'Postgres for accounts, chat, everything BaaS'],
                [<><Code>game_id</Code> / <Code>game_key</Code></>, 'which registered game (games table) this process hosts — required the moment your database has 2+ games'],
                [<Code>permissions</Code>, <>gates the <Code>sys_*</Code> host imports (physics, logging, …)</>],
              ]}
            />
            <Note>
              Live edits: saving <Code>room.ts</Code> or <Code>schema.ts</Code> triggers recompile +
              hot-swap — players stay connected. <Code>cyg-gaming doctor</Code> validates the whole
              project. <Code>cyg-gaming aot</Code> precompiles to <Code>.cwasm</Code> for
              sub-millisecond cold starts.
            </Note>
          </G>

          {/* 02 state */}
          <G id="guide-state" n="02" title="Schema & state — the reactive core">
            <p>
              You declare the network state once; the build compiles it into typed server classes plus
              a browser descriptor. Clients decode at join — no client codegen, ever.
            </p>
            <Pre lang="typescript">{`// src/schema.ts
import { schema, t } from "cyg";

const Player = schema({
    pid: t.int64(), x: t.number(), y: t.number(),
    hp: t.int32(), score: t.int32(),
}, "Player");

export const State = schema({
    players: t.map(Player),          // collection (per-player entities)
    coinX:   t.number(),             // root scalars = world-level values
    coinY:   t.number(),
    phase:   t.int32(),
}, "State");`}</Pre>
            <p>In the room, the pattern is always the same three lines:</p>
            <Pre lang="typescript">{`// src/room.ts
import { GameState, Player } from "./openoxide.schema";

export class Arena extends Room {
    private s: GameState = new GameState();

    onCreate(max: i32): void {
        this.setState(this.s);                       // 1. bind the state
    }
    onTick(dt: f64): i64 {
        // ... mutate s.players / s.coinX ...
        return this.commitState();                    // 2. dirty-only delta out
    }
}`}</Pre>
            <Note>
              <b className="text-fg">How the wire works:</b> <Code>commitState()</Code> encodes only
              fields you changed (dirty tracking) into tagged TLV rows — a quiet room costs ~0
              bytes. Clients receive a full snapshot on join and patches afterwards, decoded through
              the descriptor. The state is also what the console's AOI and the descriptors in{' '}
              <Code>out/cyg.schema.bin</Code> are built from.
            </Note>
          </G>

          {/* 03 lifecycle */}
          <G id="guide-lifecycle" n="03" title="Room lifecycle hooks">
            <Table
              head={['Hook', 'When', 'Return']}
              rows={[
                [<Code>onCreate(max: i32)</Code>, 'room allocated; physics init, state bind', '—'],
                [<Code>onJoin(id: i64, x: f64, y: f64)</Code>, 'player seated (spawn x/y from host)', '—'],
                [<Code>onLeave(id: i64)</Code>, 'player gone (clean or timeout)', '—'],
                [<Code>onInputPacket(id, input: InputReader)</Code>, 'reliable app message from one player', '—'],
                [<Code>onTick(dt: f64)</Code>, <>every simulation tick at <Code>tick_rate</Code></>, <><Code>i64</Code> = <Code>commitState()</Code> result (ptr&lt;&lt;32 | len)</>],
                [<><Code>onSave()</Code> / <Code>onLoad()</Code></>, 'persistence snapshots (hibernation)', 'serialized state bytes'],
              ]}
            />
            <Note>
              Per-tick flow: <b className="text-fg">inputs in → simulate → commitState()</b>.{' '}
              <Code>dt</Code> is the tick delta in seconds (1/128 at 128 Hz) — always scale movement
              by it, never assume fixed values.
            </Note>
          </G>

          {/* 04 inputs */}
          <G id="guide-inputs" n="04" title="Inputs — the 128 Hz movement lane">
            <p>
              Movement input is special: it rides the <b className="text-fg">unreliable newest-wins
              lane</b> (a late packet is worthless). The client packs a small binary frame; the server
              reads it with <Code>InputReader</Code>.
            </p>
            <H3>Client side (web SDK)</H3>
            <Pre lang="javascript">{`// keys → one flag byte (W=1 S=2 A=4 D=8 …), aim as a normalized vector
let flags = 0;
if (keys.has("w")) flags |= 1;
if (keys.has("s")) flags |= 2;
if (keys.has("a")) flags |= 4;
if (keys.has("d")) flags |= 8;

// the movement packet: [flags u8][aimX f32][aimY f32] on the unreliable lane
const pkt = new DataView(new ArrayBuffer(9));
pkt.setUint8(0, flags);
pkt.setFloat32(1, aimX, true);
pkt.setFloat32(5, aimY, true);
room.sendUnreliable("input", new Uint8Array(pkt.buffer));`}</Pre>
            <H3>Server side</H3>
            <Pre lang="typescript">{`import { InputReader, Key, isHeld } from "./openoxide-server";

onInputPacket(id: i64, input: InputReader): void {
    const flags = input.readU8();
    const aimX  = input.readF32();
    const aimY  = input.readF32();
    if (isHeld(flags, Key.W)) { /* forward */ }
}`}</Pre>
            <Note>
              <Code>InputReader</Code>: <Code>readU8()</Code>, <Code>readF32()</Code>,{' '}
              <Code>readF64()</Code>, <Code>readI64()</Code>, <Code>hasRemaining(n)</Code> —
              cursor-based, never throws past the end you check. <Code>Key</Code>/<Code>KeyCode</Code>{' '}
              carry the standard constants; <Code>heldFlags(ptr,len)</Code> +{' '}
              <Code>isHeld(flags,key)</Code> decode packed key bytes. For physics-based movement,{' '}
              <Code>Physics.move(pos, vel, radius, dt)</Code> (see §06) applies wall-sliding kinematic
              motion in one call.
            </Note>
            <Warn label="Rule">
              <Code>onInputPacket</Code> is the <b>reliable</b> path (fires, chats, RPC-shaped
              messages — things you cannot afford to drop). Per-tick movement stays on{' '}
              <Code>sendUnreliable</Code>. Never swap them.
            </Warn>
          </G>

          {/* 05 2d physics */}
          <G id="guide-2d" n="05" title="2D physics — Rapier2D (host-side, native speed)">
            <p>
              Physics runs in the host, not the guest: your room calls imports, the host steps the
              world. Guest cost is just the calls (~7k CCU/core @128 Hz measured with 100–200-player
              rooms).
            </p>
            <Pre lang="typescript">{`import { Rapier2D, BodyType, Vec2 } from "./openoxide-server";

onCreate(max: i32): void {
    Rapier2D.init(0.0, 0.0);                       // gravity x, y (top-down: 0,0)
    this.playerBody = Rapier2D.createBody(BodyType.Dynamic, x, y);
    Rapier2D.addCircleCollider(this.playerBody, 14.0, false, 0.0, 0.0);
    //                                     radius  sensor
    this.coinBody = Rapier2D.createBody(BodyType.Fixed, 400, 250);
    Rapier2D.addCircleCollider(this.coinBody, 24.0, true, 0.0, 0.0);  // sensor = pickup
}

onTick(dt: f64): i64 {
    // move: velocity or impulses — your choice per game
    Rapier2D.setVelocity(this.playerBody, vx, vy);
    // Rapier2D.applyImpulse(this.playerBody, ix, iy);

    // pickup: sensor contact test
    if (Rapier2D.checkContact(this.playerBody, this.coinBody)) { /* score++ */ }

    Rapier2D.step(dt);                              // advance the world once

    const out = new Vec2();
    if (Rapier2D.getPosition(this.playerBody, out)) {
        p.x = out.x; p.y = out.y;                   // read back into state
    }
    return this.commitState();
}`}</Pre>
            <MonoBlock title="Full Rapier2D surface">
              <Code>init(gx, gy)</Code> · <Code>createBody(BodyType.Dynamic|Fixed, x, y)</Code> ·{' '}
              <Code>addCircleCollider(bodyId, radius, sensor, ox, oy)</Code> ·{' '}
              <Code>addBoxCollider(...)</Code> · <Code>setVelocity(id, vx, vy)</Code> ·{' '}
              <Code>getVelocity(id, out: Vec2)</Code> · <Code>getPosition(id, out: Vec2)</Code> ·{' '}
              <Code>setPosition(id, x, y)</Code> · <Code>applyImpulse(id, ix, iy)</Code> ·{' '}
              <Code>checkContact(a, b)</Code> · <Code>removeBody(id)</Code> · <Code>step(dt)</Code>
            </MonoBlock>
            <H3>2D arena geometry (walls, obstacles)</H3>
            <p>Two ways — both boot-loaded once, cloned into every room (never re-created per tick):</p>
            <DocList>
              <li>
                <b className="text-fg"><Code>arena_2d.json</Code></b> in the project folder — boxes
                carry <Code>x/y/w/h</Code> (optional <Code>rotation</Code> radians); all become fixed
                colliders. Or <Code>arena_map.json</Code> — parsed as a 2D map when no{' '}
                <Code>arena_2d.json</Code> exists.
              </li>
              <li>
                <b className="text-fg">Console upload:</b> game → Project → <b>Maps</b> → upload the
                same JSON with format <b>2D arena</b>. The active version reaches the server at boot
                (no SSH, no file copy) and new rooms spawn on a re-activated map live.
              </li>
            </DocList>
            <Pre lang="json">{`{ "arena_width": 800, "arena_height": 600,
  "obstacles": [ { "x": 100, "y": 300, "w": 20, "h": 400, "rotation": 0 } ] }`}</Pre>
          </G>

          {/* 06 3d physics */}
          <G id="guide-3d" n="06" title="3D — kinematic Physics + Rapier3D">
            <p>
              3D gives you two layers. <b className="text-fg">Physics</b> is the character controller
              layer: world geometry, wall-sliding movement, raycasts, lag compensation.{' '}
              <b className="text-fg">Rapier3D</b> is the rigid-body layer: balls, boxes, impulses —
              projectiles, debris, dynamic props.
            </p>
            <H3>Map geometry (choose one, loaded at boot)</H3>
            <Pre lang="bash">{`# cook a GLB scene into an OXCL collision mesh (instant boot, baked statics)
cyg-gaming cook map.glb arena.oxcl

# …or simple boxes: arena_map.json
{ "arena_width": 60, "arena_depth": 60,
  "obstacles": [ { "id": 1, "name": "wall", "x": 0, "y": 2, "z": -30,
                   "w": 60, "h": 4, "d": 1, "walkable_roof": false } ] }`}</Pre>
            <Note>
              Priority at boot: console-uploaded map (per game, active version) → local{' '}
              <Code>arena.oxcl</Code> → <Code>arena_map.json</Code>. Rooms clone the loaded world —
              spawn cost is milliseconds, geometry processing never repeats per tick.
            </Note>
            <H3>Kinematic character movement (a platformer pattern)</H3>
            <Pre lang="typescript">{`import { Physics, Vec3 } from "./openoxide-server";

onTick(dt: f64): i64 {
    // desired velocity from input, then one call moves + slides along walls
    const result = Physics.move(pos, vel, /*radius*/ 0.5, dt);
    // result: MoveResult { position, grounded … }

    // snap to floors / walk on ramps:
    const ground = Physics.getSurfaceHeight(pos, 0.5);

    // hitscan with lag compensation (rewinds to what the shooter saw):
    const hit = Physics.lagRaycast(origin, dir, 200.0);
    return this.commitState();
}`}</Pre>
            <Note>
              <b className="text-fg">Physics surface:</b> <Code>move / moveRaw</Code> (wall-sliding
              step), <Code>raycast / raycastRaw</Code>, <Code>lagRaycast</Code>,{' '}
              <Code>getSurfaceHeight</Code>, <Code>distance</Code>, <Code>checkCircleOverlap</Code>{' '}
              (XZ), <Code>checkSphereOverlap</Code>, <Code>isPointInSphere</Code>,{' '}
              <Code>isPointInBox</Code>. Vector-first: APIs take <b>Vec2/Vec3</b>, the{' '}
              <Code>*Raw</Code> variants are scalar escape hatches.
            </Note>
            <H3>Rapier3D rigid bodies (projectiles, dynamic props)</H3>
            <Pre lang="typescript">{`import { Rapier3D, BodyType, Vec3 } from "./openoxide-server";

onCreate(max: i32): void { Rapier3D.init(new Vec3(0.0, -9.81, 0.0)); }

onTick(dt: f64): i64 {
    const bullet = Rapier3D.createBody(BodyType.Dynamic, spawnPos);
    Rapier3D.addBallCollider(bullet, 0.1);
    Rapier3D.setVelocity(bullet, new Vec3(dir.x * 60, dir.y * 60, dir.z * 60));

    if (Rapier3D.checkContact(bullet, targetBody)) { /* damage */ }

    Rapier3D.step(dt);
    const p = Rapier3D.getPosition(bullet);        // returns Vec3
    return this.commitState();
}`}</Pre>
            <MonoBlock title="Full Rapier3D surface">
              <Code>init(gravity: Vec3)</Code> · <Code>createBody(BodyType, pos: Vec3)</Code> ·{' '}
              <Code>addBallCollider(id, radius)</Code> · <Code>addBoxCollider(id, halfExtents: Vec3)</Code>{' '}
              · <Code>setPosition / setVelocity / getPosition / getVelocity</Code> ·{' '}
              <Code>applyImpulse(id, impulse: Vec3)</Code> · <Code>checkContact(a, b)</Code> ·{' '}
              <Code>removeBody(id)</Code> · <Code>step(dt)</Code>
            </MonoBlock>
            <Note>
              Per-core physics capacity (measured, 1-core / 2 GB cgroup): Rapier3D 500-body
              rooms ≈ <b className="text-fg">15k CCU @60 Hz</b> p99-safe. Physics is never the
              bottleneck — guest logic is.
            </Note>
          </G>

          {/* 07 navmesh */}
          <G id="guide-navmesh" n="07" title="Navmesh — bot pathfinding">
            <p>
              Bots ask the host for an any-angle path across the baked navmesh; you steer them along
              the waypoints. Nothing to compute in the guest.
            </p>
            <Pre lang="typescript">{`import { NavMesh, Vec2 } from "./openoxide-server";

onTick(dt: f64): i64 {
    for each bot:
        if (reachedWaypoint || waypoints.length == 0) {
            waypoints = NavMesh.findPath(botPos, targetPos, /*maxPoints*/ 32);
            waypointIndex = 0;
        }
        // steer toward waypoints[waypointIndex], advance when close
}`}</Pre>
            <H3>Getting a navmesh in (two ways)</H3>
            <DocList>
              <li>
                <b className="text-fg">Console upload:</b> game → Project → <b>Maps</b> → format{' '}
                <b>Navmesh</b> → upload the baked file (Polyanya <Code>.nav2d</Code>/<Code>.mesh</Code>).
                The server loads the active version at boot and injects it into every room —{' '}
                <Code>sys_navmesh_find_path</Code> reads it inside <Code>NavMesh.findPath</Code>.
              </li>
              <li>
                It is also injected automatically when the map arrives with the game's uploaded
                assets — rooms created after the injection (or re-injected hot-reload) see it.
              </li>
            </DocList>
            <Note>
              <Code>findPath</Code> returns corner waypoints — the start and goal are not guaranteed
              members of the list; steer point-to-point and treat the last point as "arrive".
              Unreachable targets return an empty path.
            </Note>
          </G>

          {/* 08 aoi */}
          <G id="guide-aoi" n="08" title="AOI — area of interest">
            <p>
              Register every moving entity once, query who is near — the host keeps the spatial index
              (kiddo r-tree) and your deltas stay small because clients only receive what matters.
            </p>
            <Pre lang="typescript">{`// keep the index fresh (on join / on tick when moving)
spatialUpdate(playerId, new Vec2(p.x, p.y));
// 3D worlds / plain numbers:
spatialUpdateXY(playerId, x, y);

// who is within R units of me? → ids written into your buffer, count returned
const near = spatialQuery(new Vec2(p.x, p.y), 40.0, outIdsPtr);

// on leave — remove or the ghost lingers in everyone's queries:
spatialRemove(playerId, new Vec2(p.x, p.y));`}</Pre>
            <Note>
              The host's schema-AOI can also filter deltas automatically when your schema carries{' '}
              <Code>x/y</Code> fields and <Code>[aoi] enabled = true</Code> in config — entities
              outside a viewer's radius are not encoded for that viewer at all.
            </Note>
          </G>

          {/* 09 rng/timers */}
          <G id="guide-util" n="09" title="RNG, timers, combat, match state">
            <p>
              All deterministic, all rollback-safe — these never read wall-clock, so a replay
              re-simulates identically.
            </p>
            <Pre lang="typescript">{`// deterministic RNG (per-room seeded from the room name)
rngNext(): f64                            // 0..1, xorshift64 — loot spawns, scatter
Random.seed(s: u64) / Random.nextU32()    // explicit control
clockTicks(): i64                         // the tick counter — time itself

// tick-based timers (Colyseus this.clock, but deterministic)
Timers.set(id, delayTicks, intervalTicks = 0)   // 0 = one-shot
Timers.poll()                                   // once per onTick → fired ids
Timers.cancel(id)

// combat: zone-weighted damage with crits
const dmg = Combat.applyDamage(/* attacker seed, zone, weapon … */);  // → DamageResult

// match flow machine + pickup/cooldown helpers
MatchStateMachine / CooldownTracker / TriggerZone`}</Pre>
            <Note>
              Timers are <b className="text-fg">polled</b>, not callbacks: call{' '}
              <Code>Timers.poll()</Code> at the top of <Code>onTick</Code> and switch on the returned
              ids. That is what makes them survive rollback replays.
            </Note>
          </G>

          {/* 10 messaging */}
          <G id="guide-messaging" n="10" title="Messaging — broadcast, send, RPC">
            <Pre lang="typescript">{`// server → everyone (reliable)
this.broadcast("phase", writerBytes);
this.broadcastText("chat", "welcome!");

// server → one player
this.sendTo(playerId, "private", bytes);
this.sendTextTo(playerId, "toast", "level up");

// ── request/response RPC (client asks, server answers) ──
this.onRequest("login", (senderId: i64, reader: InputReader, ctx: RequestContext) => {
    const name = reader.remainingBytes();          // read the payload
    ctx.replyText("ok");                            // or ctx.reply(bytes)
});
// 'request'/'response' are reserved names — onMessage never sees them.

// typed app messages from clients (reliable lane)
this.onMessage("chat", (senderId, reader, room) => { /* … */ });`}</Pre>
            <Table
              head={['Client call', 'Lane', 'Use for']}
              rows={[
                [<><Code>room.send(type, data)</Code> / <Code>sendBytes</Code></>, 'reliable, ordered', 'fire, hit, chat, score — cannot drop'],
                [<Code>room.sendUnreliable(type, data)</Code>, 'newest-wins, no retransmit', 'movement/aim every tick'],
                [<Code>room.request(type, data, timeoutMs=5000)</Code>, 'reliable + promise', 'login, buy, match action — await reply'],
              ]}
            />
            <Note>
              Server events (Fire/Hit/Scores) ride an ordered event lane with sequence numbers and
              SACK resends — a client that misses frame 12 gets exactly frame 12 again, nothing
              more. Lanes never block each other.
            </Note>
          </G>

          {/* 11 maps */}
          <G id="guide-maps" n="11" title="Maps A-to-Z">
            <Table
              head={['Format', 'File', 'How to make', 'Feeds']}
              rows={[
                [<><b>3D mesh</b> (<Code>oxcl</Code>)</>, <Code>arena.oxcl</Code>, <Code>cyg-gaming cook map.glb arena.oxcl</Code>, '3D static collision (both physics layers)'],
                [<><b>3D boxes</b> (JSON)</>, <Code>arena_map.json</Code>, 'hand-write (x/y/z/w/h/d per box)', 'PhysicsWorld3D walls'],
                [<><b>2D arena</b> (JSON)</>, <Code>arena_2d.json</Code>, 'hand-write (boxes/circles)', 'Rapier2D static colliders + arena bounds'],
                [<b>Navmesh</b>, <><Code>.nav2d</Code>/<Code>.mesh</Code></>, 'bake (Polyanya format)', <Code>NavMesh.findPath</Code>],
              ]}
            />
            <p>
              <b className="text-fg">Delivery:</b> per game, from the console — Project →{' '}
              <b>Maps</b> → drop the file, pick format, <b>Upload &amp; activate</b>. Gates run at
              upload (OXCL magic, JSON dims, 32 MiB cap, obstacle caps); activation is per-format and
              versioned (rollback = activate the old version). The server loads the active set at
              boot — console maps beat local files — and a re-activation reaches new rooms live.
              Deleting the active version is refused. No SSH, no file copies, per tenant.
            </p>
          </G>

          {/* 12 client sdk */}
          <G id="guide-client" n="12" title="Client SDK A-to-Z (web)">
            <Pre lang="javascript">{`import CYG from "/openoxide-client.js";          // served by the control plane
const { Client, Callbacks, Storage } = CYG;

// ── connect ──
const client = new Client(SERVER_ORIGIN);        // control-plane origin
const room = await client.joinOrCreate("game_room", { mode: "duo" });
// also: client.join(name) · client.create(name) · client.joinById(id) · client.spectate(name)

// ── state (descriptor arrives on join; zero codegen) ──
room.onStateChange((state) => draw(state.players.get(room.playerId)));
const cb = Callbacks.get(room);
cb.onAdd("players", (p, id) => { /* spawn */ });
cb.onRemove("players", (p, id) => { /* despawn */ });
const stop = p.listen("hp", (value, prev) => bar(value));  // field-level, returns unsubscribe

// ── signals ──
room.onError((code, msg) => {}); room.onLeave((code) => {});
room.onReconnect(() => {});      room.onDrop(() => {});        // auto-reconnect is built in

// ── messaging ──
room.onMessage("chat", (payload) => {});
room.onMessage("*", (type, payload) => {});                    // wildcard
room.send("fire", { dir });  room.sendBytes("bin", u8);
room.sendUnreliable("move", u8);                               // newest-wins lane
const res = await room.request("login", { user });              // RPC, 5 s timeout

// ── accounts ──
await client.auth.login({ email, password });    // also .device .register .provider .gameCenter .instantGame

// ── helpers ──
Storage.set("muted", true); Storage.get("muted", false);      // localStorage, JSON, 'ox_' prefix
room.clock.now(); room.clock.setTimeout(fn, ms);               // server-clock aligned
room.ping((rttMs) => {}); room.leave(/*consented*/ true);`}</Pre>
            <Note>
              Server-side SDK (<Code>cyg-server.ts</Code>) mirrors every name you saw in §04–§10 —
              one mental model both ends. Generated interfaces exist for Lua/C/C++/Rust/C#/TS ({' '}
              <Code>cyg-gaming gen-interface</Code>); native engines speak raw UDP with the same frames.
            </Note>
          </G>

          {/* 13 console */}
          <G id="guide-console" n="13" title="Console operations">
            <DocList>
              <li><b className="text-fg">Games &amp; Projects</b> — register a game (minted <Code>game_key</Code>/<Code>api_key</Code>/<Code>client_key</Code>), open its workspace. Every view inside is scoped to that game; another game's telemetry is refused, not mixed.</li>
              <li><b className="text-fg">Overview &amp; Realtime</b> — live CCU/rooms/tick-rate/tick-p99, tick-time trace, tick histogram, transport mix, queue depths. One live socket feed.</li>
              <li><b className="text-fg">Project → Configuration</b> — sync rate (Hz applies <b>live</b>, the running server retunes on the next tick), max players, persistent rooms, auto-close. Changes to status/engine switch relay↔WASM.</li>
              <li><b className="text-fg">Project → Maps</b> — upload/activate/delete per format (§11).</li>
              <li><b className="text-fg">Project → WASM Modules</b> — upload <Code>.wasm</Code> (+ source for audit), ABI gate names any missing export, activate/rollback with a live hot-swap — players stay connected.</li>
              <li><b className="text-fg">Game Rooms / Matches</b> — live rooms with member lists; terminate a match from the row.</li>
              <li><b className="text-fg">Accounts</b> — full BaaS surface; <b>Ban</b> revokes tokens instantly and <b>kicks live sessions</b> (matches left, socket closed) — not just "blocked at next login".</li>
              <li><b className="text-fg">Players / Game Data / Monetization</b> — accounts, groups, notifications, leaderboards, tournaments, storage, purchases, subscriptions — all filtered by the game you are in.</li>
            </DocList>
          </G>

          {/* 14 deploy */}
          <G id="guide-deploy" n="14" title="Deployment">
            <Pre lang="bash">{`# one VPS ($10/mo class serves ~4k realistic combat CCU @60 Hz)
just up                       # postgres + redis + server, repo mounted
# open in firewall: cfg.port/udp, quic_port/udp, 7778/udp, api_port/tcp`}</Pre>
            <DocList>
              <li><b className="text-fg">Secrets:</b> real <Code>[control.session]</Code> signing keys + console credentials; the server refuses default secrets unless <Code>OX_ALLOW_DEFAULT_SECRETS=1</Code> (dev only).</li>
              <li><b className="text-fg">Identity:</b> set <Code>game_id</Code> (or <Code>game_key</Code>) — with 2+ games in the database the process refuses to guess.</li>
              <li><b className="text-fg">Scale-out:</b> Agones hooks are built in — the pod reports Ready, health-pings, and retires cleanly. One binary per pod; the console shows which game each node hosts.</li>
              <li><b className="text-fg">Health:</b> <Code>/status</Code> (live tick rate, CCU, uptime), <Code>/health</Code>, <Code>cyg-gaming doctor</Code>.</li>
            </DocList>
          </G>

          {/* 15 schema dsl */}
          <G id="guide-schema" n="15" title="Schema DSL — complete reference">
            <p>
              Colyseus v5 syntax, fully compatible. File: <Code>src/schema/player.ts</Code>. The
              compiler reads the <Code>schema({'{...}'}, "Name")</Code> calls and generates the typed
              AssemblyScript binding (<Code>gen/cyg.schema.ts</Code>), the binary descriptor ({' '}
              <Code>out/cyg.schema.bin</Code>) and the browser contract ({' '}
              <Code>out/cyg.schema.d.ts</Code>).
            </p>

            <H3>Primitives</H3>
            <Table
              dense
              head={['Declaration', 'Wire type', 'Bytes', 'Range / notes']}
              rows={[
                [<><Code>t.number()</Code> / <Code>t.float64()</Code> / <Code>t.f64()</Code></>, 'f64', '8', 'positions, angles — default numeric choice'],
                [<><Code>t.float32()</Code> / <Code>t.f32()</Code></>, 'f32', '4', '7 significant digits'],
                [<><Code>t.int8()</Code> / <Code>t.i8()</Code></>, 'i8', '1', '−128…127'],
                [<><Code>t.uint8()</Code> / <Code>t.u8()</Code></>, 'u8', '1', '0…255 — HP, level, flags'],
                [<><Code>t.int16()</Code> / <Code>t.i16()</Code></>, 'i16', '2', '−32768…32767'],
                [<><Code>t.uint16()</Code> / <Code>t.u16()</Code></>, 'u16', '2', '0…65535'],
                [<><Code>t.int32()</Code> / <Code>t.i32()</Code></>, 'i32', '4', 'signed 32-bit'],
                [<><Code>t.uint32()</Code> / <Code>t.u32()</Code></>, 'u32', '4', '0…4294967295'],
                [<><Code>t.int64()</Code> / <Code>t.i64()</Code></>, 'i64', '8', 'player ids (i64)'],
                [<><Code>t.boolean()</Code> / <Code>t.bool()</Code></>, 'bool', '1', 'true/false'],
                [<Code>t.string()</Code>, 'string', 'var', 'UTF-8, len-prefixed'],
              ]}
            />
            <Note>
              <b className="text-fg">Size matters:</b> the delta encodes only changed fields — an HP
              that fits in <Code>uint8</Code> costs 1 byte per change vs 8 for <Code>number</Code>.
              At 128 Hz × 1000 players the right type choice is the difference between 8 KB/s and
              64 KB/s per field.
            </Note>

            <H3>Collections</H3>
            <Table
              head={['Declaration', 'Use']}
              rows={[
                [<Code>t.map(Player)</Code>, <>keyed entities — <Code>players.set(id, p)</Code>, <Code>.get(id)</Code>, <Code>.delete(id)</Code>, <Code>.ids</Code></>],
                [<Code>t.array(Item)</Code>, 'ordered list — chat log, bullet feed'],
                [<Code>t.ref(Other)</Code>, 'entity reference — the entity id travels on the wire'],
              ]}
            />

            <H3>Defaults</H3>
            <Pre lang="typescript">{`pid: t.int64().default(0),
hp: t.uint8().default(100),`}</Pre>
            <Note>
              <Code>.default(value)</Code> is supported on primitives and strings — assign arrays in
              the constructor.
            </Note>

            <H3>Rules</H3>
            <DocList>
              <li>Every schema file must <Code>export const State = schema({'{...}'}, "State")</Code> — the root.</li>
              <li>Entity defs (<Code>Player</Code> etc.) are referenced by name inside collections.</li>
              <li>Reserved words (<Code>var</Code>, <Code>function</Code>, <Code>this</Code>…) are not allowed as field names.</li>
              <li>Rooms import from <Code>../gen/cyg.schema</Code> — do not import <Code>src/schema/player.ts</Code> directly (the module does not resolve inside the WASM guest).</li>
              <li>Run <Code>cyg-gaming schema</Code> after edits, or <Code>cyg-gaming run</Code> auto-compiles.</li>
            </DocList>
          </G>

          {/* ── netcode ── */}
          <div id="netcode" className="scroll-mt-24">
            <Section>
              <H2>Netcode &amp; transports</H2>
              <Sub>
                One process, three doors, one wire contract. Reliability is QUIC-tier on every lane —
                per-frame sequence, reorder-safe delivery, SACK selective resends — not a TCP fallback.
              </Sub>

              <Table
                head={['Lane', 'Who', 'Unreliable', 'Reliable', 'Connect path']}
                rows={[
                  [<b>WebRTC DataChannels</b>, 'browsers (universal)', 'newest-wins deltas', 'ordered events + RPC', 'seat → signaling WS → ICE/DTLS'],
                  [<b>raw UDP</b>, 'Unity / Unreal / Godot native', 'same input lane', 'RUDP: SACK + per-frame RTO', 'HMAC seat token'],
                  [<b>QUIC / WebTransport</b>, 'engine + native clients (browsers: in progress)', 'QUIC datagrams', 'QUIC streams, framed', 'direct, self-signed hash pinning'],
                ]}
              />

              <Table
                head={['Port', 'Config', 'What']}
                rows={[
                  [<Code>cfg.port</Code>, <Code>port</Code>, 'WebRTC data plane (advertised in seats)'],
                  [<Code>cfg.quic_port</Code>, <Code>quic_port</Code>, 'QUIC/WebTransport listener (0 = off)'],
                  [<Code>:7778</Code>, 'plane config', 'native engine UDP'],
                  [<Code>cfg.control.api_port</Code>, <Code>api_port</Code>, 'matchmake, signaling, /v2 API, console'],
                ]}
              />

              <H3>Fan-out engineering</H3>
              <Note>
                Delta broadcast is not a naive loop: <b className="text-fg">sendmmsg</b> batches
                syscalls (measured ~6–7% send-side saving on loopback, more on real NICs) and{' '}
                <b className="text-fg">UDP GSO</b> collapses same-destination runs — measured at{' '}
                <b className="text-fg">0.3% of per-message send_to walltime</b> for GSO-eligible
                bursts. Hot-path buffers are pre-allocated; the 128 Hz tick budget is respected by
                construction.
              </Note>
            </Section>
          </div>

          {/* ── benchmarks ── */}
          <div id="benchmarks" className="scroll-mt-24">
            <Section>
              <H2>Benchmarks</H2>
              <Sub>
                Measured sandboxed in a strict <b className="text-fg">1-core / 2 GB cgroup</b> — every
                published number sits <b className="text-fg">below</b> what the same run measured.
                Reproducible from the repo.
              </Sub>

              <Table
                head={['Inbuilt backend / workload', 'p99 tick', 'CCU per core']}
                rows={[
                  ['WASM room, full combat logic (move + shoot + damage + respawn) @60 Hz', '2.5 ms @500p', '~1.5k'],
                  ['WASM room + inbuilt Rapier2D @128 Hz, 100–200p rooms', '0.08 ms @100p', '~7k'],
                  ['Inbuilt ECS backend (movement) @128 Hz', '0.07 ms @100p', '~10k'],
                  ['Rapier3D physics step @60 Hz, 500-body rooms', '0.37 ms', '~15k'],
                  ['Combined room tick (WASM + Rapier3D + delta) @60 Hz', '0.16 ms @100p', '~5k'],
                ]}
              />

              <Note>
                Room size matters: one 5000-body room is the wrong shape while 100–500-player rooms
                leave 95%+ of the budget free. A 2-core / 2 GB pod serves{' '}
                <b className="text-fg">100 rooms × 100 players at 128 Hz</b> (0.76× of budget) with
                peak RAM of 93 MB — 4.6% of the pod. RAM is never the bottleneck; CPU is.
              </Note>
            </Section>
          </div>

          {/* ── compare ── */}
          <div id="compare" className="scroll-mt-24">
            <Section>
              <H2>How it compares</H2>
              <Sub>
                Honest table, not a mud-slinging one. Each of these is good at what it does — CYG's
                claim is the combination, self-hosted, at commodity-hardware economics.
              </Sub>

              <Table
                dense
                head={['', 'CYG', 'Colyseus', 'Nakama', 'SpacetimeDB', 'Photon']}
                rows={[
                  ['Reactive room state-sync DX', <b className="text-oxide">✔</b>, '✔', '—', 'subscriptions', '✔ (closed)'],
                  ['BaaS (accounts/chat/leaderboards/IAP)', <b className="text-oxide">✔ same process</b>, '—', '✔', '—', 'add-on'],
                  ['Authoritative custom logic, sandboxed', <b className="text-oxide">✔ WASM per-room</b>, 'Node process', 'Go/Lua/TS module', '✔ WASM module', 'closed runtime'],
                  ['Physics / navmesh / AOI inbuilt', <b className="text-oxide">✔ Rapier + A* + AOI</b>, '—', '—', '—', '✔'],
                  ['Transports', <b className="text-oxide">WebRTC + UDP + QUIC</b>, 'WS/WebRTC', 'WS', 'WebSocket/SPDN-b', 'UDP (their relay)'],
                  ['Multi-tenant SaaS hosting', <b className="text-oxide">✔ sandboxed tenants</b>, '—', '—', '—', 'their cloud only'],
                  ['Self-host cost @ ~2k CCU', <b className="text-oxide">~$10/mo VPS</b>, '~$72+/mo cloud', 'varies', 'varies', '$240+/mo class'],
                  ['Ecosystem maturity', 'early — read the honest note', '10+ years', '10+ years', 'growing fast', 'mature, closed'],
                ]}
              />

              <Warn label="Honest note">
                CYG is young. No shipped games yet, docs are this page, and the community is you (for
                now). Raw full-combat CCU/core is at <i>parity</i> with Colyseus's measured baseline —
                the win is the collapsed stack, the inbuilt backends, determinism, and self-host
                economics, not a magic performance multiplier. Pick it for the architecture and the
                bill; expect to read source code like an early adopter.
              </Warn>
            </Section>
          </div>

          {/* ── architecture ── */}
          <div id="architecture" className="scroll-mt-24">
            <Section>
              <H2>Architecture</H2>
              <Sub>One process. One thread for the simulation. A lock-free bus between planes.</Sub>

              <div className="mt-6">
                <Pre>{`┌──────────────────────────  one process  ──────────────────────────┐
│  Control plane (Tokio/Axum)          Game host loop (pinned sim)  │
│  ├─ matchmake + seat tokens          ├─ WASM room runtime         │
│  ├─ /ws/signal  (WebRTC signaling)   ├─ inbuilt ECS backend       │
│  ├─ /v2/* player API (BaaS)          ├─ Rapier2D/3D physics       │
│  ├─ /v2/console/* + web dashboard    ├─ AOI / spatial index       │
│  └─ statics (SDK + unity pages)      └─ WebRTC · UDP · QUIC lanes │
│            everything talks through one lock-free bus             │
└───────────────────────────────────────────────────────────────────┘`}</Pre>
              </div>

              <Table
                head={['Crate', 'What it is']}
                rows={[
                  [<Code>engine-server</Code>, 'host loop: WASM runtime, rooms, inbuilt ECS backend, RUDP, deltas, AOI'],
                  [<Code>engine-api</Code>, '/v2 player API + /v2/console + dashboard API'],
                  [<Code>engine-net</Code>, 'transports: WebRTC (str0m) + raw UDP + QUIC (quinn-proto, sans-IO)'],
                  [<Code>engine-webrtc-protocol</Code>, 'the shared wire: event/ack frames, SACK, lanes'],
                  [<><Code>engine-wasm</Code> / <Code>engine-schema</Code></>, 'guest ABI + permissions / schema compiler + codegen'],
                  [<><Code>engine-physics</Code> / <Code>engine-nav</Code> / <Code>engine-spatial</Code></>, 'Rapier worlds + OXCL meshes / navmesh A* / AOI index'],
                  [<><Code>engine-control</Code> / <Code>engine-bus</Code> / <Code>engine-agones</Code></>, 'plane binding / lock-free channels / K8s GameServer lifecycle'],
                  [<><Code>engine-config</Code> / <Code>engine-dashboard</Code></>, 'config.toml → typed structs / the web console'],
                ]}
              />

              <H3>Tenancy</H3>
              <Note>
                The console and database serve many games; each process hosts one. A game workspace
                shows only that game's data — telemetry for any other tenant is refused ("This server
                hosts 'X', not the requested game") and database views filter by <Code>game_id</Code>.
                Bind a process with <Code>game_id</Code>/<Code>game_key</Code> in config.toml.
              </Note>

              <H3>Testing</H3>
              <Pre lang="bash">{`cargo test --workspace              # engine crates + API suite
node --test sdk/client/web/test/    # client SDK (schema decode, signaling, RPC)
just doctor <game>                  # project-level health check`}</Pre>
            </Section>
          </div>

          {/* footer */}
          <div className="border-t border-line pt-8 text-[12.5px] leading-relaxed text-mute">
            CYG — Apache-2.0. Source in <Code>crates/</Code>, console captures in{' '}
            <Code>docs/screenshots/</Code>. SDK: <Code>sdk/client</Code> + <Code>sdk/server</Code>{' '}
            (AssemblyScript first, Lua/C/C++/Rust/C#/TS interfaces generated).
          </div>
        </main>
      </div>
    </div>
  )
}
