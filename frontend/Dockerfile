FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY public/ ./public/
COPY src/ ./src/

# Build args for runtime config
ARG REACT_APP_API_URL
ARG REACT_APP_API_KEY
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_API_KEY=$REACT_APP_API_KEY

# Copy .env.local if present (overrides build args)
COPY .env.local* ./

# Build the React app
RUN npm run build

# Production stage: serve the built app
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/build ./build

RUN npm install -g serve@14

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
