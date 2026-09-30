'use client'

import { useId, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { ArrowRight, Dumbbell, Flame, Sparkles, Utensils } from 'lucide-react'
import styles from './StoryHero.module.css'

const PROGRESS = 68

function ProgressRing() {
  const reactId = useId().replace(/:/g, '')
  const progressGradient = `story-progress-${reactId}`
  const progressShadow = `story-shadow-${reactId}`

  return (
    <div
      className={styles.ringCard}
      role="img"
      aria-label={`Sample day nutrition progress: ${PROGRESS} percent`}
    >
      <svg
        className={styles.ringSvg}
        viewBox="0 0 260 260"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={progressGradient} x1="38" y1="35" x2="222" y2="222" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffd27b" />
            <stop offset="0.46" stopColor="#ffad3d" />
            <stop offset="1" stopColor="#ff675b" />
          </linearGradient>
          <filter id={progressShadow} x="-35%" y="-35%" width="170%" height="180%">
            <feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#080706" floodOpacity="0.55" />
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ff7c5d" floodOpacity="0.24" />
          </filter>
        </defs>

        <circle className={styles.ringWell} cx="130" cy="130" r="89" />
        <circle className={styles.ringTrackShade} cx="130" cy="134" r="88" pathLength="100" />
        <circle className={styles.ringTrack} cx="130" cy="130" r="88" pathLength="100" />
        <circle
          className={styles.ringProgressShade}
          cx="130"
          cy="134"
          r="88"
          pathLength="100"
          strokeDasharray={`${PROGRESS} ${100 - PROGRESS}`}
        />
        <circle
          className={styles.ringProgress}
          cx="130"
          cy="130"
          r="88"
          pathLength="100"
          stroke={`url(#${progressGradient})`}
          strokeDasharray={`${PROGRESS} ${100 - PROGRESS}`}
          filter={`url(#${progressShadow})`}
        />
        <circle className={styles.ringGlint} cx="50.3" cy="167.5" r="5.5" />
      </svg>

      <div className={styles.ringLabel} aria-hidden="true">
        <span className={styles.sampleEyebrow}>Sample day</span>
        <strong>{PROGRESS}%</strong>
        <span>nutrition target</span>
      </div>
    </div>
  )
}

function SampleMealCard() {
  return (
    <article className={`${styles.dataCard} ${styles.foodCard}`}>
      <div className={styles.cardHeading}>
        <span className={styles.iconTile}><Utensils size={17} aria-hidden="true" /></span>
        <div>
          <span className={styles.cardKicker}>Sample meal</span>
          <h2>Harissa grain bowl</h2>
        </div>
      </div>
      <div className={styles.cardMetric}>
        <strong>520</strong><span>kcal</span>
      </div>
      <div className={styles.macroRow} aria-label="Example macros: 31 grams protein, 62 grams carbs, 18 grams fat">
        <span><b>P</b> 31g</span>
        <span><b>C</b> 62g</span>
        <span><b>F</b> 18g</span>
      </div>
      <p className={styles.sampleNote}>Example only · not logged</p>
    </article>
  )
}

function SampleWorkoutCard() {
  return (
    <article className={`${styles.dataCard} ${styles.workoutCard}`}>
      <div className={styles.cardHeading}>
        <span className={`${styles.iconTile} ${styles.iconTileAmber}`}><Dumbbell size={17} aria-hidden="true" /></span>
        <div>
          <span className={styles.cardKicker}>Sample workout</span>
          <h2>Strength + mobility</h2>
        </div>
      </div>
      <div className={styles.workoutStats}>
        <span><strong>38</strong> min</span>
        <span><Flame size={14} aria-hidden="true" /><strong>240</strong> kcal</span>
      </div>
      <div className={styles.progressTrack} aria-hidden="true"><span /></div>
      <p className={styles.sampleNote}>Example plan · 4 of 6 blocks</p>
    </article>
  )
}

export default function StoryHero({ reduce = false }) {
  const sectionRef = useRef(null)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 24, mass: 0.55 })
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 24, mass: 0.55 })
  const sceneX = useTransform(smoothX, [-0.5, 0.5], [-7, 7])
  const sceneY = useTransform(smoothY, [-0.5, 0.5], [-5, 5])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const ringY = useTransform(scrollYProgress, [0, 1], [13, -13])
  const ringRotate = useTransform(scrollYProgress, [0, 1], [-2.5, 2.5])
  const mealY = useTransform(scrollYProgress, [0, 1], [8, -10])
  const workoutY = useTransform(scrollYProgress, [0, 1], [-7, 10])

  const handlePointerMove = (event) => {
    if (reduce || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5)
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5)
  }

  const resetPointer = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  const handleReducedMotionAnchor = (event) => {
    if (!reduce) return
    const target = document.querySelector(event.currentTarget.hash)
    if (!target) return
    event.preventDefault()
    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    target.scrollIntoView({ block: 'start' })
    requestAnimationFrame(() => { root.style.scrollBehavior = previous })
  }

  return (
    <section
      ref={sectionRef}
      className={styles.hero}
      data-reduce={reduce ? 'true' : undefined}
      aria-labelledby="story-hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.layout}>
        <motion.div
          className={styles.copy}
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.eyebrow}><Sparkles size={15} aria-hidden="true" /> Nutrition that connects the dots</div>
          <h1 id="story-hero-title">
            <span>Your body.</span>
            <span>Your data.</span>
            <span className={styles.accentLine}>Your AI.</span>
          </h1>
          <p className={styles.description}>
            Turn meals, movement, and everyday signals into a clearer story—then get practical guidance shaped around you.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryCta} href="#auth" onClick={handleReducedMotionAnchor}>
              Start tracking free <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className={styles.secondaryCta} href="#chapters" onClick={handleReducedMotionAnchor}>
              Explore how it works
            </a>
          </div>
          <p className={styles.trustLine}>Built for useful patterns, not perfect days.</p>
        </motion.div>

        <div className={styles.scene} role="group" aria-label="Illustrative NutriAI sample dashboard">
          <div className={styles.sceneGrid} aria-hidden="true" />
          <motion.div
            className={styles.sceneFloat}
            style={reduce ? undefined : { x: sceneX, y: sceneY }}
          >
            <motion.div
              className={`${styles.scrollLayer} ${styles.ringLayer}`}
              style={reduce ? undefined : { y: ringY, rotate: ringRotate }}
            >
              <ProgressRing />
            </motion.div>
            <motion.div
              className={`${styles.scrollLayer} ${styles.mealLayer}`}
              style={reduce ? undefined : { y: mealY }}
            >
              <SampleMealCard />
            </motion.div>
            <motion.div
              className={`${styles.scrollLayer} ${styles.workoutLayer}`}
              style={reduce ? undefined : { y: workoutY }}
            >
              <SampleWorkoutCard />
            </motion.div>
          </motion.div>
          <p className={styles.sceneCaption}>Illustrative sample data</p>
        </div>
      </div>
    </section>
  )
}
