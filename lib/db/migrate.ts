import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

// This script will be run separately to migrate the database
async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined")
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false })
  const db = drizzle(sql)

  console.log("Running migrations...")

  await migrate(db, { migrationsFolder: "drizzle" })

  console.log("Migrations completed!")

  await sql.end()
  process.exit(0)
}

runMigration().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
