const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  const badges = [
    { name:'First Bite',      emoji:'🍽️', description:'Log your first meal',              category:'Nutrition', rarity:'Common',    xp:100  },
    { name:'Protein King',    emoji:'💪', description:'Hit 200g protein 7 days straight', category:'Nutrition', rarity:'Rare',      xp:500  },
    { name:'Hydration Hero',  emoji:'💧', description:'Drink 8 glasses for 14 days',      category:'Nutrition', rarity:'Common',    xp:200  },
    { name:'Clean Eater',     emoji:'🥗', description:'Hit all macros for 30 days',       category:'Nutrition', rarity:'Epic',      xp:800  },
    { name:'First Rep',       emoji:'🏋️', description:'Complete your first workout',     category:'Fitness',   rarity:'Common',    xp:100  },
    { name:'Iron Will',       emoji:'🔩', description:'Work out 4x per week for a month', category:'Fitness',   rarity:'Rare',      xp:500  },
    { name:'Century Club',    emoji:'💯', description:'Complete 100 total workouts',      category:'Fitness',   rarity:'Epic',      xp:1000 },
    { name:'Week Warrior',    emoji:'📅', description:'7-day streak achieved',            category:'Streak',    rarity:'Common',    xp:150  },
    { name:'Monthly Monster', emoji:'📆', description:'30-day streak achieved',           category:'Streak',    rarity:'Rare',      xp:750  },
    { name:'NutriAI Legend',  emoji:'🌟', description:'Master of all - ultimate badge',   category:'Special',   rarity:'Mythic',    xp:50000},
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where:  { name: badge.name },
      update: badge,
      create: badge
    })
  }
  console.log('✅ Badges seeded!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
