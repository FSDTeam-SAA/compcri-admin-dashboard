#!/usr/bin/env bash
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then echo 'This reviewed activation requires root for Nginx only.' >&2; exit 1; fi
source_config=/var/www/auroxday-deploy/nginx-admin-ip.conf
target_config=/etc/nginx/sites-available/auroxday-admin-ip
enabled_config=/etc/nginx/sites-enabled/auroxday-admin-ip
if [ -e "$target_config" ] || [ -L "$enabled_config" ] || [ -e "$enabled_config" ]; then
  echo 'The target config already exists; refusing to overwrite an unreviewed configuration.' >&2
  exit 1
fi
nginx -t
install -m 644 "$source_config" "$target_config"
ln -s "$target_config" "$enabled_config"
if ! nginx -t; then
  unlink "$enabled_config"
  echo 'Nginx validation failed. Running server was not reloaded.' >&2
  exit 1
fi
systemctl reload nginx
echo 'Admin IP routing activated.'
curl -fsS -o /dev/null -w 'ADMIN_LOGIN_HTTP:%{http_code}\n' -H 'Host: 2.25.68.237' http://127.0.0.1/admin/login
