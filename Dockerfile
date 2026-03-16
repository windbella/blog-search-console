FROM node:22-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:client && pnpm build:server

# --- 런타임 ---
FROM node:22-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# 전체 의존성 설치 (폴러가 vite-node 필요)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 빌드 결과물 (서버 + 클라이언트)
COPY --from=build /app/dist ./dist

# 소스 (폴러 실행용)
COPY src ./src
COPY tsconfig.json vite.config.ts ./

# 시드 데이터 (data/는 볼륨 마운트되므로 루트에 배치)
COPY seed.json ./seed.json

RUN mkdir -p /app/data

EXPOSE 3000

# 시작 스크립트
COPY start.sh ./
RUN chmod +x start.sh

# 서버(빌드) + 폴러(vite-node) 동시 실행
CMD ["./start.sh"]
