# Restaurant Management & Order System

A comprehensive full-stack application designed for restaurant management, featuring a real-time admin dashboard, order processing, and Telegram bot integration.

## 🚀 Features

- **Admin Dashboard**: Real-time overview of restaurant operations, sales metrics, and active orders.
- **Order Management**: Streamlined workflow for receiving, processing, and completing customer orders.
- **Restaurant Plans**: Tiered subscription management for restaurant partners.
- **Telegram Integration**: Automated alerts for new users and administrative notifications via Telegram Bot.
- **Secure Authentication**: Robust user authentication using JWT and password hashing with bcrypt.
- **Cloud Persistence**: Scalable data storage powered by Supabase.

## 🛠️ Tech Stack

### Frontend
- **React 18**: Component-based UI development.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS**: Utility-first styling for a modern, responsive design.
- **Lucide React**: Clean and consistent iconography.
- **Framer Motion**: Smooth animations and transitions.

### Backend
- **Node.js & Express**: Scalable server-side logic and RESTful API.
- **Supabase**: Backend-as-a-Service for database and storage.
- **Telegram Bot API**: Real-time communication and administrative tools.
- **esbuild**: High-performance bundling for production deployments.

## 📁 Project Structure

```text
├── api/                # Vercel serverless functions entry point
├── public/             # Static assets
├── server/             # Backend source code
│   ├── backendCore.ts  # Database and core logic initialization
│   ├── routes.ts       # API endpoint definitions
│   └── telegramBot.ts  # Telegram bot handlers and services
├── src/                # Frontend source code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Full-page components (Dashboard, etc.)
│   └── lib/            # Utility functions and shared logic
├── server.ts           # Main Express server entry point
├── vercel.json         # Vercel deployment configuration
└── package.json        # Project dependencies and scripts
```

## ⚙️ Setup & Development

### Environment Variables
Create a `.env` file in the root directory and provide the following:
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.
- `JWT_SECRET`: Secret key for token signing.
- `TELEGRAM_BOT_TOKEN`: Token for your Telegram bot.
- `ADMIN_CHAT_ID`: The Telegram chat ID for administrative alerts.

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 🌐 Deployment

### Vercel (Serverless)
Best for static assets and high-traffic APIs. Note: The Telegram Bot polling is automatically disabled on Vercel to prevent function timeouts.

### Render (Recommended for Telegram Bot)
Render is recommended because it supports long-running Node.js processes, allowing the **Telegram Bot polling** to stay active.

**Setup Steps:**
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service**.
3. **Settings on Render Dashboard**:
   - **Root Directory**: (Leave empty)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add your **Environment Variables** in the Render Dashboard (under the 'Env' tab).
5. **Note**: If you see a `vite: not found` error, ensure your Build Command includes `npm install`.

**Troubleshooting Build Errors:**
- **"installnpm" error**: This usually happens if you accidentally typed something extra in the Render Dashboard. Ensure the Build Command is exactly `npm install && npm run build`.
- **"vite: not found"**: Ensure `npm install` is running before `npm run build`.
- **Node Version**: If you need a specific version, add an environment variable `NODE_VERSION` (e.g., `20`).
