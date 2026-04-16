import { config } from 'dotenv';
import { join, resolve } from 'path';
config({ path: resolve(__dirname, '../../.env') });
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import chatRouter from './chat';

const app = express();
const PORT = Number(process.env['PORT']) || 9000;

app.use(cors({ origin: ['http://localhost', 'http://localhost:4200', 'http://localhost:4201'] }));
app.use(express.json());

// SQLite database - created fresh each startup
const dbPath = process.env['DB_PATH'] ?? join(__dirname, '../../prelegal.db');
if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE users (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    email      TEXT     NOT NULL UNIQUE,
    password   TEXT     NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('Database initialized at', dbPath);

const dataDir = process.env['DATA_DIR'] ?? join(__dirname, '../../data/templates');
const index = JSON.parse(readFileSync(join(dataDir, 'index.json'), 'utf-8'));

app.get('/api/templates', (_req, res) => {
  res.json(index.templates);
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const entry = index.templates.find(
      (t: { id: string; file: string }) => t.id === req.params.id
    );

    if (!entry) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const template = JSON.parse(readFileSync(join(dataDir, entry.file), 'utf-8'));
    res.json(template);
  } catch (err) {
    console.error('Error reading template:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/chat', chatRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`PreLegal server running on http://localhost:${PORT}`);
});
