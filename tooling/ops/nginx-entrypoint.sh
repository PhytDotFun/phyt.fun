#!/bin/sh
set -e
mode="${NGINX_MODE:-staging}"
case "$mode" in
staging) cp /templates/staging.nginx.conf /etc/nginx/nginx.conf ;;
prod) cp /templates/prod.nginx.conf /etc/nginx/nginx.conf ;;
*)
    echo "invalid NGINX_MODE: $mode"
    exit 1
    ;;
esac
