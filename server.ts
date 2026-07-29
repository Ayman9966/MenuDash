import express from "express";
import path from "path";
import * as dotenv from "dotenv";
import { 
  startTelegramPolling, 
  handleTelegramCommand 
} from "./bot/telegramBot";
import { supabase } from "./src/server/supabase";
import authRoutes from "./src/server/routes/auth";
import adminRoutes from "./src/server/routes/admin";
import restaurantRoutes from "./src/server/routes/restaurant";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// API Routes
app.get("/api/health", async (req, res) => {
  let dbStatus = "Checking...";
  try {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    dbStatus = error ? `Error: ${error.message}` : `Connected (Users: ${count})`;
  } catch (e: any) {
    dbStatus = `Failed: ${e.message}`;
  }

  res.json({ 
    status: "ok", 
    database: dbStatus,
    supabaseConfigured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

// Telegram Webhook Endpoint
app.post("/api/telegram-webhook", async (req, res) => {
  try {
    const update = req.body;
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      await handleTelegramCommand(supabase, chatId, text);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ ok: false });
  }
});

// Mount modular routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurant", restaurantRoutes);

// Telegram Bot Long Polling - Only if NOT on Vercel
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  startTelegramPolling(supabase);
} else {
  console.log('🚀 Running in Serverless/Vercel: Long polling disabled. Ensure webhooks are configured.');
}

// Vite middleware for development / Production static serving
async function setupFrontend() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupFrontend();

if (process.env.NODE_ENV !== "production" || process.env.VITE_DEV) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
export default app;
