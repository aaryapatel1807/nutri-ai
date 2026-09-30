'use client'

// Curated exercise data for the Editorial muscle explorer.
// Each muscle: 4 signature exercises with equipment / sets×reps / difficulty.

export const EDITORIAL_MUSCLES = {
  chest: {
    name: 'Chest', sub: 'Pectoralis Major', views: ['front'],
    exercises: [
      { name: 'Dumbbell Bench Press',   equipment: 'Dumbbell',   sets: 4, reps: '8',   difficulty: 'Moderate' },
      { name: 'Push-Up',                equipment: 'Bodyweight', sets: 3, reps: '12',  difficulty: 'Light' },
      { name: 'Incline Dumbbell Press', equipment: 'Dumbbell',   sets: 3, reps: '10',  difficulty: 'Moderate' },
      { name: 'Cable Fly',              equipment: 'Cable',      sets: 3, reps: '12',  difficulty: 'Light' },
    ],
  },
  back: {
    name: 'Back', sub: 'Latissimus Dorsi', views: ['back'],
    exercises: [
      { name: 'Pull-Up',           equipment: 'Bar',      sets: 3, reps: '8',  difficulty: 'Moderate' },
      { name: 'Bent-Over Row',     equipment: 'Barbell',  sets: 4, reps: '10', difficulty: 'Moderate' },
      { name: 'Lat Pulldown',      equipment: 'Cable',    sets: 3, reps: '12', difficulty: 'Light' },
      { name: 'Seated Cable Row',  equipment: 'Cable',    sets: 3, reps: '12', difficulty: 'Light' },
    ],
  },
  shoulders: {
    name: 'Shoulders', sub: 'Deltoids', views: ['front', 'back'],
    exercises: [
      { name: 'Overhead Press', equipment: 'Dumbbell',   sets: 3, reps: '10', difficulty: 'Moderate' },
      { name: 'Lateral Raise',  equipment: 'Cable',      sets: 3, reps: '12', difficulty: 'Light' },
      { name: 'Arnold Press',   equipment: 'Dumbbell',   sets: 4, reps: '8',  difficulty: 'Moderate' },
      { name: 'Face Pull',      equipment: 'Cable Rope', sets: 3, reps: '15', difficulty: 'Light' },
    ],
  },
  biceps: {
    name: 'Biceps', sub: 'Biceps Brachii', views: ['front'],
    exercises: [
      { name: 'Barbell Curl',       equipment: 'Barbell',  sets: 4, reps: '10', difficulty: 'Moderate' },
      { name: 'Hammer Curl',        equipment: 'Dumbbell', sets: 3, reps: '12', difficulty: 'Light' },
      { name: 'Preacher Curl',      equipment: 'Barbell',  sets: 3, reps: '10', difficulty: 'Moderate' },
      { name: 'Concentration Curl', equipment: 'Dumbbell', sets: 3, reps: '12', difficulty: 'Light' },
    ],
  },
  triceps: {
    name: 'Triceps', sub: 'Triceps Brachii', views: ['back'],
    exercises: [
      { name: 'Tricep Pushdown',   equipment: 'Cable',      sets: 4, reps: '12', difficulty: 'Moderate' },
      { name: 'Overhead Extension',equipment: 'Dumbbell',   sets: 3, reps: '12', difficulty: 'Light' },
      { name: 'Dips',              equipment: 'Bodyweight', sets: 3, reps: '10', difficulty: 'Moderate' },
      { name: 'Skull Crushers',    equipment: 'Barbell',    sets: 3, reps: '10', difficulty: 'Moderate' },
    ],
  },
  abs: {
    name: 'Core', sub: 'Rectus Abdominis', views: ['front'],
    exercises: [
      { name: 'Hanging Leg Raise', equipment: 'Bar',        sets: 3, reps: '12', difficulty: 'Moderate' },
      { name: 'Cable Crunch',      equipment: 'Cable',      sets: 3, reps: '15', difficulty: 'Light' },
      { name: 'Russian Twist',     equipment: 'Bodyweight', sets: 3, reps: '20', difficulty: 'Light' },
      { name: 'Plank',             equipment: 'Bodyweight', sets: 3, reps: '60s',difficulty: 'Light' },
    ],
  },
  lowerback: {
    name: 'Lower Back', sub: 'Erector Spinae', views: ['back'],
    exercises: [
      { name: 'Deadlift',       equipment: 'Barbell',    sets: 4, reps: '6',   difficulty: 'Advanced' },
      { name: 'Hyperextension', equipment: 'Bodyweight', sets: 3, reps: '15',  difficulty: 'Light' },
      { name: 'Good Morning',   equipment: 'Barbell',    sets: 3, reps: '10',  difficulty: 'Moderate' },
      { name: 'Superman Hold',  equipment: 'Bodyweight', sets: 3, reps: '30s', difficulty: 'Light' },
    ],
  },
  traps: {
    name: 'Traps', sub: 'Trapezius', views: ['back'],
    exercises: [
      { name: 'Barbell Shrug',  equipment: 'Barbell',    sets: 4, reps: '12',  difficulty: 'Moderate' },
      { name: "Farmer's Carry", equipment: 'Dumbbell',   sets: 3, reps: '40m', difficulty: 'Moderate' },
      { name: 'Face Pull',      equipment: 'Cable Rope', sets: 3, reps: '15',  difficulty: 'Light' },
      { name: 'Upright Row',    equipment: 'Barbell',    sets: 3, reps: '10',  difficulty: 'Moderate' },
    ],
  },
  glutes: {
    name: 'Glutes', sub: 'Gluteus Maximus', views: ['back'],
    exercises: [
      { name: 'Hip Thrust',            equipment: 'Barbell',  sets: 4, reps: '10',     difficulty: 'Moderate' },
      { name: 'Bulgarian Split Squat', equipment: 'Dumbbell', sets: 3, reps: '10/leg', difficulty: 'Moderate' },
      { name: 'Romanian Deadlift',     equipment: 'Barbell',  sets: 4, reps: '8',      difficulty: 'Moderate' },
      { name: 'Cable Kickback',        equipment: 'Cable',    sets: 3, reps: '15',     difficulty: 'Light' },
    ],
  },
  quads: {
    name: 'Quads', sub: 'Quadriceps', views: ['front'],
    exercises: [
      { name: 'Back Squat',     equipment: 'Barbell',  sets: 5, reps: '5',      difficulty: 'Advanced' },
      { name: 'Leg Press',      equipment: 'Machine',  sets: 4, reps: '12',     difficulty: 'Moderate' },
      { name: 'Walking Lunge',  equipment: 'Dumbbell', sets: 3, reps: '20/leg', difficulty: 'Moderate' },
      { name: 'Leg Extension',  equipment: 'Machine',  sets: 3, reps: '15',     difficulty: 'Light' },
    ],
  },
  hamstrings: {
    name: 'Hamstrings', sub: 'Biceps Femoris', views: ['back'],
    exercises: [
      { name: 'Romanian Deadlift', equipment: 'Barbell',    sets: 4, reps: '8',  difficulty: 'Moderate' },
      { name: 'Lying Leg Curl',    equipment: 'Machine',    sets: 4, reps: '12', difficulty: 'Moderate' },
      { name: 'Nordic Curl',       equipment: 'Bodyweight', sets: 3, reps: '6',  difficulty: 'Advanced' },
      { name: 'Glute-Ham Raise',   equipment: 'Bodyweight', sets: 3, reps: '10', difficulty: 'Advanced' },
    ],
  },
  calves: {
    name: 'Calves', sub: 'Gastrocnemius', views: ['front', 'back'],
    exercises: [
      { name: 'Standing Calf Raise', equipment: 'Bodyweight', sets: 5, reps: '20',  difficulty: 'Light' },
      { name: 'Seated Calf Raise',   equipment: 'Machine',    sets: 4, reps: '20',  difficulty: 'Light' },
      { name: 'Donkey Calf Raise',   equipment: 'Machine',    sets: 4, reps: '15',  difficulty: 'Moderate' },
      { name: 'Jump Rope',           equipment: 'Rope',       sets: 3, reps: '2min',difficulty: 'Light' },
    ],
  },
}

export const EDITORIAL_MUSCLE_IDS = Object.keys(EDITORIAL_MUSCLES)
