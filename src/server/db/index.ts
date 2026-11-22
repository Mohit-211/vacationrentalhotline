import "server-only";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { serverEnv } from "@/server/env";
import * as schema from "./schema";

export type Database = MySql2Database<typeof schema>;

function createDatabase(): Database {
  const pool = mysql.createPool({
    uri: serverEnv().DATABASE_URL,
    connectionLimit: 10,
    // Dates the driver converts itself (outside Drizzle's own mapping) are UTC.
    timezone: "Z",
  });
  // Database-side defaults such as CURRENT_TIMESTAMP use the session time
  // zone; pin it to UTC on every new connection, whatever the server's own
  // time zone is. Queries on a connection run in order, so this always runs
  // before the first query that uses it.
  pool.pool.on("connection", (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });
  return drizzle({ client: pool, schema, mode: "default" });
}

// One pool per server process. In development, keep it on globalThis so hot
// reloads reuse it instead of opening a new pool on every change.
const globalForDb = globalThis as typeof globalThis & { __vrhDatabase?: Database };

/** The shared database client. The pool is created on first use. */
export function db(): Database {
  if (!globalForDb.__vrhDatabase) {
    globalForDb.__vrhDatabase = createDatabase();
  }
  return globalForDb.__vrhDatabase;
}

export { schema };
