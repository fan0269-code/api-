# Tencent Cloud Deployment

This app is a static Vite build. Deploy the `dist/` directory to a Tencent Cloud CVM instance and serve it with Nginx.

## Prerequisites

- A Tencent Cloud CVM instance with SSH access.
- Nginx installed on the server.
- Node.js 22+ installed on the server for the API process.
- A server directory for the site, for example `/var/www/api-relay-console`.
- Optional: a domain name pointing to the server IP.

## Build Locally

```bash
npm install
npm run build
```

## Deploy With Rsync

Set the deployment variables and run the script:

```bash
export DEPLOY_HOST="your.server.ip"
export DEPLOY_USER="ubuntu"
export DEPLOY_PATH="/var/www/api-relay-console"
export DEPLOY_KEY="$HOME/.ssh/tencent-cloud.pem"

./deploy/tencent-cloud/deploy.sh
```

If your SSH key is already loaded in `ssh-agent`, omit `DEPLOY_KEY`.

You can also copy the environment template:

```bash
cp deploy/tencent-cloud/.env.example deploy/tencent-cloud/.env.local
```

Then load it before deploying:

```bash
set -a
source deploy/tencent-cloud/.env.local
set +a
npm run deploy:tencent
```

## Start Backend API

The deploy script uploads `server/` and `package.json` with the static `dist/` files. Start the API process on the server:

```bash
cd /var/www/api-relay-console
HOST=127.0.0.1 PORT=8787 npm run server
```

For production, run this command under a process manager such as systemd or pm2.

## Configure Nginx

Copy `nginx-api-relay-console.conf` to the server and adjust:

- `server_name` to your domain or server IP.
- `root` to match `DEPLOY_PATH`.
- `proxy_pass` port to match the API `PORT` if you changed it.

Then enable and reload Nginx:

```bash
sudo cp nginx-api-relay-console.conf /etc/nginx/conf.d/api-relay-console.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Notes

- The app uses client-side routing, so the Nginx config includes `try_files $uri $uri/ /index.html`.
- The API persists demo data in `server/data/db.json` on first start. Back up this file if you keep demo state between deployments.
