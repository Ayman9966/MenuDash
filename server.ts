import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { initTelegram } from "./server/backendCore";
import { apiRouter } from "./server/routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

initTelegram();

app.use(express.json({ limit: '10mb' }));

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.use("/api", apiRouter);

// Vite middleware for development or static serving
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
  }).catch((err) => {
    console.error("Vite server middleware error:", err);
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

