import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import { siSurrealdb } from 'simple-icons'
import { Users, Route, MonitorSmartphone, Cpu, Package, Database, Binary } from 'lucide-react'

/* Scaling story as a real flow diagram (React Flow): bezier edges attach to
   node handles, arrowheads + animated flow show direction — players → API
   console → rooms/SurrealDB/blobs; rooms scale out in stage 3. */

const si = (icon, cls) => (
  <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
    <path d={icon.path} />
  </svg>
)

const TINT = {
  frost: 'text-frost border-frost/60 bg-[#0d1420]',
  oxide: 'text-oxide border-oxide/60 bg-[#0c1710]',
  ember: 'text-ember border-ember/60 bg-[#171208]',
  zinc: 'text-sub border-line bg-panel-2',
  ghost: 'text-mute border-line/70 border-dashed bg-panel-2/50',
}

const ICONS = {
  players: (c) => <Users className={c} />,
  mm: (c) => <Route className={c} />,
  api: (c) => <MonitorSmartphone className={c} />,
  rooms: (c) => <Cpu className={c} />,
  db: (c) => si(siSurrealdb, c),
  blobs: (c) => <Package className={c} />,
  s3: (c) => <Database className={c} />,
  clone: (c) => <Binary className={c} />,
}

const CARD_H = 44
const cardW = (label) => Math.max(112, 34 + label.length * 7.4)

/**
 * dagre compound layout — computes every card and plane position from the
 * graph structure alone (ranks, nesting, spacing). Alignment is guaranteed
 * by the engine, not by hand-placed coordinates.
 */
function layoutGraph(rawNodes, rawEdges) {
  const g = new dagre.graphlib.Graph({ compound: true })
  g.setGraph({ rankdir: 'LR', nodesep: 26, ranksep: 46, marginx: 18, marginy: 18, edgesep: 16 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const n of rawNodes) {
    if (n.type === 'plane') {
      g.setNode(n.id, { width: 60, height: 60 }) // grows to fit children
    } else {
      g.setNode(n.id, { width: cardW(n.data.label), height: CARD_H })
    }
    if (n.parentId) g.setParent(n.id, n.parentId)
  }
  for (const e of rawEdges) g.setEdge(e.source, e.target)

  dagre.layout(g)

  return rawNodes.map((n) => {
    const gn = g.node(n.id)
    if (n.type === 'plane') {
      return {
        ...n,
        position: { x: gn.x - gn.width / 2, y: gn.y - gn.height / 2 },
        style: { width: gn.width, height: gn.height },
      }
    }
    const w = cardW(n.data.label)
    let pos = { x: gn.x - w / 2, y: gn.y - CARD_H / 2 }
    if (n.parentId) {
      const gp = g.node(n.parentId)
      pos = {
        x: pos.x - (gp.x - gp.width / 2),
        y: pos.y - (gp.y - gp.height / 2),
      }
    }
    return { ...n, position: pos }
  })
}

function SysNode({ data }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg shadow-black/30 ${TINT[data.tint]} ${
        data.glow ? 'shadow-[0_0_26px_-2px_rgba(251,191,36,0.5)]' : ''
      }`}
    >
      {ICONS[data.icon]?.('h-4 w-4 shrink-0')}
      <span className="whitespace-nowrap font-mono text-[10.5px] font-semibold">{data.label}</span>
      <Handle type="target" position={Position.Left} className="!h-0 !w-0 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Right} className="!h-0 !w-0 !border-0 !opacity-0" />
    </div>
  )
}

function GroupNode({ data }) {
  return (
    <div className="h-full w-full rounded-xl border border-dashed border-oxide/35">
      <span className="absolute -top-2 left-3 bg-panel px-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-oxide/70">
        {data.label}
      </span>
    </div>
  )
}

const nodeTypes = { sys: SysNode, plane: GroupNode }

const sys = (id, x, y, label, tint, opts = {}) => ({
  id,
  type: 'sys',
  position: { x, y },
  data: { label, tint, icon: id.replace(/[\dA-Z]+$/, ''), glow: opts.glow ?? false, ...(opts.data ?? {}) },
  draggable: false,
  ...(opts.parentId ? { parentId: opts.parentId, extent: 'parent' } : {}),
})

const plane = (id, x, y, w, h, label) => ({
  id,
  type: 'plane',
  position: { x, y },
  data: { label },
  style: { width: w, height: h },
  draggable: false,
  selectable: false,
})

const edge = (source, target, color) => ({
  id: `e-${source}-${target}`,
  source,
  target,
  animated: true,
  style: { stroke: color, strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
})

const FROST = '#60a5fa'
const OXIDE = '#4ade80'

/* ── stage definitions ─────────────────────────────────────────── */

const STAGE_META = [
  { n: '01', name: 'One box', caption: 'players → API console → room A · room B (separate threads) · SurrealDB · blobs — all inside one process.' },
  { n: '02', name: 'Rooms scale out', caption: 'room A and room B split into their own hosts — SurrealDB out via ws://host:8000, blobs → s3:/bucket.' },
]

/** raw graph per stage — positions come from dagre, never from us */
function stageNodes(stage) {
  let raw
  if (stage === 0) {
    raw = [
      { ...plane('pod', 0, 0, 0, 0, 'one binary') },
      { ...sys('players', 0, 0, 'players', 'zinc') },
      { ...sys('api', 0, 0, 'API + console', 'frost', { parentId: 'pod' }) },
      { ...sys('roomsA', 0, 0, 'room A · sim', 'oxide', { parentId: 'pod' }) },
      { ...sys('roomsB', 0, 0, 'room B · sim', 'oxide', { parentId: 'pod' }) },
      { ...sys('db', 0, 0, 'SurrealDB', 'ember', { parentId: 'pod' }) },
      { ...sys('blobs', 0, 0, 'blobs · local', 'zinc', { parentId: 'pod' }) },
    ]
  } else {
    raw = [
      // shared ids with stage 1 → these MORPH, they don't re-appear:
      // pod → control plane, rooms → first room host, blobs → S3 bucket
      { ...plane('pod', 0, 0, 0, 0, 'control plane') },
      { ...plane('r1', 0, 0, 0, 0, 'room host') },
      { ...plane('r2', 0, 0, 0, 0, 'room host') },
      { ...sys('players', 0, 0, 'players', 'zinc') },
      { ...sys('api', 0, 0, 'API + console', 'frost', { parentId: 'pod' }) },
      { ...sys('roomsA', 0, 0, 'room A · sim', 'oxide', { parentId: 'r1', glow: true }) },
      { ...sys('roomsB', 0, 0, 'room B · sim', 'oxide', { parentId: 'r2', glow: true }) },
      { ...sys('db', 0, 0, 'SurrealDB', 'ember', { glow: true }) },
      { ...sys('blobs', 0, 0, 'S3 bucket', 'zinc', { glow: true, data: { icon: 's3' } }) },
    ]
  }
  return layoutGraph(raw, stageEdges(stage))
}

function stageEdges(stage) {
  if (stage === 0) {
    return [
      edge('players', 'api', FROST),
      edge('api', 'roomsA', OXIDE),
      edge('api', 'roomsB', OXIDE),
      edge('api', 'db', OXIDE),
      edge('api', 'blobs', OXIDE),
    ]
  }
  return [
    edge('players', 'api', FROST),
    edge('api', 'roomsA', OXIDE),
    edge('api', 'roomsB', OXIDE),
    edge('api', 'db', OXIDE),
    edge('api', 'blobs', OXIDE),
  ]
}

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Tween every node from its current position/size to the target layout.
 * Shared ids fly; new ids fade in at their target; removed ids fade out.
 * Edges follow automatically (they bind to node handles, not coordinates).
 */
function tweenNodes(fromNodes, toNodes, duration, onFrame, onDone) {
  const startMap = new Map(fromNodes.map((n) => [n.id, n]))
  const toMap = new Map(toNodes.map((n) => [n.id, n]))
  const t0 = performance.now()

  function frame(now) {
    const t = Math.min(1, (now - t0) / duration)
    const k = easeInOutCubic(t)

    const current = toNodes.map((tn) => {
      const fn = startMap.get(tn.id)
      if (!fn) {
        // brand-new elements appear quickly at the start, not throughout
        return { ...tn, style: { ...(tn.style ?? {}), opacity: Math.min(1, k * 4) } }
      }
      const style = { ...(tn.style ?? {}), opacity: 1 }
      if (fn.style?.width != null && tn.style?.width != null) {
        style.width = fn.style.width + (tn.style.width - fn.style.width) * k
        style.height = fn.style.height + (tn.style.height - fn.style.height) * k
      }
      return {
        ...tn,
        position: {
          x: fn.position.x + (tn.position.x - fn.position.x) * k,
          y: fn.position.y + (tn.position.y - fn.position.y) * k,
        },
        style,
      }
    })

    // elements leaving the graph stay until the movers land, then vanish fast
    for (const fn of fromNodes) {
      if (!toMap.has(fn.id)) {
        const fade = Math.max(0, Math.min(1, (k - 0.7) / 0.3))
        current.push({ ...fn, style: { ...(fn.style ?? {}), opacity: 1 - fade } })
      }
    }

    onFrame(current)
    if (t < 1) requestAnimationFrame(frame)
    else onDone?.()
  }
  requestAnimationFrame(frame)
}

export default function ScalingVisual() {
  const [stage, setStage] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)
  const animRef = useRef(false)
  const rfRef = useRef(null)

  const [nodes, setNodes] = useState(() => stageNodes(0))
  const edges = useMemo(() => stageEdges(stage), [stage])

  // animate the graph whenever the stage changes — no remount, nodes fly
  useEffect(() => {
    animRef.current = true
    setNodes((current) => {
      tweenNodes(
        current,
        stageNodes(stage),
        950,
        (frame) => setNodes(frame),
        () => {
          animRef.current = false
          rfRef.current?.fitView({ padding: 0.18, duration: 450 })
        },
      )
      return current
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  useEffect(() => {
    if (paused) return
    timer.current = setInterval(() => setStage((s) => (s + 1) % 2), 5200)
    return () => clearInterval(timer.current)
  }, [paused])

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

      {/* caption */}
      <p className="mx-auto mb-3 max-w-2xl text-center font-mono text-[10.5px] leading-relaxed text-mute sm:text-[11.5px]">
        <span className="text-oxide">{STAGE_META[stage].n}</span> — {STAGE_META[stage].caption}
      </p>

      {/* the flow diagram */}
      <div className="h-[440px] w-full overflow-hidden rounded-2xl border border-line bg-panel">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={(instance) => {
            rfRef.current = instance
          }}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.4}
          maxZoom={1.4}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          panOnScroll={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: false }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1e2430" />
        </ReactFlow>
      </div>
    </div>
  )
}
