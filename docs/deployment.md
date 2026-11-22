# Deploying the website (Ubuntu + nginx)

This sets up the website on the VPS at `/var/www/vacationrentalhotline/website`, run by pm2 behind nginx with
HTTPS. The admin panel is deployed separately. Commands are run as the user that runs pm2 (root on the server
today). Replace `vacationrentalhotline.com` if the domain differs.

```
/var/www/vacationrentalhotline/
├── admin/          the admin panel (deployed separately)
├── website/        this repository
└── storage/
    ├── logs/       the website's logs
    └── uploads/    uploaded files (none yet)
```

## 1. Check the server

The website needs Node.js 24 or newer, MySQL 8.0, nginx and pm2.

```bash
node -v          # v24.x or newer
mysql --version  # 8.0.x
nginx -v
pm2 -v           # if missing: npm install -g pm2
```

If Node.js is missing or older than 24, install it (this replaces the server's Node.js for every site on it; if
another site needs an older version, use nvm for this one instead):

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs
```

Pick the port the website will listen on. It must be one no other site on the server uses:

```bash
ss -ltnp | grep -E ':(3000|3001|3002) '   # no output = free
```

## 2. Create the database

Make a password, then create the database and a user for it:

```bash
openssl rand -hex 24     # use this as the database password
mysql -u root -p
```

```sql
CREATE DATABASE vrh CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'vrh'@'127.0.0.1' IDENTIFIED BY 'THE_DATABASE_PASSWORD';
GRANT ALL PRIVILEGES ON vrh.* TO 'vrh'@'127.0.0.1';
EXIT;
```

## 3. Get the code

Give the server read-only access to the GitHub repository with a deploy key:

```bash
ssh-keygen -t ed25519 -N "" -C "vrh website deploy" -f ~/.ssh/vrh_website
cat ~/.ssh/vrh_website.pub
```

Add that key in GitHub: the repository's **Settings → Deploy keys → Add deploy key** (leave write access off). Then:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-vrh-website
  HostName github.com
  User git
  IdentityFile ~/.ssh/vrh_website
EOF

cd /var/www/vacationrentalhotline
git clone git@github-vrh-website:Mohit-211/vacationrentalhotline.git website
```

## 4. Configure

```bash
cd /var/www/vacationrentalhotline/website
cp .env.example .env
chmod 600 .env
openssl rand -hex 32     # use this as BETTER_AUTH_SECRET
nano .env
```

Set these in `.env` (`.env.example` explains each one):

```bash
APP_URL=https://vacationrentalhotline.com
ADMIN_APP_ORIGIN=https://admin.vacationrentalhotline.com
PORT=3000                                    # the free port from step 1
DATABASE_URL=mysql://vrh:THE_DATABASE_PASSWORD@127.0.0.1:3306/vrh
BETTER_AUTH_SECRET=THE_64_CHARACTER_HEX_SECRET

MAIL_TRANSPORT=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
EMAIL_FROM="Vacation Rental Hotline <no-reply@vacationrentalhotline.com>"
STAFF_EMAIL=info@vacationrentalhotline.com

NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...              # from step 9; fill in then, and restart

SCHEDULED_JOBS=on
```

- `APP_URL` must be exactly the address people use, `https://` and no trailing slash. Sign-in and forms are refused
  from any other address, so step 8 sends `www.` to it.
- The website reads `.env` only. Don't use `.env.production`: the database scripts don't read it.
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` is built into the pages. After changing it, rebuild (step 5).

## 5. Install, build and set up the database

```bash
cd /var/www/vacationrentalhotline/website
npm ci
npm run build
npm run db:migrate
npm run admin:create -- --email you@example.com --name "Your Name"
```

`admin:create` prints the first admin's password once; keep it. If the build stops with an out-of-memory error, the
server needs more memory or a swap file.

## 6. Start the website

```bash
pm2 start ecosystem.config.cjs
pm2 save
curl -sI http://127.0.0.1:3000 | head -1    # use your PORT; expect HTTP/1.1 200 OK
```

If pm2 isn't already set to start at boot (other sites on the server may have done this), run `pm2 startup` once
and the command it prints. Once per server, add log rotation so logs don't grow without limit:

```bash
pm2 install pm2-logrotate
```

The website listens on 127.0.0.1 only, so it can be reached only through nginx. Its logs are in
`storage/logs/website-out.log` and `website-error.log`.

## 7. nginx

Point the domain's DNS A records (`vacationrentalhotline.com` and `www`) at this server. This is the switch-over:
from then on visitors reach this server (customers sign up again; nothing moves from the old site). Then create
`/etc/nginx/sites-available/vacationrentalhotline.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name vacationrentalhotline.com www.vacationrentalhotline.com;

    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:3000;            # your PORT
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        # The visitor's own address: sign-in limits are per visitor. Overwrite
        # the header so visitors can't send their own.
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/vacationrentalhotline.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 8. HTTPS

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d vacationrentalhotline.com -d www.vacationrentalhotline.com
```

Certbot adds the certificate to the file and sends `http://` to `https://`. Then send `www.` to the main address.
In `/etc/nginx/sites-available/vacationrentalhotline.conf`, add this as the first line inside the server block that
now has `listen 443 ssl`:

```nginx
if ($host = www.vacationrentalhotline.com) { return 301 https://vacationrentalhotline.com$request_uri; }
```

```bash
nginx -t && systemctl reload nginx
```

Certbot renews the certificate by itself; `certbot renew --dry-run` checks that renewal works.

## 9. Stripe

In Stripe's dashboard, in live mode:

1. **Developers → Webhooks → Add endpoint**: `https://vacationrentalhotline.com/api/webhooks/stripe`, API version
   `2026-11-18.endive`, with the events `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted` and `charge.refunded`.
2. Copy the endpoint's signing secret into `.env` as `STRIPE_WEBHOOK_SECRET`, then `pm2 restart vrh-website`.
3. **Settings → Billing → Subscriptions and emails**: keep Smart Retries on, and when all retries fail, **cancel the
   subscription**.
4. Optional: turn off Stripe's own "successful payments" emails; the website sends its own receipts.

## 10. Check it works

- Open the site. Sign up: the verification email should arrive (that checks SMTP).
- Sign in, add a property, and check the dashboard lists it as inactive.
- The admin account from step 5 is for the admin panel, deployed separately; set its address in `ADMIN_APP_ORIGIN`.
- After the first real payment, the Stripe webhook should show successful deliveries.

```bash
pm2 status
tail -n 50 /var/www/vacationrentalhotline/storage/logs/website-error.log
```

## Updating to a new version

```bash
cd /var/www/vacationrentalhotline/website
git pull
npm ci
npm run build
npm run db:migrate
pm2 reload vrh-website
```

Pages may error for a moment while the build replaces the old one. To go back to an earlier version, check out that
commit (`git log --oneline` lists them) and run the same commands; database changes aren't undone, and older code
ignores the newer columns.

## Backups (recommended)

A nightly database dump, kept for two weeks. Put the database login in `/root/.my.cnf`:

```ini
[mysqldump]
user=vrh
password=THE_DATABASE_PASSWORD
host=127.0.0.1
```

```bash
chmod 600 /root/.my.cnf
mkdir -p /var/backups/vrh
crontab -e
```

```cron
15 3 * * * mysqldump --single-transaction --no-tablespaces vrh | gzip > /var/backups/vrh/vrh-$(date +\%F).sql.gz && find /var/backups/vrh -name '*.sql.gz' -mtime +14 -delete
```

Copy the backups off the server now and then, too.
