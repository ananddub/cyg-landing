import { useEffect, useRef, useState } from 'react'
import { siSurrealdb } from 'simple-icons'
import { Users, Route, MonitorSmartphone, Cpu, Package, Database, Binary } from 'lucide-react'

/* Animated scaling story: one box → identical pods → split on config.
   Icon cards + dashed planes + traveling link packets, CSS-interpolated. */

const si = (icon, cls) => (
  <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
    <path d={icon.path} />
  </svg>
)

const ELEMS = {
  players: { label: 'players', tint: 'text-sub border-line bg-panel-2', icon: (c) => <Users className={c} /> },
  mm: { label: 'matchmaker', tint: 'text-frost border-frost/60 bg-frost/10', icon: (c) => <Route className={c} /> },
  api: { label: 'API + console', tint: 'text-frost border-frost/60 bg-frost/10', icon: (c) => <MonitorSmartphone className={c} /> },
  rooms: { label: 'rooms · sim', tint: 'text-oxide border-oxide/60 bg-oxide/10', icon: (c) => <Cpu className={c} /> },
  db: { label: 'SurrealDB', tint: 'text-ember border-ember/60 bg-ember/10', icon: (c) => si(siSurrealdb, c) },
  blobs: { label: 'blobs · local', tint: 'text-sub border-line bg-panel-2', icon: (c) => <Package className={c} /> },
  s3: { label: 'S3 bucket', tint: 'text-sub border-line bg-panel-2', icon: (c) => <Database className={c} /> },
  clone: { label: 'same binary', tint: 'text-mute border-line/70 bg-panel-2/60 border-dashed', icon: (c) => <Binary className={c} /> },
}

/* approx half-width of each card in viewBox % units — links attach to card
   edges, never through the middle of a card */
const HALF_W = {
  players: 3.4, mm: 4.6, api: 5.2, rooms: 4.8, db: 4.6, blobs: 4.8, s3: 4.2,
  clone1: 4.4, clone2: 4.4, rooms1: 4.8, rooms2: 4.8, p2a: 0, p3a: 0,
};

const STAGE_META = [
  { n: '01', name: 'One box', caption: 'players → API console → rooms · SurrealDB · blobs — all inside one process.' },
  { n: '02', name: 'Identical pods', caption: 'clone the whole pod — the matchmaker seats players across identical binaries.' },
  { n: '03', name: 'Rooms scale out', caption: 'room hosts split into their own tier — API + SurrealDB + blobs stay in the control plane.' },
]

const STAGES = [
  {
    boxes: [{ id: 'pod', x: 30, y: 12, w: 62, h: 76, label: 'one binary' }],
    pos: {
      players: { x: 6, y: 50 },
      api: { x: 44, y: 30 },
      rooms: { x: 78, y: 30 },
      db: { x: 44, y: 68 },
      blobs: { x: 78, y: 68 },
    },
    glow: [],
    links: [
      ['players', 'api'],
      ['api', 'rooms'],
      ['api', 'db'],
      ['api', 'blobs'],
    ],
  },
  {
    boxes: [
      { id: 'p1', x: 34, y: 4, w: 58, h: 32, label: 'pod — API · rooms · SurrealDB · blobs' },
      { id: 'p2', x: 34, y: 38, w: 58, h: 28, label: 'pod' },
      { id: 'p3', x: 34, y: 68, w: 58, h: 28, label: 'pod' },
    ],
    pos: {
      players: { x: 6, y: 50 },
      mm: { x: 19, y: 50 },
      api: { x: 46, y: 16 },
      rooms: { x: 67, y: 16 },
      db: { x: 46, y: 27 },
      blobs: { x: 67, y: 27 },
      clone1: { x: 63, y: 52 },
      clone2: { x: 63, y: 82 },
    },
    glow: [],
    links: [
      ['players', 'mm'],
      ['mm', 'api'],
      ['mm', 'clone1'],
      ['mm', 'clone2'],
    ],
  },
  {
    boxes: [
      { id: 'cp', x: 20, y: 10, w: 32, h: 80, label: 'control plane' },
      { id: 'r1', x: 64, y: 14, w: 28, h: 30, label: 'room host' },
      { id: 'r2', x: 64, y: 56, w: 28, h: 30, label: 'room host' },
    ],
    pos: {
      players: { x: 5, y: 50 },
      api: { x: 36, y: 28 },
      db: { x: 36, y: 52 },
      blobs: { x: 36, y: 76 },
      rooms1: { x: 78, y: 29 },
      rooms2: { x: 78, y: 71 },
    },
    glow: ['rooms1', 'rooms2'],
    links: [
      ['players', 'api'],
      ['api', 'rooms1'],
      ['api', 'rooms2'],
      ['api', 'db'],
      ['api', 'blobs'],
    ],
  },
]

function Card({ id, p, glow }) {
  const e = ELEMS[id.replace(/\d+$/, '')] ?? ELEMS[id]
  const visible = Boolean(p) && !p.hidden
  const isGhost = id.startsWith('clone')
  const tint = (ELEM_STYLE_TINT(id) ?? e.tint)
  return (
    <div
      className={`absolute flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg shadow-black/30 transition-all duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)] ${tint} ${
        glow ? 'shadow-[0_0_24px_-2px_rgba(251,191,36,0.45)]' : ''
      }`}
      style={{
        left: `${p?.x ?? 50}%`,
        top: `${p?.y ?? 50}%`,
        transform: 'translate(-50%, -50%)',
        opacity: visible ? (isGhost ? 0.75 : 1) : 0,
        pointerEvents: 'none',
      }}
    >
      {e.icon('h-4 w-4 shrink-0')}
      <span className="whitespace-nowrap font-mono text-[10.5px] font-semibold">{e.label}</span>
    </div>
  )
}

function ELEM_STYLE_TINT(id) {
  if (id === 'clone1' || id === 'clone2') return ELEMS.clone.tint
  return null
}

export default function ScalingVisual() {
  const [stage, setStage] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (paused) return
    timer.current = setInterval(() => setStage((s) => (s + 1) % 3), 4200)
    return () => clearInterval(timer.current)
  }, [paused])

  const cur = STAGES[stage]

  return (
    <div
      className="relative mx-auto w-full max-w-3xl select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* stage pills */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        {STAGE_META.map((m, i) => (
          <button
            key={m.n}
            onClick={() => setStage(i)}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] transition-all ${
              stage === i
                ? 'border-oxide/50 bg-oxide/10 text-oxide'
                : 'border-line text-mute hover:border-zinc-600 hover:text-sub'
            }`}
          >
            {m.n} · {m.name}
          </button>
        ))}
      </div>

      {/* canvas */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line bg-panel">
        {/* caption */}
        <div className="absolute left-1/2 top-3 z-10 w-[92%] -translate-x-1/2 text-center font-mono text-[10.5px] leading-relaxed text-mute transition-opacity duration-500 sm:text-[11.5px]">
          <span className="text-oxide">{STAGE_META[stage].n}</span> — {STAGE_META[stage].caption}
        </div>

        {/* dashed plane boxes */}
        {cur.boxes.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-xl border border-dashed border-oxide/30 transition-all duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
          >
            <span className="absolute -top-2 left-3 bg-panel px-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-oxide/70">
              {b.label}
            </span>
          </div>
        ))}

        {/* links: edge-to-edge, arrowheads show direction, packets show flow */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 56.25" preserveAspectRatio="none">
          <defs>
            <marker id="arr-frost" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#60a5fa" />
            </marker>
            <marker id="arr-oxide" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#4ade80" />
            </marker>
          </defs>
          {cur.links.map(([from, to, label]) => {
            const a = cur.pos[from]
            const b = cur.pos[to]
            if (!a || !b) return null
            const color = from === 'players' || to === 'mm' || from === 'mm' ? '#60a5fa' : '#4ade80'
            // attach to the facing card edges instead of the centers
            const goingRight = b.x >= a.x
            const x1 = goingRight ? a.x + (HALF_W[from] ?? 4) : a.x - (HALF_W[from] ?? 4)
            const x2 = goingRight ? b.x - (HALF_W[to] ?? 4) : b.x + (HALF_W[to] ?? 4)
            const y1 = a.y
            const y2 = b.y
            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2 - 2.5
            return (
              <g key={`${from}-${to}-${stage}`}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color} strokeWidth="0.4" strokeDasharray="1.6 1"
                  vectorEffect="non-scaling-stroke" strokeOpacity="0.8"
                  markerEnd={`url(#${color === '#60a5fa' ? 'arr-frost' : 'arr-oxide'})`}
                />
                <circle r="0.8" fill={color} style={{ filter: `drop-shadow(0 0 2px ${color})` }}>
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={`M ${x1} ${y1} L ${x2} ${y2}`} />
                </circle>
                {label && (
                  <text x={midX} y={midY} fontSize="2.3" fill="#93a1bb" textAnchor="middle" fontFamily="monospace">
                    {label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* element cards — every id the stages can place */}
        {['players', 'mm', 'api', 'rooms', 'rooms1', 'rooms2', 'db', 'blobs', 's3', 'clone1', 'clone2'].map((id) => {
          const p = cur.pos[id]
          return <Card key={id} id={id} p={p} glow={cur.glow.includes(id)} />
        })}
      </div>
    </div>
  )
}
