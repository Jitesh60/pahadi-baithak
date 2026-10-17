# Private library API: Node + yt-dlp + ffmpeg in one small image.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip ca-certificates \
 && pip3 install --no-cache-dir --break-system-packages "yt-dlp[default]" \
 && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY index.mjs ./
COPY lib ./lib

USER node
ENV NODE_ENV=production PORT=8787
EXPOSE 8787
CMD ["node", "index.mjs"]
