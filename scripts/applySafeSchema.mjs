import fs from 'node:fs/promises'
import pg from 'pg'
import dotenv from 'dotenv'

// Load env from .env.local first (if present), then fallback to .env
dotenv.config({ path: '.env.local' })
dotenv.config()

const { Client } = pg

const DB_URL = process.env.DATABASE_URL
if (!DB_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const sql = await fs.readFile('sql/safe_schema_updates.sql', 'utf8')

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query('BEGIN')
  await client.query(sql)
  await client.query('COMMIT')
  console.log('applied')
} catch (e) {
  await client.query('ROLLBACK')
  console.error('failed:', e.message)
  process.exit(2)
} finally {
  await client.end()
}



