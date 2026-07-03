# --- Base Stage ---
FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# --- Development Stage ---
FROM base AS development
RUN npm install

# --- Production Stage ---
FROM base AS production
RUN npm ci --only=production
COPY . .
CMD ["node", "app.js"]
