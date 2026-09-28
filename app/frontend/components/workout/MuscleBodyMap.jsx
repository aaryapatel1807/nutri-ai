'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useIsMobile from '../../lib/useIsMobile'

const MUSCLES = {
  chest: {
    name: 'Chest', sub: 'Pectoralis major / minor',
    axis: 'Transverse axis', plane: 'Horizontal push',
    movement: 'Arms drive across the body — pushing movements on the transverse plane.',
    exercises: ['Push-ups', 'Barbell bench press', 'Incline dumbbell press', 'Cable chest fly'],
    cue: 'Squeeze the chest at full extension; keep shoulder blades pinned back.',
    views: ['front'],
  },
  back: {
    name: 'Back', sub: 'Latissimus dorsi / rhomboids',
    axis: 'Frontal axis', plane: 'Vertical pull',
    movement: 'Arms pull down and back — vertical pulling and rowing on the frontal plane.',
    exercises: ['Pull-ups', 'Lat pulldown', 'Bent-over row', 'Seated cable row'],
    cue: 'Initiate every rep by driving the elbows down, not pulling with the hands.',
    views: ['back'],
  },
  shoulders: {
    name: 'Shoulders', sub: 'Deltoids (front / side / rear)',
    axis: 'Sagittal + frontal axes', plane: 'Overhead press',
    movement: 'Arms raise overhead and out to the sides across two axes.',
    exercises: ['Overhead press', 'Lateral raises', 'Arnold press', 'Rear-delt fly'],
    cue: 'Press in a slight arc, not straight up; control the lowering phase.',
    views: ['front', 'back'],
  },
  biceps: {
    name: 'Biceps', sub: 'Biceps brachii',
    axis: 'Sagittal axis', plane: 'Elbow flexion',
    movement: 'Forearm curls toward the shoulder — pure sagittal-plane hinge.',
    exercises: ['Barbell curl', 'Hammer curl', 'Incline dumbbell curl', 'Chin-ups'],
    cue: 'Lock the elbows at your sides; no swinging the torso.',
    views: ['front'],
  },
  triceps: {
    name: 'Triceps', sub: 'Triceps brachii',
    axis: 'Sagittal axis', plane: 'Elbow extension',
    movement: 'Forearm pushes away from the body — sagittal-plane pressing.',
    exercises: ['Dips', 'Overhead extension', 'Rope pushdown', 'Close-grip bench'],
    cue: 'Full lockout at the bottom of every rep; keep elbows tucked.',
    views: ['back'],
  },
  abs: {
    name: 'Core', sub: 'Rectus abdominis / obliques',
    axis: 'Sagittal + transverse axes', plane: 'Trunk flexion & rotation',
    movement: 'Torso flexes, extends and rotates — the stabiliser for every lift.',
    exercises: ['Hanging leg raises', 'Cable crunch', 'Russian twists', 'Plank'],
    cue: 'Brace like taking a punch; move slowly and exhale on contraction.',
    views: ['front'],
  },
  lowerback: {
    name: 'Lower Back', sub: 'Erector spinae',
    axis: 'Sagittal axis', plane: 'Hip hinge',
    movement: 'Torso hinges at the hips — the posterior-chain anchor.',
    exercises: ['Deadlift', 'Hyperextensions', 'Good mornings', 'Superman hold'],
    cue: 'Keep a neutral spine; hinge from the hips, never round the back.',
    views: ['back'],
  },
  traps: {
    name: 'Traps', sub: 'Trapezius',
    axis: 'Vertical axis', plane: 'Scapular elevation',
    movement: 'Shoulders shrug and shoulder blades retract upward.',
    exercises: ['Barbell shrugs', 'Farmer’s carry', 'Face pulls', 'Upright row'],
    cue: 'Pause one second at the top of every shrug.',
    views: ['back'],
  },
  glutes: {
    name: 'Glutes', sub: 'Gluteus maximus / medius',
    axis: 'Sagittal axis', plane: 'Hip extension',
    movement: 'Hips drive forward — the engine of squats, hinges and sprints.',
    exercises: ['Hip thrust', 'Back squat', 'Romanian deadlift', 'Bulgarian split squat'],
    cue: 'Squeeze hard at lockout; knees track over toes.',
    views: ['back'],
  },
  quads: {
    name: 'Quads', sub: 'Quadriceps',
    axis: 'Sagittal axis', plane: 'Knee extension',
    movement: 'Knee straightens under load — squat and lunge patterns.',
    exercises: ['Back squat', 'Leg press', 'Walking lunges', 'Leg extension'],
    cue: 'Drive through the mid-foot; hit full depth with a braced core.',
    views: ['front'],
  },
  hamstrings: {
    name: 'Hamstrings', sub: 'Biceps femoris / semitendinosus',
    axis: 'Sagittal axis', plane: 'Hip extension + knee flexion',
    movement: 'Hips extend and knees flex — sprinting and hinging power.',
    exercises: ['Romanian deadlift', 'Lying leg curl', 'Nordic curl', 'Glute-ham raise'],
    cue: 'Feel the stretch at the bottom of every hinge rep.',
    views: ['back'],
  },
  calves: {
    name: 'Calves', sub: 'Gastrocnemius / soleus',
    axis: 'Sagittal axis', plane: 'Plantar flexion',
    movement: 'Heel rises off the ground — ankle drive on the sagittal axis.',
    exercises: ['Standing calf raise', 'Seated calf raise', 'Donkey calf raise', 'Jump rope'],
    cue: 'Pause at the top; stretch deep at the bottom.',
    views: ['front', 'back'],
  },
}

function Muscle({ id, shape, active, onEnter, onLeave, onSelect }) {
  const common = {
    onMouseEnter: () => onEnter(id),
    onMouseLeave: onLeave,
    onClick: () => onSelect(id),
    style: { cursor: 'pointer', transition: 'all 0.2s' },
  }
  const fill = active ? '#F97316' : 'rgba(249,115,22,0.28)'
  const stroke = active ? '#EA580C' : '#F97316'
  const extra = active
    ? { filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.8))' }
    : {}
  if (shape.type === 'ellipse')
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1.2} style={{ ...common.style, ...extra }} {...common} />
  if (shape.type === 'circle')
    return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1.2} style={{ ...common.style, ...extra }} {...common} />
  return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx || 8} fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1.2} style={{ ...common.style, ...extra }} {...common} />
}

// Shared limb silhouettes (flat mannequin style)
function Silhouette() {
  const limb = 'var(--track)'
  const edge = 'var(--border)'
  return (
    <g stroke={edge} strokeWidth={1.5}>
      {/* head + neck */}
      <ellipse cx={110} cy={30} rx={17} ry={20} fill={limb} />
      <rect x={101} y={47} width={18} height={15} rx={6} fill={limb} />
      {/* torso */}
      <path d="M68 66 Q110 56 152 66 L146 130 Q143 175 140 216 L80 216 Q77 175 74 130 Z" fill={limb} />
      {/* arms */}
      <rect x={49} y={68} width={17} height={158} rx={8.5} fill={limb} transform="rotate(4 57 68)" />
      <rect x={154} y={68} width={17} height={158} rx={8.5} fill={limb} transform="rotate(-4 162 68)" />
      {/* hands */}
      <circle cx={56} cy={232} r={8} fill={limb} />
      <circle cx={164} cy={232} r={8} fill={limb} />
      {/* legs */}
      <rect x={81} y={218} width={23} height={112} rx={11} fill={limb} />
      <rect x={116} y={218} width={23} height={112} rx={11} fill={limb} />
      <rect x={83} y={330} width={19} height={66} rx={9.5} fill={limb} />
      <rect x={118} y={330} width={19} height={66} rx={9.5} fill={limb} />
      {/* feet */}
      <ellipse cx={93} cy={402} rx={12} ry={6} fill={limb} />
      <ellipse cx={127} cy={402} rx={12} ry={6} fill={limb} />
    </g>
  )
}

const FRONT_SHAPES = [
  { id: 'chest', shape: { type: 'ellipse', cx: 92, cy: 102, rx: 16, ry: 14 } },
  { id: 'chest', shape: { type: 'ellipse', cx: 128, cy: 102, rx: 16, ry: 14 } },
  { id: 'shoulders', shape: { type: 'circle', cx: 57, cy: 76, r: 11 } },
  { id: 'shoulders', shape: { type: 'circle', cx: 163, cy: 76, r: 11 } },
  { id: 'biceps', shape: { type: 'ellipse', cx: 57, cy: 118, rx: 9, ry: 18 } },
  { id: 'biceps', shape: { type: 'ellipse', cx: 163, cy: 118, rx: 9, ry: 18 } },
  { id: 'abs', shape: { type: 'rect', x: 96, y: 120, w: 28, h: 56, rx: 10 } },
  { id: 'quads', shape: { type: 'ellipse', cx: 92, cy: 268, rx: 13, ry: 30 } },
  { id: 'quads', shape: { type: 'ellipse', cx: 128, cy: 268, rx: 13, ry: 30 } },
  { id: 'calves', shape: { type: 'ellipse', cx: 92, cy: 360, rx: 9, ry: 22 } },
  { id: 'calves', shape: { type: 'ellipse', cx: 128, cy: 360, rx: 9, ry: 22 } },
]

const BACK_SHAPES = [
  { id: 'traps', shape: { type: 'ellipse', cx: 110, cy: 74, rx: 26, ry: 11 } },
  { id: 'shoulders', shape: { type: 'circle', cx: 57, cy: 76, r: 11 } },
  { id: 'shoulders', shape: { type: 'circle', cx: 163, cy: 76, r: 11 } },
  { id: 'back', shape: { type: 'ellipse', cx: 88, cy: 126, rx: 14, ry: 26 } },
  { id: 'back', shape: { type: 'ellipse', cx: 132, cy: 126, rx: 14, ry: 26 } },
  { id: 'triceps', shape: { type: 'ellipse', cx: 57, cy: 118, rx: 9, ry: 18 } },
  { id: 'triceps', shape: { type: 'ellipse', cx: 163, cy: 118, rx: 9, ry: 18 } },
  { id: 'lowerback', shape: { type: 'rect', x: 98, y: 156, w: 24, h: 34, rx: 8 } },
  { id: 'glutes', shape: { type: 'ellipse', cx: 95, cy: 236, rx: 15, ry: 18 } },
  { id: 'glutes', shape: { type: 'ellipse', cx: 125, cy: 236, rx: 15, ry: 18 } },
  { id: 'hamstrings', shape: { type: 'ellipse', cx: 92, cy: 288, rx: 12, ry: 28 } },
  { id: 'hamstrings', shape: { type: 'ellipse', cx: 128, cy: 288, rx: 12, ry: 28 } },
  { id: 'calves', shape: { type: 'ellipse', cx: 92, cy: 360, rx: 9, ry: 22 } },
  { id: 'calves', shape: { type: 'ellipse', cx: 128, cy: 360, rx: 9, ry: 22 } },
]

export default function MuscleBodyMap() {
  const isMobile = useIsMobile()
  const [view, setView] = useState('front')
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState('chest')
  const activeId = hovered || selected
  const active = MUSCLES[activeId] || MUSCLES[selected]
  const shapes = view === 'front' ? FRONT_SHAPES : BACK_SHAPES

  const pick = (id) => {
    // tapping a back-only muscle while on front view flips the view
    if (!MUSCLES[id].views.includes(view)) setView(MUSCLES[id].views[0])
    setSelected(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', alignItems: isMobile ? 'center' : 'flex-start' }}>
      {/* Figure */}
      <div className="glass" style={{ padding: '20px 16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', background: 'var(--track)', borderRadius: '99px', padding: '4px' }}>
          {['front', 'back'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                border: 'none', cursor: 'pointer', borderRadius: '99px', padding: '6px 18px',
                fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize',
                background: view === v ? 'linear-gradient(135deg,#FB923C,#F97316)' : 'transparent',
                color: view === v ? '#fff' : 'var(--text-muted)',
                boxShadow: view === v ? '0 2px 10px rgba(249,115,22,0.4)' : 'none',
              }}>
              {v}
            </button>
          ))}
        </div>
        <svg viewBox="0 0 220 420" style={{ width: isMobile ? '210px' : '240px', height: 'auto', touchAction: 'manipulation' }}>
          <Silhouette />
          {shapes.map((s, i) => (
            <Muscle key={`${view}-${i}`} id={s.id} shape={s.shape}
              active={activeId === s.id}
              onEnter={setHovered} onLeave={() => setHovered(null)} onSelect={pick} />
          ))}
        </svg>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {isMobile ? 'Tap a muscle' : 'Hover a muscle'}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div key={active.name}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h3 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {active.name}
              </h3>
              <span className="chip chip-orange" style={{ fontSize: '0.7rem' }}>{active.axis}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>{active.sub}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-faint)', lineHeight: 1.6, marginBottom: '16px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{active.plane} — </strong>{active.movement}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Best exercises
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {active.exercises.map(e => (
                <span key={e} className="chip chip-green" style={{ fontSize: '0.8rem' }}>{e}</span>
              ))}
            </div>
            <div style={{
              background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.22)',
              borderRadius: '14px', padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-faint)', lineHeight: 1.55,
            }}>
              <strong style={{ color: '#EA580C' }}>💡 Form cue — </strong>{active.cue}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quick muscle chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
          {Object.entries(MUSCLES).map(([id, m]) => (
            <button key={id} onClick={() => pick(id)}
              className={`chip ${activeId === id ? 'chip-orange' : 'chip-muted'}`}
              style={{ cursor: 'pointer', fontSize: '0.78rem', border: activeId === id ? '1px solid rgba(249,115,22,0.4)' : undefined }}>
              {m.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
