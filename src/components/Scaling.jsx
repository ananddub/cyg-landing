import Reveal from './Reveal.jsx'
import SectionHead from './SectionHead.jsx'
import ScalingVisual from './ScalingVisual.jsx'

const STAGES = [
  {
    n: '01',
    title: 'One box',
    tag: 'vertical',
    body: (
      <>
        Most games never leave this stage. A $10/mo VPS holds{' '}
        <b className="text-fg">~1.5k–15k CCU per core</b> depending on the backend (measured in a
        strict 1-core / 2 GB cgroup). 100 rooms × 100 players at 128 Hz on 2-core / 2 GB — at 0.76×
        the tick budget, with 93 MB peak RAM.
      </>
    ),
    foot: 'Vertical scale is boring — and boring is good.',
  },
  {
    n: '02',
    title: 'Identical pods',
    tag: 'horizontal',
    body: (
      <>
        Scale out = add pods, nothing else. The <b className="text-fg">same binary</b> runs
        everywhere; the <b className="text-fg">Agones GameServer lifecycle</b> is built in (ready,
        health pings, clean retire). The matchmaker reserves seats and routes players — rooms are
        the unit of scale and land wherever there is capacity. Each pod binds its tenant with{' '}
        <code className="code-inline">game_id</code>.
      </>
    ),
    foot: 'No orchestration service to invent — Kubernetes already knows it.',
  },
  {
    n: '03',
    title: 'Split on config, not code',
    tag: 'separation',
    body: (
      <>
        State moves out with two keys.{' '}
        <code className="code-inline">database_endpoint = &quot;ws://host:8000&quot;</code> — the
        embedded SurrealDB becomes remote and pods go stateless overnight.{' '}
        <code className="code-inline">blobs = &quot;s3:/bucket&quot;</code> — uploads share across
        replicas. The control plane (API + console) and room hosts were separate planes from day
        one, so they scale independently.
      </>
    ),
    foot: 'The artifact never changes — only where it points.',
  },
]

export default function Scaling() {
  return (
    <section id="scaling" className="relative border-t border-line bg-panel/30">
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <SectionHead
          kicker="scaling"
          title={
            <>
              One binary today. <span className="text-grad">A fleet tomorrow.</span>
            </>
          }
          sub="The question everyone asks: if everything is in one process, how does it scale? Vertically first, horizontally by cloning, and when state has to move out — that's a config change, not a rewrite."
        />

        <Reveal className="mb-14">
          <ScalingVisual />
        </Reveal>

        <div className="relative grid gap-5 lg:grid-cols-3">
          {/* connector line (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden border-t border-dashed border-oxide/25 lg:block" aria-hidden="true" />

          {STAGES.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="group relative h-full rounded-2xl border border-line bg-panel p-7 transition-colors duration-300 hover:border-oxide/40">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-oxide/40 bg-oxide/10 font-display text-[13px] font-bold text-oxide">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-display text-[17px] font-semibold text-fg">{s.title}</h3>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">{s.tag}</div>
                  </div>
                </div>
                <p className="text-[13.5px] leading-relaxed text-sub">{s.body}</p>
                <p className="mt-5 border-t border-line pt-4 font-mono text-[11.5px] leading-relaxed text-oxide/80">
                  → {s.foot}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-10 max-w-3xl text-center text-[13.5px] leading-relaxed text-mute">
            The answer to &ldquo;how do you split it&rdquo; is: you don&rsquo;t — you clone it,
            point state outward, and keep the same artifact everywhere.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
