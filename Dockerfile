FROM node:22-alpine

WORKDIR /app

# 루트 package.json (workspaces 정의)
COPY package.json ./

# 각 앱 package.json
COPY apps/api/package.json ./apps/api/
COPY apps/mobile-web/package.json ./apps/mobile-web/
COPY apps/admin-web/package.json ./apps/admin-web/

# 의존성 설치 (production only)
RUN npm install --omit=dev

# 소스 복사
COPY apps/ ./apps/

EXPOSE 3100

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3100/health || exit 1

CMD ["node", "apps/api/src/server.js"]
