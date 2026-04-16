FROM node:20-slim AS builder
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci
COPY server/tsconfig.json ./server/
COPY server/src/ ./server/src/
RUN cd server && npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY data/templates/ ./data/templates/
ENV NODE_ENV=production
ENV PORT=9000
ENV DATA_DIR=/app/data/templates
ENV DB_PATH=/app/data/prelegal.db
EXPOSE 9000
CMD ["node", "dist/index.js"]
