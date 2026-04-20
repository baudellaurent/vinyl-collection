FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source
COPY src/ ./src/

EXPOSE 3001

CMD ["node", "src/index.js"]
