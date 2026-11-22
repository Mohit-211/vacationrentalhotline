// Creates an admin account, for a new database that has no staff yet:
//
//   npm run admin:create -- --email you@example.com --name "Your Name"
//
// Prints a generated password once; sign in to the admin panel with it and
// change it. Later staff are added from the admin panel. Reads DATABASE_URL
// from the environment, or from .env / .env.local.
import { randomInt, randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { hashPassword } from "better-auth/crypto";
import mysql from "mysql2/promise";

const { values } = parseArgs({ options: { email: { type: "string" }, name: { type: "string" } } });
const email = values.email?.trim().toLowerCase();
const name = values.name?.trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
  console.error('Usage: npm run admin:create -- --email you@example.com --name "Your Name"');
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// Same shape as the admin panel's generated passwords: four groups of four.
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
let password: string;
do {
  password = Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join("");
} while (!/[0-9]/.test(password) || !/[A-Za-z]/.test(password));
password = password.match(/.{4}/g)!.join("-");

const connection = await mysql.createConnection({ uri: url });
try {
  await connection.query("SET time_zone = '+00:00'");
  const [existing] = await connection.query<mysql.RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) {
    console.error(`An account with ${email} already exists.`);
    process.exit(1);
  }
  const userId = randomUUID();
  await connection.beginTransaction();
  await connection.query(
    "INSERT INTO users (id, name, email, email_verified, role) VALUES (?, ?, ?, true, 'admin')",
    [userId, name, email],
  );
  await connection.query(
    "INSERT INTO accounts (id, user_id, account_id, provider_id, password) VALUES (?, ?, ?, 'credential', ?)",
    [randomUUID(), userId, userId, await hashPassword(password)],
  );
  await connection.commit();
  console.log(`Admin account created for ${email}.\nPassword (shown once): ${password}`);
} catch (error) {
  await connection.rollback().catch(() => {});
  throw error;
} finally {
  await connection.end();
}
