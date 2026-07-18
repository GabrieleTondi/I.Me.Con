import { db } from "./index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Adding 'prorogata' column to 'mediazione' table...");
  try {
    await db.execute(sql`ALTER TABLE mediazione ADD COLUMN IF NOT EXISTS prorogata BOOLEAN NOT NULL DEFAULT FALSE;`);
    console.log("✅ Column 'prorogata' added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to add column:", error);
    process.exit(1);
  }
}

run();
