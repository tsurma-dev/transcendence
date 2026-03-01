FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Copy only package files first to install deps
COPY server/package.json server/package-lock.json* ./server/
COPY server/backend/package.json server/backend/package-lock.json* ./server/backend/
COPY server/frontend/package.json server/frontend/package-lock.json* ./server/frontend/

# Install frontend dev deps and build frontend
WORKDIR /app/server/frontend
# Install build dependencies needed for native modules and tooling
RUN apt-get update && apt-get install -y --no-install-recommends \
		python3 \
		build-essential \
		libsqlite3-dev \
		pkg-config \
		ca-certificates \
		git \
	&& rm -rf /var/lib/apt/lists/*

RUN npm ci --silent
COPY server/frontend ./
# Copy the top-level shared folder into the image at /app/server/shared so Vite can resolve @shared
COPY server/shared /app/server/shared
RUN npm run build

# Install backend deps (production)
WORKDIR /app/server/backend
RUN npm ci --production --silent
COPY server/backend ./

# Final image
FROM node:20-bullseye-slim
WORKDIR /app

# Copy built frontend and backend from builder
COPY --from=builder /app/server /app/server

# Copy .env (certs) if present in host; user should mount or provide certs
# we copy into /app/server/.env so paths in the server code (../../.env) resolve correctly
COPY server/.env /app/server/.env

ENV NODE_ENV=production
EXPOSE 8443

WORKDIR /app
CMD ["npm", "run", "start", "--prefix", "server"]
