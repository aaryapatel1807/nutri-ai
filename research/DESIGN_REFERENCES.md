# NutriAI Design Reference Brief — Visual Design Language Research
*Compiled 29 Sep 2026 (overnight research). Sources: official brand docs, App Store/Play listings, design teardowns (Dribbble/Behance-style writeups), Awwwards-caliber technique catalogs, apple.com scrollytelling patterns.*

---

## 1. Per-app visual signatures

### Nike Training Club
- **Dark-first "stadium void":** true-black `#000000` canvas, charcoal surfaces (`#0A0A0A`–`#2B2B2B`); fixed Volt `#CCFF00` + Red `#FA5400` accents — no palette theming, ever.
- **Athletic-imperative voice:** verbs are commands ("Train", "Start"), never SaaS qualifiers ("Get started free").
- **Weight contrast typography:** ultra-light labels vs heavy hero numbers; campaign headlines condensed, uppercase, tight leading (Futura ND / Helvetica Now Display style).
- **Signature components:** full-screen focused workout mode, trainer video overlays, "training effect" results page with a 5-color HR-zone system (blue→green→yellow→orange→red).

### Apple Fitness+
- **The rings are the brand:** three stacked SVG rings (Move red / Exercise green / Stand blue), ring-fill animation with a subtle bounce at completion + confetti when all three close — "closing your rings" became a cultural ritual.
- **apple.com scrollytelling:** slim sticky translucent nav → big centered product hero → alternating full-bleed feature sections (*one idea each*) → bento feature grid → tech specs.
- **Motion discipline:** physics-based, damped, smooth; never scroll-jacks; every cinematic moment has a static-frame fallback and `prefers-reduced-motion` guard.
- **Typography:** SF Pro / SF Pro Rounded numerals, tabular figures, large numbers with small quiet labels.

### Strava
- **One accent, rationed:** pumpkin orange `#FC4C02` is the ONLY chromatic accent — reserved for interactive and athletic-energy moments (Record button, kudos fill, PR chips). Everything else is neutral warm grays (`#FFFFFF`→`#F5F4F2`→`#0E0E0E`).
- **The route polyline is the trophy:** 4pt orange stroke with a `rgba(252,76,2,0.3)` luminance halo over maps — "effort is the content, orange is the energy."
- **Stat voice:** 11pt UPPERCASE semibold labels with 0.6pt tracking; hero numbers at 44pt Black; tabular numerals everywhere (splits, pace, leaderboards).
- **Signature micro-moment:** kudos button fills orange with a scale-bounce + 8 orange particles + haptic — most-tapped affordance, sized for instant reach.

### MyFitnessPal
- **Diary-first:** the food log is the hero surface; brand blue + jumping-figure mark.
- **Cautionary tale (2025 redesign):** hiding itemized meals behind taps, showing macros as % instead of grams, and a swipeable calorie arc confused long-time users — lesson: never hide primary data behind gestures.
- **Utilitarian, data-dense:** the moat is the food database, not the aesthetics.

### Fitbod
- **Dark-first calm:** `#0b0d12` background, `#12151c` surfaces, `#ff5a36` accent — toned-down colors create a "well-designed gym" focus.
- **Focus takeover:** hitting start makes the workout plan take over the full screen, tabs disappear, timer dominates — eliminates distraction.
- **Recovery visualization:** muscle-group freshness/readiness drives the program; freshness heatmap is a signature surface.
- **Trust through consistency:** small celebratory confetti at workout end; consistent palette; "apprenticeship" UX that teaches planning through the interface itself.

### Whoop
- **Instrument panel:** pitch-black `#0A0A0A` canvas (dark-only, no light theme), Strain Green `#00FF7B` signature accent, neon glows *replace* shadows (`rgba(0,255,123,0.18) 0 0 12px`).
- **DIN 2014 mechanical type:** ALL CAPS headers with 0.8–1.6pt wide tracking, tabular numerals — cockpit aesthetic.
- **Recovery ring:** open at top, color-shifts red→yellow→green by score in 1% increments, 240pt diameter hero on Overview — the daily ritual.
- **Definition without shadows:** 1pt `#252525` hairline borders for cards; 4pt-corner-radius rectangular buttons, never pills; sleep chart as a horizontal stacked bar (REM purple / Deep blue / Light cyan / Awake gray).

### Cult.fit (India) — "Aurora" design language
- **Aurora:** extends the bold black facades of Cult gyms into the app — "dark yet vibrant and energetic."
- **Result:** 300% increase in engagement on key app properties after the redesign; trial signups +12%.
- **Fully coded design system** → ships new products faster with high consistency.
- **Gamified micro-interactions,** strong community/challenges, booking-first UX (class check-in is the #1 function).

### HealthifyMe (India) — closest local analog
- **Positioning:** "AI-powered Health Coach in your pocket," metabolic-health niche; empathetic-but-authoritative tone.
- **Trust through data:** clean, data-forward visual system; clinical-grade charts and progress metrics across every surface.
- **Indian-first:** Indian food database, festival/regional needs, multilingual AI coach (Ria 2.0), coaches from all regional backgrounds — "warm and quintessentially Indian," built trust in households new to tech.
- **Snap:** AI photo food tracking; rebranded to "Healthify" with an AI-first app design.

---

## 2. "3D storytelling" technique catalog

1. **Video `currentTime` scrub** (apple.com) — scroll position drives a cinematic clip frame-by-frame; static start/end frames as fallback.
2. **WebGL-3D scroll viewer** (three.js + GLTF) — a real 3D object (product, dumbbell, food bowl) the user rotates/orbits as they scroll; Apple's own product-viewer pattern.
3. **Canvas image-sequence scrub** — pre-rendered frame set drawn to canvas on rAF, synced to scroll (the classic pre-2022 Apple pattern).
4. **Sticky-stack card deck** — `position: sticky` chapters with staggered `top` and ascending `z-index`; cards stack and recede like a deck.
5. **Cutout parallax rig** — hero subject cut out of the image, 3–5 layers (subject, mid-fog/particles, background plate) moving at different rates on scroll *and* cursor; the hero feels volumetric. Cheap, robust, dramatic.
6. **Grade-shift pair** — two renders of the same composition (dormant vs lit); crossfade by cursor spotlight or scroll — "the site notices you."
7. **Scroll-driven 3D rotation** — a CSS 3D object (cube, ring) rotating through choreographed stages as you scroll.
8. **Scroll-driven mask reveal** — the page opens inside giant display type; scrolling expands the mask (clip-path) until the media goes full-bleed.
9. **Kinetic type** — headlines that arrive as narrative: word-by-word scroll lighting, masked line reveals, split-converge.
10. **Cross-section theme morph** — chapters crossfade light ↔ dark as you scroll (warm-paper → warm-charcoal), giving the page an arc.
11. **Damped scroll engine** — Lenis (inertial smooth scroll) + GSAP ScrollTrigger pin/scrub/parallax; lerp a shadow scroll value so motion feels buttery, never janky.
12. **Floating inter-section product** — a 3D-ish object travels between sections on a curved path (GSAP Flip), bridging one idea to the next.

*Rules every award site follows: never scroll-jack, 60fps minimum, always guard with `prefers-reduced-motion`, progressive-enhance (no heavy SPA for the story itself).*

---

## 3. Stealable ideas for NutriAI (what + why)

1. **Landing — rotating "fuel ring" hero:** a 3D amber glass calorie ring that completes as you scroll (technique 7) — borrows Apple's ring ritual but in NutriAI's amber; the product *is* the story.
2. **Landing — sticky-stack feature chapters:** AI coach → food scan → workout plans, each a full-bleed pinned section with *one* idea, morphing warm-paper → warm-charcoal as you scroll (techniques 4 + 10).
3. **Landing — cutout parallax hero:** athlete photo with the subject cut out over amber gradient + particle layers moving on scroll and cursor (technique 5) — volumetric hero without WebGL cost.
4. **Dashboard — hero "day score" ring:** one glanceable ring that color-shifts red→amber→green by goal completion, Whoop-style — turns scattered macros into a daily ritual users check compulsively.
5. **Dashboard — Strava stat voice:** 11pt uppercase semibold labels, tabular numerals, display-scale hero numbers — makes personal records feel loud and units quietly supportive.
6. **Workout — Fitbod focus takeover:** active workout goes full-screen, tabs vanish, exercise name + timer dominate — eliminates distraction where it matters.
7. **Workout — Nike "training effect" summary:** post-workout results page with a 5-zone intensity breakdown — makes finishing feel like a trophy moment.
8. **Workout — content-motivated celebration:** small confetti + bounce when a set completes and the ring closes — never decorative, always earned.
9. **Meal logger — "developing" scan card:** the food photo reveals with a liquid mask animation while macros count up — makes AI detection feel magical, not mechanical.
10. **Global — amber rationing rule:** like Strava's orange, amber fires only on energy/interactive moments (CTAs, rings, PRs, active states); everything else stays neutral warm grays — one accent, used sparingly, is what makes it premium.

---

## 4. Recommendations for warm amber/charcoal premium fitness

**Color**
- Canvas: warm charcoal `#141210` (light) / `#1A1714` (dark) — never pure black, warmth is the brand.
- Surfaces: `#221E1A` cards, hairline borders `1px rgba(245,165,36,0.12)`; soft shadows, amber glows only on active/energy states.
- Accent: amber `#F5A524` / `#F97316` — single energy accent, Strava-rationed. Supporting cast: success `#2ECC71`, alert `#FF6B6B`, PR gold `#F5C24A` (semantic only, never decorative).
- Light theme: warm paper `#FAF7F2`, frosted glass `rgba(255,255,255,0.6)` with blur — keep the existing approved direction.

**Typography**
- Display: keep Clash Display for product UI; use a condensed heavy (Oswald/Anton-class) for *campaign* headlines — uppercase, tight leading, the Nike voice.
- Body: clean geometric sans (Satoshi/Inter).
- **Tabular numerals everywhere** stats appear — alignment *is* the information; hero numbers at display scale with small muted labels beneath.

**Motion**
- Engine: Lenis smooth scroll + GSAP ScrollTrigger (pin/scrub/parallax), framer-motion for component micro-interactions — 60fps, no jank.
- Rings fill with a subtle bounce at completion; press feedback `scale(0.97)`; staggered card entrances on dashboards.
- Springs answer only the finger; state changes latch instantly — Whoop/Apple discipline.
- Respect `prefers-reduced-motion` everywhere; loading skeletons, not spinners; empty states with motivational copy.
- Haptic-style punch on the most-tapped affordances (log meal, complete set, kudos-equivalent).
