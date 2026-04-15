FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ .
RUN npx ng build --configuration production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/client/browser ./browser
COPY client/serve.js ./
RUN npm install express@4 http-proxy-middleware@^2.0.6
EXPOSE 80
CMD ["node", "serve.js"]
