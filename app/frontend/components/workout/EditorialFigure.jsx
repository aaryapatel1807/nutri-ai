import { useEffect, useState } from 'react';

/**
 * EditorialFigure — illustrated anatomical plate with invisible click-zones.
 *
 * Renders a hand-illustrated ink figure (female/male, front/back) and lays
 * transparent <button> hit-zones over each muscle group. The selected muscle
 * gets a soft coral watercolour wash, like the approved reference.
 *
 * The plate swaps to a dark-ink variant whenever the app theme is dark
 * (data-theme="dark" on <html>), so the figure melts into night mode.
 */

const FIGURE_SRC = {
  'female-front': '/images/muscle-figures/figure-female-front.webp',
  'female-back': '/images/muscle-figures/figure-female-back.webp',
  'male-front': '/images/muscle-figures/figure-male-front.webp',
  'male-back': '/images/muscle-figures/figure-male-back.webp',
};

const FIGURE_SRC_DARK = {
  'female-front': '/images/muscle-figures/figure-female-front-dark.webp',
  'female-back': '/images/muscle-figures/figure-female-back-dark.webp',
  'male-front': '/images/muscle-figures/figure-male-front-dark.webp',
  'male-back': '/images/muscle-figures/figure-male-back-dark.webp',
};

function useAppTheme() {
  const read = () =>
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme')
      : null;
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setTheme(read()));
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/* Hit-zones as % of the figure image (x, y, w, h). Left/right pairs share an id. */
const ZONES = {
  'female-front': [
    { id: 'chest', x: 32, y: 20, w: 36, h: 14 },
    { id: 'shoulders', x: 15, y: 23, w: 18, h: 12 },
    { id: 'shoulders', x: 67, y: 23, w: 18, h: 12 },
    { id: 'biceps', x: 13, y: 33, w: 10, h: 12 },
    { id: 'biceps', x: 77, y: 33, w: 10, h: 12 },
    { id: 'triceps', x: 12, y: 44, w: 9, h: 10 },
    { id: 'triceps', x: 79, y: 44, w: 9, h: 10 },
    { id: 'abs', x: 38, y: 36, w: 24, h: 12 },
    { id: 'quads', x: 33, y: 54, w: 15, h: 16 },
    { id: 'quads', x: 52, y: 54, w: 15, h: 16 },
    { id: 'calves', x: 34, y: 74, w: 12, h: 12 },
    { id: 'calves', x: 54, y: 74, w: 12, h: 12 },
  ],
  'female-back': [
    { id: 'traps', x: 18, y: 13, w: 28, h: 8 },
    { id: 'back', x: 16, y: 21, w: 32, h: 20 },
    { id: 'lower-back', x: 22, y: 40, w: 20, h: 8 },
    { id: 'shoulders', x: 2, y: 16, w: 14, h: 10 },
    { id: 'shoulders', x: 50, y: 16, w: 14, h: 10 },
    { id: 'biceps', x: 2, y: 28, w: 9, h: 11 },
    { id: 'biceps', x: 53, y: 28, w: 9, h: 11 },
    { id: 'triceps', x: 1, y: 38, w: 8, h: 9 },
    { id: 'triceps', x: 54, y: 38, w: 8, h: 9 },
    { id: 'glutes', x: 14, y: 46, w: 36, h: 12 },
    { id: 'hamstrings', x: 16, y: 58, w: 14, h: 14 },
    { id: 'hamstrings', x: 36, y: 58, w: 14, h: 14 },
    { id: 'calves', x: 16, y: 73, w: 12, h: 12 },
    { id: 'calves', x: 36, y: 73, w: 12, h: 12 },
  ],
  'male-front': [
    { id: 'chest', x: 40, y: 25, w: 20, h: 9 },
    { id: 'shoulders', x: 24, y: 23, w: 13, h: 10 },
    { id: 'shoulders', x: 63, y: 23, w: 13, h: 10 },
    { id: 'biceps', x: 25, y: 30, w: 11, h: 11 },
    { id: 'biceps', x: 64, y: 30, w: 11, h: 11 },
    { id: 'triceps', x: 25, y: 40, w: 10, h: 10 },
    { id: 'triceps', x: 65, y: 40, w: 10, h: 10 },
    { id: 'abs', x: 42, y: 34, w: 16, h: 11 },
    { id: 'quads', x: 36, y: 53, w: 13, h: 13 },
    { id: 'quads', x: 51, y: 53, w: 13, h: 13 },
    { id: 'calves', x: 34, y: 69, w: 12, h: 11 },
    { id: 'calves', x: 54, y: 69, w: 12, h: 11 },
  ],
  'male-back': [
    { id: 'traps', x: 43, y: 22, w: 15, h: 7 },
    { id: 'back', x: 32, y: 30, w: 36, h: 14 },
    { id: 'lower-back', x: 44, y: 43, w: 13, h: 7 },
    { id: 'shoulders', x: 24, y: 23, w: 13, h: 10 },
    { id: 'shoulders', x: 63, y: 23, w: 13, h: 10 },
    { id: 'biceps', x: 25, y: 30, w: 11, h: 11 },
    { id: 'biceps', x: 64, y: 30, w: 11, h: 11 },
    { id: 'triceps', x: 25, y: 40, w: 10, h: 10 },
    { id: 'triceps', x: 65, y: 40, w: 10, h: 10 },
    { id: 'glutes', x: 38, y: 46, w: 24, h: 10 },
    { id: 'hamstrings', x: 33, y: 58, w: 13, h: 12 },
    { id: 'hamstrings', x: 54, y: 58, w: 13, h: 12 },
    { id: 'calves', x: 38, y: 71, w: 12, h: 11 },
    { id: 'calves', x: 50, y: 71, w: 12, h: 11 },
  ],
};

const LABELS = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', abs: 'Abs', 'lower-back': 'Lower back', traps: 'Traps',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
};

export default function EditorialFigure({ sex, view, selectedId, zoomed, onSelect, caption }) {
  const key = `${sex}-${view}`;
  const zones = ZONES[key] || [];
  const [hovered, setHovered] = useState(null);
  const theme = useAppTheme();
  const src = (theme === 'dark' ? FIGURE_SRC_DARK : FIGURE_SRC)[key];

  const activeZones = zones.filter((z) => z.id === selectedId);
  const focus = activeZones[0];
  /* 3D camera move: zoom into the tapped muscle and tilt the figure toward it,
     like rotating a 3D model. transform-origin sits on the muscle's centre. */
  const cx = focus ? focus.x + focus.w / 2 : 50;
  const cy = focus ? focus.y + focus.h / 2 : 50;
  const tiltY = focus ? (50 - cx) * 0.32 : 0;
  const tiltX = focus ? (50 - cy) * 0.10 : 0;
  const tiltStyle =
    zoomed && focus
      ? {
          transform: `scale(2.05) rotateY(${tiltY.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg)`,
          transformOrigin: `${cx.toFixed(1)}% ${cy.toFixed(1)}%`,
        }
      : {};
  /* One watercolour blob per zone, so paired muscles (shoulders, biceps…)
     wash each side instead of one giant smear across the torso. */
  const blobs = activeZones.map((z) => ({
    left: `${z.x + z.w / 2 - z.w * 0.95}%`,
    top: `${z.y + z.h / 2 - z.h * 1.1}%`,
    width: `${z.w * 1.9}%`,
    height: `${z.h * 2.2}%`,
  }));

  return (
    <div className="ed-figure">
      <div className="ed-figure-frame ed-figure-3d">
        <div className="ed-figure-tilt" style={tiltStyle}>
        <img
          src={src}
          alt={`${sex} ${view} anatomical figure`}
          className="ed-figure-img"
          draggable={false}
        />
        {blobs.map((b, i) => (
          <div key={`wash-${i}`} className="ed-wash" style={b} aria-hidden="true" />
        ))}
        {zones.map((z, i) => (
          <button
            key={`${z.id}-${i}`}
            type="button"
            data-muscle={z.id}
            aria-label={LABELS[z.id] || z.id}
            title={LABELS[z.id] || z.id}
            className={`ed-zone${hovered === `${z.id}-${i}` ? ' is-hover' : ''}`}
            style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
            onClick={() => onSelect(z.id)}
            onMouseEnter={() => setHovered(`${z.id}-${i}`)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(`${z.id}-${i}`)}
            onBlur={() => setHovered(null)}
          />
        ))}
        </div>
      </div>
      {caption && <p className="ed-figure-caption">{caption}</p>}
    </div>
  );
}
