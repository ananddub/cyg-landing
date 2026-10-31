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

const STAGE_META = [
  { n: '01', name: 'One box', caption: 'One $10/mo VPS — API, rooms, database, uploads: all inside one process.' },
  { n: '02', name: 'Identical pods', caption: 'Clone the same binary — the matchmaker seats players across pods.' },
  { n: '03', name: 'Split on config', caption: 'Two keys: database_endpoint → ws://host:8000 · blobs → s3:/bucket.' },
]

const STAGES = [
  {
    boxes: [{ id: 'pod', x: 34, y: 14, w: 58, h: 72, label: 'one binary' }],
    pos: {
      players: { x: 8, y: 50 },
      api: { x: 50, y: 33 },
      rooms: { x: 76, y: 33 },
      db: { x: 50, y: 67 },
      blobs: { x: 76, y: 67 },
    },
    glow: [],
    links: [
      ['players', 'api'],
      ['players', 'rooms'],
    ],
  },
  {
    boxes: [
      { id: 'p1', x: 36, y: 6, w: 56, h: 27, label: 'pod' },
      { id: 'p2', x: 36, y: 37, w: 56, h: 27, label: 'pod' },
      { id: 'p3', x: 36, y: 68, w: 56, h: 27, label: 'pod' },
    ],
    pos: {
      players: { x: 6, y: 50 },
      mm: { x: 20, y: 50 },
      api: { x: 52, y: 19 },
      rooms: { x: 74, y: 19 },
      clone1: { x: 52, y: 50, hidden: true },
      clone2: { x: 52, y: 81, hidden: true },
      db: { x: 74, y: 81 },
      blobs: { x: 74, y: 50 },
      p2a: { x: 64, y: 50, hidden: true },
      p3a: { x: 64, y: 81, hidden: true },
    },
    glow: [],
    links: [
      ['players', 'mm'],
      ['mm', 'api'],
      ['mm', 'p2a'],
      ['mm', 'p3a'],
    ],
  },
  {
    boxes: [
      { id: 'cp', x: 20, y: 8, w: 34, h: 32, label: 'control plane' },
      { id: 'r1', x: 20, y: 46, w: 34, h: 22, label: 'room host' },
      { id: 'r2', x: 20, y: 72, w: 34, h: 22, label: 'room host' },
    ],
    pos: {
      players: { x: 5, y: 50 },
      mm: { x: 12, y: 24 },
      api: { x: 37, y: 24 },
      rooms: { x: 37, y: 57 },
      db: { x: 78, y: 26 },
      s3: { x: 78, y: 62 },
    },
    glow: ['db', 's3'],
    links: [
      ['players', 'mm'],
      ['mm', 'api'],
      ['api', 'db', 'ws://host:8000'],
      ['rooms', 'db'],
      ['rooms', 's3', 's3:/bucket'],
    ],
  },
]

function Card({ id, p, glow }) {
  const e = ELEMS[id.replace(/[12]$/, '')] ?? ELEMS[id]
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

        {/* links with traveling packets */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 56.25" preserveAspectRatio="none">
          {cur.links.map(([from, to, label]) => {
            const a = cur.pos[from]
            const b = cur.pos[to]
            if (!a || !b) return null
            const color = from === 'players' || to === 'mm' || from === 'mm' ? '#60a5fa' : '#4ade80'
            const midX = (a.x + b.x) / 2
            const midY = (a.y + b.y) / 2 - 2.5
            return (
              <g key={`${from}-${to}-${stage}`}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={color} strokeWidth="0.35" strokeDasharray="1.4 1"
                  vectorEffect="non-scaling-stroke" strokeOpacity="0.7"
                />
                <circle r="0.8" fill={color} style={{ filter: `drop-shadow(0 0 2px ${color})` }}>
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} />
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

        {/* element cards */}
        {Object.keys(ELEMS).map((id) => {
          const p = cur.pos[id]
          return <Card key={id} id={id} p={p} glow={cur.glow.includes(id)} />
        })}
        {/* clone ghost cards (stage 2) */}
        {['clone1', 'clone2'].map((id) => {
          const p = cur.pos[id]
          return <Card key={id} id={id} p={p} glow={false} />
        })}
      </div>
    </div>
  )
}
