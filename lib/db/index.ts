import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

import * as schema from "./schema"

// Supabase Postgres speaks plain Postgres over TCP/SSL, so use postgres.js.
// The Neon serverless driver rewrites db.<ref>.supabase.co to a non-existent
// api.<ref>.supabase.co host and fails with ENOTFOUND.
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", prepare: false })

// Create a Drizzle client
export const db = drizzle(sql, { schema })
