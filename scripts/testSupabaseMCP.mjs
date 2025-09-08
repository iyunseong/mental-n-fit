import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

const testName = `MCP_TEST_${Date.now()}`

// 1) Insert into a non-user FK table: food_db
const { data: insData, error: insErr } = await supabase
  .from('food_db')
  .insert({ name: testName })
  .select('id, name')
  .single()

if (insErr) {
  console.error('[ERROR] Insert failed:', insErr.message)
  process.exit(2)
}

// 2) Read back
const { data: selData, error: selErr } = await supabase
  .from('food_db')
  .select('id, name')
  .eq('id', insData.id)
  .single()

if (selErr) {
  console.error('[ERROR] Select failed:', selErr.message)
  process.exit(3)
}

// 3) Cleanup
const { error: delErr } = await supabase
  .from('food_db')
  .delete()
  .eq('id', insData.id)

if (delErr) {
  console.error('[WARN] Delete cleanup failed:', delErr.message)
}

console.log(JSON.stringify({ ok: true, inserted: insData, selected: selData }, null, 2))



