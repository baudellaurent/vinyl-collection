FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY public/ ./public/
COPY src/ ./src/

# Build the React app
RUN npm run build

# Production stage: serve the built app
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/build ./build

RUN npm install -g serve@14

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
