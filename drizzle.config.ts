import { defineConfig } from "drizzle-kit";

// drizzle-kit settings. `npm run db:generate` compares src/server/db/schema.ts
// with the snapshots in drizzle/meta and writes a new SQL migration to
// drizzle/; it needs no database. Migrations are applied with
// `npm run db:migrate` (scripts/db-migrate.mts), which only needs DATABASE_URL.
export default defineConfig({
  dialect: "mysql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
