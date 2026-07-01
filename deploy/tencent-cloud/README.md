# Tencent Cloud Docker Compose Deployment

This deployment runs the React admin console as static files and uses sub2api as the production backend.

## Runtime Topology

- Nginx serves `dist/`.
- Nginx proxies `/api/` and sub2api gateway paths to `sub2api:8080` on localhost.
- Docker Compose runs `sub2api`, `postgres`, and `redis`.
- Data persists in local directories under `tencent-cloud/`: `data/`, `postgres_data/`, and `redis_data/`.

## Prepare CVM

Install Docker, Docker Compose v2, and Nginx on the Tencent Cloud CVM.

```bash
sudo mkdir -p /var/www/api-relay-console
sudo chown -R "$USER:$USER" /var/www/api-relay-console
```

Keep deploy assets and static files separated:

```text
/var/www/api-relay-console/
  dist/           # public static frontend
  tencent-cloud/  # docker compose, env, runtime data
```

## Configure Secrets

```bash
cd /var/www/api-relay-console/tencent-cloud
cp .env.example .env
```

Edit `.env` and set strong values for:

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `TOTP_ENCRYPTION_KEY`

Generate random secrets:

```bash
openssl rand -hex 32
```

## Deploy From Local Machine

```bash
export DEPLOY_HOST="your.server.ip"
export DEPLOY_USER="ubuntu"
export DEPLOY_PATH="/var/www/api-relay-console"
export DEPLOY_KEY="$HOME/.ssh/tencent-cloud.pem"

npm run deploy:tencent
```

Then copy and edit env on the server:

```bash
scp deploy/tencent-cloud/.env.example "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/tencent-cloud/.env"
ssh "$DEPLOY_USER@$DEPLOY_HOST"
cd /var/www/api-relay-console/tencent-cloud
vim .env
docker compose --env-file .env up -d
```

## Configure Nginx

```bash
sudo cp /var/www/api-relay-console/tencent-cloud/nginx-api-relay-console.conf /etc/nginx/conf.d/api-relay-console.conf
sudo nginx -t
sudo systemctl reload nginx
```

The config serves only `/var/www/api-relay-console/dist`, denies hidden and config-like files, and includes `underscores_in_headers on;`, which sub2api needs for clients that send headers such as `session_id`.

## Verify

```bash
cd /var/www/api-relay-console/tencent-cloud
docker compose --env-file .env ps
docker compose --env-file .env logs -f sub2api
curl http://127.0.0.1:8080/health
```

Open the public domain or CVM IP in a browser and log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Backup And Migration

Stop services before copying data:

```bash
cd /var/www/api-relay-console/tencent-cloud
docker compose --env-file .env down
tar czf sub2api-backup.tgz data postgres_data redis_data .env docker-compose.yml
```

Restore on another server by extracting the archive into the same deploy directory and running:

```bash
cd /var/www/api-relay-console/tencent-cloud
docker compose --env-file .env up -d
```

## Upgrade

```bash
cd /var/www/api-relay-console/tencent-cloud
docker compose --env-file .env pull
docker compose --env-file .env up -d
```

The React admin console can be upgraded independently by replacing `dist/` and reloading Nginx.
