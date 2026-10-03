'use client'

import { useState } from 'react'
import EditorialFigure from './EditorialFigure'
import EditorialExercisePanel from './EditorialExercisePanel'
import { EDITORIAL_MUSCLES } from './editorialMuscleData'

// EditorialMuscleExplorer — the MuscleWiki-style body explorer in the
// approved Editorial art direction: ink-sketch figure, watercolor wash,
// serif exercise panel. Click a muscle → its exercises appear.
export default function EditorialMuscleExplorer({ onStartWorkout }) {
  const [muscleId, setMuscleId] = useState('shoulders')
  const [zoomed, setZoomed] = useState(false)
  const [view, setView] = useState('front')
  const [gender, setGender] = useState('female')

  const muscle = EDITORIAL_MUSCLES[muscleId]

  const selectMuscle = (id) => {
    if (id === muscleId) {
      setZoomed((z) => !z) // tap again to zoom back out
      return
    }
    setMuscleId(id)
    setZoomed(true)
    const views = EDITORIAL_MUSCLES[id].views
    if (!views.includes(view)) setView(views[0])
  }

  const addToWorkout = () => {
    if (!onStartWorkout) return
    onStartWorkout({
      id: `ed-${muscleId}-${Date.now()}`,
      name: `${muscle.name} Focus`,
      emoji: '🎯',
      duration: 40,
      calories: 260,
      difficulty: 'Intermediate',
      category: 'Strength',
      equipment: 'Mixed',
      color: '#E8735F',
      glow: 'rgba(232,115,95,0.3)',
      muscles: [muscle.name],
      description: `A targeted ${muscle.name.toLowerCase()} session from the muscle map`,
      exercises: muscle.exercises.map((e) => ({
        name: e.name, sets: e.sets, reps: String(e.reps), rest: 60,
        muscle: muscle.name, emoji: '💪', tip: '', calories: 25,
      })),
    })
  }

  const seg = (options, value, onChange) => (
    <div className="ed-seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value} role="tab" aria-selected={value === o.value}
          className={`ed-segbtn${value === o.value ? ' on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="ed-wrap">
      <style>{`
        .ed-wrap{
          --ed-ink:#3A322B; --ed-muted:#8A7B6C; --ed-coral:#E8735F;
          --ed-panel:rgba(255,255,255,0.55); --ed-hair:rgba(58,50,43,0.12);
          --ed-seg:rgba(58,50,43,0.06);
          background:
            radial-gradient(1200px 600px at 20% 0%, rgba(232,115,95,0.10), transparent 60%),
            radial-gradient(900px 700px at 90% 100%, rgba(255,190,150,0.16), transparent 60%),
            linear-gradient(160deg, #FBF6EE 0%, #F6EDE2 55%, #F3E7D8 100%);
          border:1px solid rgba(58,50,43,0.10);
          border-radius:28px; padding:clamp(18px,3vw,36px);
          position:relative; overflow:hidden;
        }
        [data-theme="dark"] .ed-wrap{
          --ed-ink:#EDE3D3; --ed-muted:#A89880; --ed-coral:#FF7A63;
          --ed-panel:rgba(28,22,17,0.55); --ed-hair:rgba(237,227,211,0.14);
          --ed-seg:rgba(237,227,211,0.07);
          background:
            radial-gradient(1200px 600px at 20% 0%, rgba(255,122,99,0.10), transparent 60%),
            radial-gradient(900px 700px at 90% 100%, rgba(255,122,99,0.07), transparent 60%),
            linear-gradient(160deg, #1C1712 0%, #181310 55%, #14100C 100%);
          border:1px solid rgba(237,227,211,0.10);
        }
        .ed-grid{ display:grid; grid-template-columns:1fr 1fr; gap:clamp(20px,4vw,56px); align-items:center; }
        @media (max-width:860px){ .ed-grid{ grid-template-columns:1fr; } }
        .ed-figcol{ display:flex; flex-direction:column; align-items:center; gap:14px; }
        .ed-toggles{ display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
        .ed-seg{ display:inline-flex; background:var(--ed-seg); border:1px solid var(--ed-hair);
          border-radius:99px; padding:3px; backdrop-filter:blur(8px); }
        .ed-segbtn{ border:none; background:transparent; color:var(--ed-muted);
          font-size:0.72rem; font-weight:600; letter-spacing:0.08em; text-transform:uppercase;
          padding:7px 16px; border-radius:99px; cursor:pointer; transition:all .25s; font-family:inherit; }
        .ed-segbtn.on{ background:var(--ed-panel); color:var(--ed-ink);
          box-shadow:0 2px 10px rgba(0,0,0,0.08); border:1px solid var(--ed-hair); }
        .ed-hint{ color:var(--ed-muted); font-size:0.75rem; letter-spacing:0.06em; }
        .ed-figure{ display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; }
        .ed-figure-frame{ position:relative; display:inline-block; line-height:0;
          background:transparent; border:none; box-shadow:none; }
        .ed-figure-3d{ perspective:1400px; }
        .ed-figure-tilt{ position:relative; line-height:0; transform-style:preserve-3d;
          will-change:transform; transition:transform 1s cubic-bezier(0.22,1,0.36,1); }
        .ed-figure-img{ height:min(58vh,600px); width:auto; max-width:min(78vw,340px);
          object-fit:contain; user-select:none; -webkit-user-drag:none; }
        .ed-wash{ position:absolute; pointer-events:none;
          background:radial-gradient(ellipse at center,
            rgba(232,115,95,0.70) 0%, rgba(232,115,95,0.32) 46%, rgba(232,115,95,0) 72%);
          filter:blur(6px); mix-blend-mode:multiply; }
        [data-theme="dark"] .ed-wash{
          background:radial-gradient(ellipse at center,
            rgba(255,128,102,0.85) 0%, rgba(255,128,102,0.38) 46%, rgba(255,128,102,0) 72%);
          mix-blend-mode:screen; }
        .ed-zone{ position:absolute; border:none; background:transparent; cursor:pointer;
          padding:0; border-radius:44%; }
        .ed-zone.is-hover{ background:rgba(232,115,95,0.16); }
        .ed-zone:focus-visible{ outline:2px solid var(--ed-coral); outline-offset:2px; }
        .ed-figure-caption{ color:var(--ed-muted); font-size:0.7rem; letter-spacing:0.28em;
          text-transform:uppercase; margin:0; line-height:1.4; text-align:center; }
        .ed-panel{ background:var(--ed-panel); border:1px solid var(--ed-hair);
          border-radius:24px; padding:clamp(24px,3vw,40px);
          backdrop-filter:blur(20px) saturate(1.4); -webkit-backdrop-filter:blur(20px) saturate(1.4);
          box-shadow:0 24px 60px rgba(90,60,40,0.10); }
        [data-theme="dark"] .ed-panel{ box-shadow:0 24px 60px rgba(0,0,0,0.35); }
        .ed-title{ font-family:'Playfair Display',Georgia,'Times New Roman',serif;
          font-size:clamp(2.2rem,4vw,3.4rem); font-weight:600; color:var(--ed-ink);
          margin:0; line-height:1.05; letter-spacing:0.01em; }
        .ed-sub{ color:var(--ed-muted); font-size:0.95rem; letter-spacing:0.14em;
          text-transform:uppercase; margin-top:8px; }
        .ed-rule{ height:1px; background:var(--ed-hair); margin:18px 0 4px; }
        .ed-row{ display:flex; align-items:flex-start; gap:12px; padding:13px 2px;
          border-bottom:1px solid var(--ed-hair); }
        .ed-dot{ width:8px; height:8px; border-radius:99px; margin-top:7px; flex:none;
          border:1.5px solid var(--ed-coral); background:transparent; }
        .ed-dot.on{ background:var(--ed-coral); }
        .ed-exname{ color:var(--ed-ink); font-size:1.02rem; font-weight:600; }
        .ed-exmeta{ color:var(--ed-muted); font-size:0.72rem; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase; margin-top:4px; }
        .ed-cta{ width:100%; margin-top:20px; border:none; cursor:pointer;
          background:linear-gradient(135deg, var(--ed-coral), #F0967E);
          color:#fff; font-size:0.95rem; font-weight:700; letter-spacing:0.04em;
          padding:14px; border-radius:99px; font-family:inherit;
          box-shadow:0 12px 28px rgba(232,115,95,0.35); transition:transform .2s, box-shadow .2s; }
        .ed-cta:hover{ transform:translateY(-2px); box-shadow:0 16px 34px rgba(232,115,95,0.45); }
        .ed-cta:active{ transform:translateY(0); }
      `}</style>

      <div className="ed-grid">
        <div className="ed-figcol">
          <div className="ed-toggles">
            {seg(
              [{ label: 'Front', value: 'front' }, { label: 'Back', value: 'back' }],
              view, (v) => { setView(v); setZoomed(false); },
            )}
            {seg(
              [{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }],
              gender, (g) => { setGender(g); setZoomed(false); },
            )}
          </div>
          <EditorialFigure
            sex={gender} view={view}
            selectedId={muscleId}
            zoomed={zoomed}
            onSelect={selectMuscle}
            caption={`${muscle.name.toUpperCase()} · ${view === 'front' ? 'ANTERIOR' : 'POSTERIOR'} VIEW`}
          />
          <div className="ed-hint">TAP A MUSCLE TO ZOOM IN · TAP AGAIN TO ZOOM OUT</div>
        </div>

        <EditorialExercisePanel muscle={muscle} onAdd={addToWorkout} />
      </div>
    </div>
  )
}
