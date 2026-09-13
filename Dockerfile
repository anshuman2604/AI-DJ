# Multi-Stage Dockerfile for 100% Free Cloud Hosting
# Stage 1: Build the React / Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Python Backend with ffmpeg for YouTube audio streaming
FROM python:3.11-slim
WORKDIR /app

# Install ffmpeg for yt-dlp audio decoding and stream handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code and built frontend
COPY server/ ./server/
COPY --from=frontend-builder /app/dist ./dist

# Create audio cache directory
RUN mkdir -p /app/server/audio_cache && chmod 777 /app/server/audio_cache

ENV PORT=7860
EXPOSE 7860

# Run FastAPI serving both API routes and built React frontend
CMD ["sh", "-c", "uvicorn server.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
