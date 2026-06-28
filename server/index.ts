import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { initDb } from './db.js';
import { profileRouter } from './routes/profile.js';
import { questionRouter } from './routes/question.js';
import { gameRouter } from './routes/game.js';
import { rewardRouter } from './routes/reward.js';
import { settingsRouter } from './routes/settings.js';
import { backupRouter } from './routes/backup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
initDb();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api', profileRouter);
app.use('/api', questionRouter);
app.use('/api', gameRouter);
app.use('/api', rewardRouter);
app.use('/api', settingsRouter);
app.use('/api', backupRouter);

// Serve static files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback (Express 5 syntax)
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
const PORT = 3456;
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`\n  🎮 学科小勇士 服务已启动`);
  console.log(`  ─────────────────────────────`);
  console.log(`  本地访问:  http://localhost:${PORT}/#/play`);
  console.log(`  家长管理:  http://localhost:${PORT}/#/parent`);
  if (localIP) {
    console.log(`  局域网:    http://${localIP}:${PORT}/#/play`);
  }
  console.log(`\n`);
});

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '';
}
