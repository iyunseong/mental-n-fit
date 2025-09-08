import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const { Client } = pg
const DB_URL = process.env.DATABASE_URL
if (!DB_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
await client.connect()

const checks = [
  {
    table: 'daily_conditions',
    columns: [
      'sleep_quality_1_5','stress_morning_1_5','energy_morning_1_5','stress_noon_1_5','energy_noon_1_5','stress_evening_1_5','energy_evening_1_5','mood_0_10','journal_day','journal_gratitude','journal_feedback'
    ]
  },
  {
    table: 'workout_sessions',
    columns: ['mode','cardio_type','duration_min','avg_pace_sec']
  },
  {
    table: 'workout_sets',
    columns: ['exercise','reps','weight_kg']
  },
  {
    table: 'meal_items',
    columns: ['carb_g','protein_g','fat_g','fiber_g']
  }
]

const indexChecks = [
  'idx_ws_user_date',
  'idx_wset_session',
  'idx_me_events_user_date',
  'idx_meal_items_event'
]

try {
  const results = {}

  for (const c of checks) {
    const { rows } = await client.query(
      `select column_name from information_schema.columns where table_name = $1`,
      [c.table]
    )
    const present = new Set(rows.map(r => r.column_name))
    results[c.table] = c.columns.map(col => ({ col, exists: present.has(col) }))
  }

  const { rows: idxRows } = await client.query(
    `select indexname from pg_indexes where schemaname = 'public'`
  )
  const idxSet = new Set(idxRows.map(r => r.indexname))
  results.indexes = indexChecks.map(name => ({ name, exists: idxSet.has(name) }))

  console.log(JSON.stringify(results, null, 2))
} catch (e) {
  console.error('Verification failed:', e.message)
  process.exit(2)
} finally {
  await client.end()
}


