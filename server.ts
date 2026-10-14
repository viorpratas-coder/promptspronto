import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  const CONFIG_PATH = path.resolve(__dirname, 'supabase-config.json');
  const PUBLIC_CONFIG_PATH = path.resolve(__dirname, 'public', 'supabase-config.json');

  // Read config from file or environment
  const readConfig = () => {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url, anonKey: parsed.anonKey, updatedAt: parsed.updatedAt, source: 'server-file' };
        }
      }
      if (fs.existsSync(PUBLIC_CONFIG_PATH)) {
        const raw = fs.readFileSync(PUBLIC_CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url, anonKey: parsed.anonKey, updatedAt: parsed.updatedAt, source: 'public-file' };
        }
      }
    } catch (e) {
      console.warn('Failed reading server supabase config:', e);
    }

    const envUrl = (process.env.VITE_SUPABASE_URL || '').trim();
    const envKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    if (envUrl && envKey && !envUrl.includes('seu-projeto') && !envUrl.includes('your-project')) {
      return { url: envUrl, anonKey: envKey, source: 'env' };
    }

    return { url: '', anonKey: '', source: 'none' };
  };

  // API Route to fetch active global Supabase credentials
  app.get('/api/supabase-config', (_req, res) => {
    const config = readConfig();
    res.json(config);
  });

  // API Route to save global Supabase credentials (persisted for all visitors/incognito)
  app.post('/api/supabase-config', (req, res) => {
    const { url, anonKey } = req.body || {};
    if (!url || !anonKey) {
      return res.status(400).json({ error: 'URL e Anon Key são obrigatórios.' });
    }

    try {
      const payload = {
        url: String(url).trim(),
        anonKey: String(anonKey).trim(),
        updatedAt: new Date().toISOString(),
      };

      // Write to root
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(payload, null, 2), 'utf-8');

      // Ensure public dir exists and write
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(PUBLIC_CONFIG_PATH, JSON.stringify(payload, null, 2), 'utf-8');

      // Update current process env
      process.env.VITE_SUPABASE_URL = payload.url;
      process.env.VITE_SUPABASE_ANON_KEY = payload.anonKey;

      return res.json({
        success: true,
        message: 'Configuração salva globalmente. Disponível para todas as sessões e aba anônima!',
        config: payload,
      });
    } catch (err: any) {
      console.error('Error saving supabase config:', err);
      return res.status(500).json({ error: err.message || 'Falha ao salvar configuração no servidor.' });
    }
  });

  // API Route to clear global config
  app.delete('/api/supabase-config', (_req, res) => {
    try {
      if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
      if (fs.existsSync(PUBLIC_CONFIG_PATH)) fs.unlinkSync(PUBLIC_CONFIG_PATH);
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;
      return res.json({ success: true, message: 'Configuração global removida.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Integrate Vite or Serve Static build
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
