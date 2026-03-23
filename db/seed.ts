import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { DEFAULT_CATEGORIES } from '../lib/categories'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function main() {
  console.log('Seeding default categories for testing...')
  console.log('Done! Default categories are created per-household on registration.')
}

main().catch(console.error)
