const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;
const BACKEND = process.env.BACKEND_URL || 'http://backend:9000';

// Proxy /api requests to the backend container
app.use(createProxyMiddleware('/api', {
  target: BACKEND,
  changeOrigin: true,
}));

// Serve the Angular static build
app.use(express.static(path.join(__dirname, 'browser')));

// SPA fallback - all non-API routes return index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'browser', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server on port ${PORT}, proxying API to ${BACKEND}`);
});
