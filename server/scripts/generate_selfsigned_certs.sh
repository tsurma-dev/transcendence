#!/usr/bin/env bash
set -euo pipefail

# generate_selfsigned_certs.sh
# Creates a self-signed key and certificate under server/.env/key.pem and server/.env/cert.pem
# Usage: ./generate_selfsigned_certs.sh [CN] [DAYS]
# Examples:
#   ./generate_selfsigned_certs.sh            # CN=localhost, DAYS=365
#   ./generate_selfsigned_certs.sh example.com 3650

CN=${1:-localhost}
DAYS=${2:-365}
OUT_DIR=$(cd "$(dirname "$0")/.." && pwd)/.env
KEY="$OUT_DIR/key.pem"
CERT="$OUT_DIR/cert.pem"

mkdir -p "$OUT_DIR"

echo "Generating self-signed certificate for CN=$CN, valid for $DAYS days..."

openssl req -x509 -nodes -days "$DAYS" -newkey rsa:2048 \
  -keyout "$KEY" -out "$CERT" \
  -subj "/CN=$CN"

chmod 600 "$KEY" || true
chmod 644 "$CERT" || true

echo "Created:"
echo "  $KEY"
echo "  $CERT"

echo "\nTip: The project docker-compose maps ./server/.env into the container at /app/.env; the backend will load these files automatically."
