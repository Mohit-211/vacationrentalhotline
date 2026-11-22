// Applies the SQL migrations in drizzle/ that the database hasn't run yet,
// recording each one in the __drizzle_migrations table.
//
//   npm run db:migrate
//
// Reads DATABASE_URL from the environment, or from .env / .env.local. Uses only
// runtime dependencies, so it works on a server installed without dev packages.
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const connection = await mysql.createConnection({ uri: url, multipleStatements: false });
try {
  await connection.query("SET time_zone = '+00:00'");
  await migrate(drizzle({ client: connection }), { migrationsFolder: "./drizzle" });
  console.log("Migrations are up to date.");
} finally {
  await connection.end();
}
