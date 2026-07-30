import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { initTelegram } from "./server/backendCore";

import healthHandler from "./api/health";
import telegramStatusHandler from "./api/admin/telegram-status";
import activatePlanHandler from "./api/admin/activate-plan";
import adminRestaurantsHandler from "./api/admin/restaurants";
import adminDeleteRestaurantHandler from "./api/admin/restaurants/[id]";
import registerHandler from "./api/auth/register";
import loginHandler from "./api/auth/login";
import meHandler from "./api/me";
import restaurantHandler from "./api/restaurant";
import menuSlugHandler from "./api/menu/[slug]";
import productsHandler from "./api/products";
import productItemHandler from "./api/products/[id]";
import categoriesHandler from "./api/categories";
import categoryItemHandler from "./api/categories/[id]";
import importCsvHandler from "./api/import-csv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  initTelegram();

  app.use(express.json({ limit: '10mb' }));

  app.get("/favicon.ico", (req, res) => res.status(204).end());

  app.get("/api/health", healthHandler);
  app.get("/api/admin/telegram-status", telegramStatusHandler);
  app.post("/api/admin/activate-plan", activatePlanHandler);
  app.get("/api/admin/restaurants", adminRestaurantsHandler);
  app.delete("/api/admin/restaurants/:id", (req, res) => {
    (req as any).query = { ...(req as any).query, id: req.params.id };
    return adminDeleteRestaurantHandler(req, res);
  });
  app.post("/api/auth/register", registerHandler);
  app.post("/api/auth/login", loginHandler);
  app.get("/api/me", meHandler);
  app.post("/api/restaurant", restaurantHandler);
  app.get("/api/menu/:slug", (req, res) => {
    (req as any).query = { ...(req as any).query, slug: req.params.slug };
    return menuSlugHandler(req, res);
  });
  app.all("/api/products", productsHandler);
  app.all("/api/products/:id", (req, res) => {
    (req as any).query = { ...(req as any).query, id: req.params.id };
    return productItemHandler(req, res);
  });
  app.post("/api/categories", categoriesHandler);
  app.delete("/api/categories/:id", (req, res) => {
    (req as any).query = { ...(req as any).query, id: req.params.id };
    return categoryItemHandler(req, res);
  });
  app.post("/api/import-csv", importCsvHandler);

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
