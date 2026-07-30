import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { initTelegram } from "./server/backendCore";
import { apiRouter } from "./server/routes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  initTelegram();

  app.use(express.json({ limit: '10mb' }));

  app.get("/favicon.ico", (req, res) => res.status(204).end());

  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
