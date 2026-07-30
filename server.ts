import express from "express";
import path from "path";
import "dotenv/config";
import { initTelegram } from "./server/backendCore";
import { apiRouter } from "./server/routes";

const app = express();
const PORT = Number(process.env.PORT) || 3000;


// initTelegram removed from here for Vercel compatibility

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get("/api/test", (req, res) => {
  res.json({ 
    ok: true, 
    vercel: !!process.env.VERCEL, 
    env: process.env.NODE_ENV,
    hasSupabase: !!process.env.SUPABASE_URL,
    hasSuperadmin: !!process.env.SUPERADMIN_USERNAME
  });
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.use("/api", apiRouter);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Vite middleware for development or static serving
if (process.env.NODE_ENV !== "production") {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    }).catch((err) => {
      console.error("Vite server middleware error:", err);
    });
  }).catch((err) => {
    console.error("Failed to load vite:", err);
  });
} else if (!process.env.VERCEL) {
  // Static serving only if NOT on Vercel
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  initTelegram();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

