// pm2 process file for the server. After `npm ci` and `npm run build`:
//   pm2 start ecosystem.config.cjs
//
// It expects the server's layout, with this repository in website/:
//   /var/www/vacationrentalhotline/website          this repository
//   /var/www/vacationrentalhotline/storage/logs     everything the app prints
//   /var/www/vacationrentalhotline/storage/uploads  uploaded files (none yet)
/* eslint-disable @typescript-eslint/no-require-imports -- pm2 loads this file as CommonJS */
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");

const logs = path.resolve(__dirname, "../storage/logs");

/**
 * The port nginx forwards to: PORT from the environment, else from the
 * website's env files (Next's order), else 3000. Next itself can't read
 * PORT from those files, and keeping it out of this tracked file means
 * `git pull` never conflicts on the server. Only PORT is read, so no secret
 * ends up in pm2's saved process list.
 */
function port() {
  if (process.env.PORT) return process.env.PORT;
  for (const file of [".env.production.local", ".env.local", ".env.production", ".env"]) {
    try {
      const value = parseEnv(fs.readFileSync(path.join(__dirname, file), "utf8")).PORT;
      if (value) return value;
    } catch {
      // That file doesn't exist; try the next.
    }
  }
  return "3000";
}

module.exports = {
  apps: [
    {
      name: "vrh-website",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      // Only nginx, on the same machine, can reach the app. Directly, anyone
      // could send their own X-Forwarded-For and dodge the sign-in limits.
      args: "start --hostname 127.0.0.1",
      instances: 1,
      autorestart: true,
      // The app's output (requests that failed, scheduled jobs, email
      // errors), each line timestamped, kept outside the repository.
      out_file: path.join(logs, "website-out.log"),
      error_file: path.join(logs, "website-error.log"),
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: port(),
      },
    },
  ],
};
