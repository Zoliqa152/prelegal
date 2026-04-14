import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = 3000;

app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:4201'] }));
app.use(express.json());

const dataDir = join(__dirname, '../../data/templates');
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`PreLegal server running on http://localhost:${PORT}`);
});
