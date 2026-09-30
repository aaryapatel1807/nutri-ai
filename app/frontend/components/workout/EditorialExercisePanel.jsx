'use client'

// EditorialExercisePanel — the frosted exercise card from the reference:
// large serif muscle title, muted latin subtitle, hairline-divided rows
// (name + EQUIPMENT • sets×reps • difficulty), coral "+ Add to Workout".

export default function EditorialExercisePanel({ muscle, onAdd }) {
  if (!muscle) return null
  return (
    <div className="ed-panel">
      <h2 className="ed-title">{muscle.name}</h2>
      <div className="ed-sub">{muscle.sub}</div>
      <div className="ed-rule" />

      <div>
        {muscle.exercises.map((ex, i) => (
          <div key={ex.name} className="ed-row" style={{ borderBottom: i === muscle.exercises.length - 1 ? 'none' : undefined }}>
            <span className={`ed-dot${i % 2 === 0 ? ' on' : ''}`} />
            <div style={{ flex: 1 }}>
              <div className="ed-exname">{ex.name}</div>
              <div className="ed-exmeta">
                {ex.equipment} &nbsp;•&nbsp; {ex.sets}×{ex.reps} &nbsp;•&nbsp; {ex.difficulty}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="ed-cta" onClick={onAdd}>
        + Add to Workout
      </button>
    </div>
  )
}
