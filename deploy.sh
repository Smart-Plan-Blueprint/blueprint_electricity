#!/usr/bin/env bash
# deploy.sh — deploy blueprint_electricity to 64.23.161.104
set -euo pipefail

SERVER="root@64.23.161.104"
REMOTE_APP="/var/www/blueprint_electricity"

echo "==> Building portal UI..."
cd ui
npm run build
cd ..

echo "==> Syncing to server..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='vendor/' \
  --exclude='node_modules/' \
  --exclude='ui/node_modules/' \
  --exclude='storage/logs/*' \
  --exclude='storage/framework/cache/*' \
  --exclude='storage/framework/sessions/*' \
  --exclude='storage/framework/views/*' \
  . "$SERVER:$REMOTE_APP/"

echo "==> Running remote tasks..."
ssh "$SERVER" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/blueprint_electricity

echo "  -> composer install..."
composer install --no-dev --optimize-autoloader --no-interaction

echo "  -> migrate..."
php artisan migrate --force

echo "  -> clear & rebuild caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "  -> fix permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "Done."
REMOTE

echo ""
echo "==> Deploy complete."
echo "    API:    http://64.23.161.104:8083"
echo "    Portal: http://64.23.161.104:8084"
