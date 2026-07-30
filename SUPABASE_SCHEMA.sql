-- FINAL IDEMPOTENT SCHEMA FOR MENUDASH
-- Use this script to update or initialize your database safely.
-- It handles existing tables and adds missing columns automatically.

-- 1. Create Tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('admin', 'owner', 'customer')),
  restaurant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  logo_url TEXT,
  cover_url TEXT,
  description TEXT,
  whatsapp_number TEXT,
  address TEXT,
  currency TEXT DEFAULT 'USD' NOT NULL,
  plan TEXT DEFAULT 'free' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  template TEXT DEFAULT 'list' NOT NULL,
  languages TEXT DEFAULT 'en' NOT NULL,
  default_language TEXT DEFAULT 'en' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add missing columns to existing tables safely
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='plan_expires_at') THEN
    ALTER TABLE restaurants ADD COLUMN plan_expires_at TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='languages') THEN
    ALTER TABLE restaurants ADD COLUMN languages TEXT DEFAULT 'en' NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='default_language') THEN
    ALTER TABLE restaurants ADD COLUMN default_language TEXT DEFAULT 'en' NOT NULL;
  END IF;
END $$;

-- 3. Disable Row Level Security (RLS) for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
