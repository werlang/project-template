# --- Base Stage ---
FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# --- Development Stage ---
FROM base AS development
RUN npm install

# --- Builder Stage ---
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# --- Production Stage ---
FROM base AS production
RUN npm ci --only=production
COPY . .
COPY --from=builder /app/public /app/public
CMD ["node", "app.js"]
