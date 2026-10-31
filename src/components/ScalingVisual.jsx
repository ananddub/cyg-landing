import { useEffect, useRef, useState } from 'react'

/* Animated scaling story: one box → identical pods → split on config.
   DOM chips + SVG links, positions interpolated by CSS transitions. */

const COLORS = {
  oxide: { border: 'border-oxide/60', bg: 'bg-oxide/10', text: 'text-oxide' },
  frost: { border: 'border-frost/60', bg: 'bg-frost/10', text: 'text-frost' },
  ember: { border: 'border-ember/60', bg: 'bg-ember/10', text: 'text-ember' },
  zinc: { border: 'border-line', bg: 'bg-panel-2', text: 'text-sub' },
}

const STAGE_META = [
  { n: '01', name: 'One box', note: 'everything embedded' },
  { n: '02', name: 'Identical pods', note: 'clone the binary' },
  { n: '03', name: 'Split on config', note: 'state moves out' },
]

/* boxes = dashed container outlines; pos = chip centers in % (x, y); links = [from, to, label?] */
const STAGES = [
  {
    boxes: [{ id: 'pod', x: 34, y: 16, w: 50, h: 68, label: 'one binary' }],
    pos: {
      players: { x: 8, y: 50 },
      api: { x: 48, y: 34 },
      rooms: { x: 70, y: 34 },
      db: { x: 48, y: 66 },
      blobs: { x: 70, y: 66 },
    },
    links: [
      ['players', 'api'],
      ['players', 'rooms'],
    ],
  },
  {
    boxes: [
      { id: 'p1', x: 42, y: 6, w: 44, h: 26, label: 'pod' },
      { id: 'p2', x: 42, y: 38, w: 44, h: 26, label: 'pod' },
      { id: 'p3', x: 42, y: 70, w: 44, h: 26, label: 'pod' },
    ],
    pos: {
      players: { x: 6, y: 50 },
      mm: { x: 22, y: 50 },
      api: { x: 56, y: 19 },
      rooms: { x: 72, y: 19 },
      db: { x: 56, y: 83 },
      blobs: { x: 72, y: 83 },
    },
    links: [
      ['players', 'mm'],
      ['mm', 'api'],
      ['mm', 'rooms'],
      ['mm', 'db'],
    ],
  },
  {
    boxes: [
      { id: 'apiPod', x: 24, y: 8, w: 38, h: 30, label: 'control plane' },
      { id: 'r1', x: 24, y: 46, w: 38, h: 22, label: 'room host' },
      { id: 'r2', x: 24, y: 72, w: 38, h: 22, label: 'room host' },
    ],
    pos: {
      players: { x: 6, y: 50 },
      mm: { x: 18, y: 23 },
      api: { x: 43, y: 23 },
      rooms: { x: 43, y: 57 },
      db: { x: 84, y: 30 },
      s3: { x: 84, y: 66 },
    },
    links: [
      ['players', 'mm'],
      ['mm', 'api'],
      ['api', 'db', 'ws://host:8000'],
      ['rooms', 'db'],
      ['rooms', 's3', 's3:/bucket'],
    ],
  },
]

const ELEM_STYLE = {
  players: { color: 'zinc', label: 'players', shape: 'circle' },
  mm: { color: 'frost', label: 'matchmaker', shape: 'chip' },
  api: { color: 'frost', label: 'API + console', shape: 'chip' },
  rooms: { color: 'oxide', label: 'rooms (sim)', shape: 'chip' },
  db: { color: 'ember', label: 'SurrealDB', shape: 'db' },
  blobs: { color: 'zinc', label: 'blobs · local', shape: 'chip' },
  s3: { color: 'zinc', label: 'S3 bucket', shape: 'db' },
}

export default function ScalingVisual() {
  const [stage, setStage] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (paused) return
    timer.current = setInterval(() => setStage((s) => (s + 1) % 3), 3600)
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
      <div className="mb-4 flex items-center justify-center gap-2">
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
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl border border-line bg-panel">
        {/* dashed container boxes */}
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

        {/* links */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          {cur.links.map(([from, to, label]) => {
            const a = cur.pos[from]
            const b = cur.pos[to]
            if (!a || !b) return null
            const color = from === 'players' || to === 'mm' ? '#60a5fa' : '#4ade80'
            const midX = (a.x + b.x) / 2
            const midY = (a.y + b.y) / 2 - 2.5
            return (
              <g key={`${from}-${to}-${stage}`}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={color} strokeWidth="0.35" strokeDasharray="1.4 1"
                  vectorEffect="non-scaling-stroke" strokeOpacity="0.7"
                />
                <circle r="0.7" fill={color}>
                  <animateMotion dur="1.6s" repeatCount="indefinite" path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} />
                </circle>
                {label && (
                  <text x={midX} y={midY} fontSize="2.2" fill="#93a1bb" textAnchor="middle" fontFamily="monospace">
                    {label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* chips */}
        {Object.entries(ELEM_STYLE).map(([id, meta]) => {
          const p = cur.pos[id]
          const c = COLORS[meta.color]
          const visible = Boolean(p)
          return (
            <div
              key={id}
              className={`absolute flex items-center justify-center rounded-lg border text-center font-mono text-[10px] font-semibold transition-all duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)] ${c.border} ${c.bg} ${c.text} ${
                meta.shape === 'circle' ? 'h-12 w-12 rounded-full' : 'h-9 px-3'
              }`}
              style={{
                left: visible ? `${p.x}%` : '50%',
                top: visible ? `${p.y}%` : '50%',
                transform: 'translate(-50%, -50%)',
                opacity: visible ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              {meta.label}
            </div>
          )
        })}

        {/* stage note */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-ink/80 px-3.5 py-1 font-mono text-[10.5px] text-mute backdrop-blur">
          {STAGE_META[stage].n} — {STAGE_META[stage].note}
        </div>
      </div>
    </div>
  )
}
