// pm2 process file for the server. After `npm ci` and `npm run build`:
//   pm2 start ecosystem.config.cjs
//
// It expects the server's layout, with this repository in website/:
//   /var/www/vacationrentalhotline/website          this repository
//   /var/www/vacationrentalhotline/storage/logs     everything the app prints
//   /var/www/vacationrentalhotline/storage/uploads  uploaded files (none yet)
// eslint-disable-next-line @typescript-eslint/no-require-imports -- pm2 loads this file as CommonJS
const path = require("node:path");

const logs = path.resolve(__dirname, "../storage/logs");

module.exports = {
  apps: [
    {
      name: "vrh-website",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      // The app's output (requests that failed, scheduled jobs, email
      // errors), each line timestamped, kept outside the repository.
      out_file: path.join(logs, "website-out.log"),
      error_file: path.join(logs, "website-error.log"),
      time: true,
      env: {
        NODE_ENV: "production",
        // The port nginx forwards to; change it to suit the server.
        PORT: 3000,
      },
    },
  ],
};
