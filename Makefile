# Makefile for local deployment using docker-compose
# Usage:
#   make up       # generate certs, build images and start services (detached)
#   make build    # build images only
#   make down     # stop and remove containers & volumes
#   make logs     # follow logs
#   make exec     # open a shell in the app container
#
.PHONY: all generate-certs build up start stop down logs exec clean

all: up

generate-certs:
	@echo "Ensuring generate_selfsigned_certs.sh is executable..."
	chmod +x server/scripts/generate_selfsigned_certs.sh || true
	@echo "Generating self-signed certificates (CN=localhost)..."
	./server/scripts/generate_selfsigned_certs.sh localhost 365

	@# Ensure server/shared exists (copy from top-level shared) so Dockerfile can COPY it from server/
	@if [ ! -d server/shared ]; then \
	  echo "Copying top-level shared/ into server/shared for docker build context..."; \
	  cp -a shared server/shared; \
	fi

build:
	@echo "Building docker images..."
	docker compose build --pull --no-cache

up: generate-certs
	@echo "Starting services with docker-compose..."
	docker compose up -d --build

start: up

logs:
	@echo "Tailing docker-compose logs (press Ctrl+C to stop)..."
	docker compose logs -f

exec:
	@echo "Opening a shell in the 'app' service (sh)."
	docker compose exec app sh

down:
	@echo "Stopping and removing containers and anonymous volumes..."
	docker compose down -v

clean:
	@echo "Removing built images (local only)..."
	docker image rm transcendence_app:latest || true
