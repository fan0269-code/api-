# Tencent Cloud Deployment

This app is a static Vite build. Deploy the `dist/` directory to a Tencent Cloud CVM instance and serve it with Nginx.

## Prerequisites

- A Tencent Cloud CVM instance with SSH access.
- Nginx installed on the server.
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

## Configure Nginx

Copy `nginx-api-relay-console.conf` to the server and adjust:

- `server_name` to your domain or server IP.
- `root` to match `DEPLOY_PATH`.

Then enable and reload Nginx:

```bash
sudo cp nginx-api-relay-console.conf /etc/nginx/conf.d/api-relay-console.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Notes

- The app uses client-side routing, so the Nginx config includes `try_files $uri $uri/ /index.html`.
- This frontend currently uses mock data. A real API relay service would need a backend API, persistent storage, billing integration, and secret handling on the server side.
