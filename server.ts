import express from "express";
import path from "path";
import { createClient } from '@supabase/supabase-js';
import Papa from "papaparse";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import {
  startTelegramPolling,
  sendNewUserAlert,
  updateRestaurantPlan,
  getAdminChatCount
} from "./server/telegramBot";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kubesezuhxgcpoannvuq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmVzZXp1aHhnY3BvYW5udnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNjU2NDcsImV4cCI6MjEwMDg0MTY0N30.5atpopWwhJuiOJHHEkXRm3yp-eIFHLisbJX4blsRdeE';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Use service role key if available for backend to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Format restaurant and determine active plan based on expiration date
function formatRestaurant(restaurant: any) {
  if (!restaurant) return null;
  const rawPlan = restaurant.plan || 'free';
  let planExpiresAt: string | null = null;
  let effectivePlan: 'free' | 'premium' = 'free';

  if (typeof rawPlan === 'string' && rawPlan.includes(':')) {
    const parts = rawPlan.split(':');
    const planType = parts[0].toLowerCase();
    const datePart = parts[1];
    if (planType === 'pro' || planType === 'premium') {
      planExpiresAt = datePart;
    }
  } else if (rawPlan === 'premium' || rawPlan === 'pro') {
    effectivePlan = 'premium';
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawPlan)) {
    planExpiresAt = rawPlan;
  }

  if (planExpiresAt) {
    // Check if date is in the future relative to UTC end of day
    const expDate = new Date(planExpiresAt + 'T23:59:59Z');
    if (!isNaN(expDate.getTime()) && expDate.getTime() > Date.now()) {
      effectivePlan = 'premium';
    } else {
      effectivePlan = 'free'; // If date expired, revert to free plan!
    }
  }

  return {
    ...restaurant,
    ownerId: restaurant.owner_id || restaurant.ownerId,
    whatsappNumber: restaurant.whatsapp_number || restaurant.whatsappNumber,
    logoUrl: restaurant.logo_url || restaurant.logoUrl,
    coverUrl: restaurant.cover_url || restaurant.coverUrl,
    languages: restaurant.languages || 'en',
    defaultLanguage: restaurant.default_language || restaurant.defaultLanguage || 'en',
    plan: effectivePlan,
    planExpiresAt: planExpiresAt,
    rawPlan: rawPlan
  };
}

// Helper function to ensure a user has an attached restaurant and restaurant_id is set
async function ensureUserRestaurant(user: any) {
  try {
    let restaurant = null;

    // Check if user already has a restaurant_id linked
    if (user.restaurant_id) {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', user.restaurant_id)
        .maybeSingle();
      restaurant = data;
    }

    // Otherwise check by owner_id
    if (!restaurant) {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      restaurant = data;
    }

    // If still no restaurant, create a default restaurant for this user
    if (!restaurant) {
      const cleanUsername = (user.username || 'My Restaurant').trim();
      const baseSlug = cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'restaurant';
      const uniqueSlug = `${baseSlug}-${Math.floor(Math.random() * 89999 + 10000)}`;

      const { data: newRest, error: restError } = await supabase
        .from('restaurants')
        .insert([{
          name: `${cleanUsername}'s Restaurant`,
          slug: uniqueSlug,
          owner_id: user.id,
          description: 'Welcome to our digital menu!',
          whatsapp_number: '',
          address: '',
          currency: 'USD',
          template: 'list'
        }])
        .select()
        .maybeSingle();

      if (!restError && newRest) {
        restaurant = newRest;
      }
    }

    // Link restaurant_id on user record if missing or mismatched
    if (restaurant && user.restaurant_id !== restaurant.id) {
      await supabase
        .from('users')
        .update({ restaurant_id: restaurant.id })
        .eq('id', user.id);
      user.restaurant_id = restaurant.id;
    }

    return { user, restaurant: formatRestaurant(restaurant) };
  } catch (err) {
    console.error('Error in ensureUserRestaurant:', err);
    return { user, restaurant: null };
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

if (!process.env.VERCEL) {
  startTelegramPolling(supabase);
}

app.use(express.json({ limit: '10mb' }));

  // Middleware to verify JWT
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const superadminOnly = async (req: any, res: any, next: any) => {
    await authenticate(req, res, () => {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Superadmin access required' });
      }
      next();
    });
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", supabaseConnected: !!SUPABASE_URL, telegramAdmins: getAdminChatCount() });
  });

  // SuperAdmin: Telegram Bot Status & Info
  app.get("/api/admin/telegram-status", superadminOnly, (req, res) => {
    res.json({
      botUsername: 'menuquickadmin_bot',
      adminChatCount: getAdminChatCount(),
      instructions: 'Send /start or <restaurant_id>-YYYY-MM-DD to @menuquickadmin_bot in Telegram'
    });
  });

  // SuperAdmin: Activate/Update Plan directly via API
  app.post("/api/admin/activate-plan", superadminOnly, async (req, res) => {
    const { restaurantId, expireDate } = req.body;
    if (!restaurantId || !expireDate) {
      return res.status(400).json({ error: 'restaurantId and expireDate (YYYY-MM-DD or "free") are required' });
    }
    const result = await updateRestaurantPlan(supabase, restaurantId, expireDate);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  // SuperAdmin: List all restaurants & users
  app.get("/api/admin/restaurants", superadminOnly, async (req, res) => {
    try {
      const { data: list, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          categories:categories(count),
          products:products(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedList = list.map(r => ({
        ...formatRestaurant(r),
        categoryCount: r.categories?.[0]?.count || 0,
        productCount: r.products?.[0]?.count || 0
      }));

      res.json(formattedList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // SuperAdmin: Delete Restaurant
  app.delete("/api/admin/restaurants/:id", superadminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete products first (Cascade)
      await supabase.from('products').delete().eq('restaurant_id', id);
      // Delete categories
      await supabase.from('categories').delete().eq('restaurant_id', id);
      // Delete restaurant
      const { error } = await supabase.from('restaurants').delete().eq('id', id);

      if (error) throw error;
      res.json({ success: true, message: 'Restaurant and all associated data deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Register
  app.post("/api/auth/register", async (req, res) => {
    const { username, password, phone } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const trimmedUsername = username.trim();
    const trimmedPhone = phone ? phone.trim() : null;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { data: user, error } = await supabase
        .from('users')
        .insert([{ 
          username: trimmedUsername, 
          password: hashedPassword, 
          phone: trimmedPhone,
          role: 'owner' 
        }])
        .select()
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Username or phone number already exists' });
        }
        return res.status(400).json({ error: error.message });
      }

      if (!user) {
        return res.status(500).json({ error: 'Failed to create user record' });
      }

      // Auto-create restaurant & link restaurant_id
      const { user: updatedUser, restaurant } = await ensureUserRestaurant(user);

      // 🔔 Send Telegram Alert to SuperAdmin for new registration!
      sendNewUserAlert({
        username: updatedUser.username,
        phone: updatedUser.phone,
        userId: updatedUser.id,
        restaurantName: restaurant?.name,
        restaurantId: restaurant?.id,
        restaurantSlug: restaurant?.slug,
        createdAt: user.created_at || new Date().toISOString()
      }).catch(err => console.error('Telegram alert trigger error:', err));
      
      const token = jwt.sign({ uid: updatedUser.id, username: updatedUser.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user: updatedUser, restaurant, token });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const inputVal = username.trim();

    // 🛡️ Check for Superadmin (System Owner) credentials first
    const SUPERADMIN_USER = process.env.SUPERADMIN_USERNAME;
    const SUPERADMIN_PASS = process.env.SUPERADMIN_PASSWORD;

    if (SUPERADMIN_USER && SUPERADMIN_PASS && inputVal === SUPERADMIN_USER && password === SUPERADMIN_PASS) {
      const superUser = {
        id: 'superadmin-id',
        username: SUPERADMIN_USER,
        role: 'superadmin'
      };
      const token = jwt.sign({ uid: superUser.id, username: superUser.username, role: 'superadmin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: superUser, restaurant: null, token });
    }

    try {
      // Find user by username OR phone
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.${inputVal},phone.ilike.${inputVal}`)
        .maybeSingle();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid username/phone or password' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username/phone or password' });
      }

      // Ensure user has a restaurant created and linked
      const { user: updatedUser, restaurant } = await ensureUserRestaurant(user);
      
      const token = jwt.sign({ uid: updatedUser.id, username: updatedUser.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user: updatedUser, restaurant, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed due to server error' });
    }
  });

  // Get current user profile and restaurant
  app.get("/api/me", authenticate, async (req: any, res) => {
    // 🛡️ Handle Superadmin session
    if (req.user.role === 'superadmin') {
      return res.json({ 
        user: { id: req.user.uid, username: req.user.username, role: 'superadmin' }, 
        restaurant: null 
      });
    }

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.uid)
        .maybeSingle();

      if (userError || !user) return res.status(404).json({ error: 'User not found' });
      
      const { user: updatedUser, restaurant } = await ensureUserRestaurant(user);

      res.json({ user: updatedUser, restaurant });
    } catch (error) {
      console.error('Me endpoint error:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Create/Update restaurant
  app.post("/api/restaurant", authenticate, async (req: any, res) => {
    const { name, slug, description, whatsappNumber, address, currency, template, languages, defaultLanguage } = req.body;
    try {
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', req.user.uid)
        .maybeSingle();
      
      // Check slug uniqueness
      if (slug) {
        const { data: slugCheck } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (slugCheck && (!existing || slugCheck.id !== existing.id)) {
          return res.status(400).json({ error: 'This menu URL slug is already taken by another restaurant. Please choose a different one.' });
        }
      }

      let restaurantData;

      if (existing) {
        const { data: updated, error } = await supabase
          .from('restaurants')
          .update({ 
            name, 
            slug, 
            description, 
            whatsapp_number: whatsappNumber, 
            address, 
            currency, 
            template,
            languages: languages || 'en',
            default_language: defaultLanguage || 'en'
          })
          .eq('id', existing.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        restaurantData = updated;
      } else {
        const { data: created, error } = await supabase
          .from('restaurants')
          .insert([{
            name,
            slug,
            owner_id: req.user.uid,
            description,
            whatsapp_number: whatsappNumber,
            address,
            currency,
            template,
            languages: languages || 'en',
            default_language: defaultLanguage || 'en'
          }])
          .select()
          .maybeSingle();
        if (error) throw error;
        restaurantData = created;
      }

      // Explicitly update restaurant_id in users table
      if (restaurantData) {
        await supabase
          .from('users')
          .update({ restaurant_id: restaurantData.id })
          .eq('id', req.user.uid);
      }

      res.json(formatRestaurant(restaurantData));
    } catch (error: any) {
      console.error('Save restaurant error:', error);
      const errMessage = error?.message || error?.details || (typeof error === 'object' ? JSON.stringify(error) : String(error)) || 'Failed to save restaurant';
      res.status(500).json({ error: errMessage });
    }
  });

  // Public Menu Route
  app.get("/api/menu/:slug", async (req, res) => {
    const { slug } = req.params;
    try {
      const { data: restaurant, error: resError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (resError || !restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      const { data: menuCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('order', { ascending: true });
      
      const { data: menuProducts } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      const formattedRest = formatRestaurant(restaurant);

      res.json({ 
        restaurant: formattedRest, 
        categories: menuCategories?.map((c: any) => ({
          ...c,
          restaurantId: c.restaurant_id
        })) || [], 
        products: menuProducts?.map((p: any) => ({
          ...p,
          restaurantId: p.restaurant_id,
          categoryId: p.category_id,
          imageUrl: p.image_url,
          isAvailable: p.is_available ?? true,
          isFeatured: p.is_featured ?? false
        })) || []
      });
    } catch (error) {
      console.error('Fetch public menu error:', error);
      res.status(500).json({ error: 'Failed to fetch menu' });
    }
  });

  // Fetch Dashboard Products & Categories
  app.get("/api/products", authenticate, async (req: any, res) => {
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', req.user.uid)
        .maybeSingle();

      if (!restaurant) {
        return res.json({ categories: [], products: [] });
      }

      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('order', { ascending: true });

      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      res.json({
        categories: categories?.map((c: any) => ({
          ...c,
          restaurantId: c.restaurant_id
        })) || [],
        products: products?.map((p: any) => ({
          ...p,
          restaurantId: p.restaurant_id,
          categoryId: p.category_id,
          imageUrl: p.image_url,
          isAvailable: p.is_available ?? true,
          isFeatured: p.is_featured ?? false
        })) || []
      });
    } catch (error: any) {
      console.error('Fetch products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Create Product
  app.post("/api/products", authenticate, async (req: any, res) => {
    const { categoryId, name, description, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, price, imageUrl, isAvailable, isFeatured } = req.body;
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', req.user.uid)
        .maybeSingle();

      if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

      const { data: product, error } = await supabase
        .from('products')
        .insert([{
          restaurant_id: restaurant.id,
          category_id: categoryId,
          name: name || nameEn || nameFr || nameAr || '',
          description: description || descriptionEn || descriptionFr || descriptionAr || '',
          name_en: nameEn || name || '',
          name_fr: nameFr || '',
          name_ar: nameAr || '',
          description_en: descriptionEn || description || '',
          description_fr: descriptionFr || '',
          description_ar: descriptionAr || '',
          price: parseFloat(price) || 0,
          image_url: imageUrl || '',
          is_available: isAvailable !== false,
          is_featured: isFeatured === true
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      res.json({
        ...product,
        restaurantId: product.restaurant_id,
        categoryId: product.category_id,
        imageUrl: product.image_url,
        isAvailable: product.is_available,
        isFeatured: product.is_featured,
        nameEn: product.name_en,
        nameFr: product.name_fr,
        nameAr: product.name_ar,
        descriptionEn: product.description_en,
        descriptionFr: product.description_fr,
        descriptionAr: product.description_ar
      });
    } catch (error: any) {
      console.error('Create product error:', error);
      res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  });

  // Update Product
  app.put("/api/products/:id", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const { categoryId, name, description, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, price, imageUrl, isAvailable, isFeatured } = req.body;
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', req.user.uid)
        .maybeSingle();

      if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

      const { data: product, error } = await supabase
        .from('products')
        .update({
          category_id: categoryId,
          name: name || nameEn || nameFr || nameAr || '',
          description: description || descriptionEn || descriptionFr || descriptionAr || '',
          name_en: nameEn || name || '',
          name_fr: nameFr || '',
          name_ar: nameAr || '',
          description_en: descriptionEn || description || '',
          description_fr: descriptionFr || '',
          description_ar: descriptionAr || '',
          price: parseFloat(price) || 0,
          image_url: imageUrl,
          is_available: isAvailable,
          is_featured: isFeatured
        })
        .eq('id', id)
        .eq('restaurant_id', restaurant.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      res.json({
        ...product,
        restaurantId: product.restaurant_id,
        categoryId: product.category_id,
        imageUrl: product.image_url,
        isAvailable: product.is_available,
        isFeatured: product.is_featured,
        nameEn: product.name_en,
        nameFr: product.name_fr,
        nameAr: product.name_ar,
        descriptionEn: product.description_en,
        descriptionFr: product.description_fr,
        descriptionAr: product.description_ar
      });
    } catch (error: any) {
      console.error('Update product error:', error);
      res.status(500).json({ error: error.message || 'Failed to update product' });
    }
  });

  // Delete Product
  app.delete("/api/products/:id", authenticate, async (req: any, res) => {
    const { id } = req.params;
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', req.user.uid)
        .maybeSingle();

      if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurant.id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
  });

  // Create Category
  app.post("/api/categories", authenticate, async (req: any, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', req.user.uid)
        .maybeSingle();

      if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

      const { data: cat, error } = await supabase
        .from('categories')
        .insert([{
          restaurant_id: restaurant.id,
          name: name.trim(),
          order: 0
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      res.json({
        ...cat,
        restaurantId: cat.restaurant_id
      });
    } catch (error: any) {
      console.error('Create category error:', error);
      res.status(500).json({ error: error.message || 'Failed to create category' });
    }
  });

  // Delete Category
  app.delete("/api/categories/:id", authenticate, async (req: any, res) => {
    const { id } = req.params;
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', req.user.uid)
        .maybeSingle();

      if (!restaurant) return res.status(400).json({ error: 'Restaurant not found' });

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurant.id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete category' });
    }
  });

  // CSV / Excel Import
  app.post("/api/import-csv", authenticate, async (req: any, res) => {
    const { csvData, items: rawItems, restaurantId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Missing restaurant ID' });
    }
    try {
      let items = rawItems;
      let totalRows = 0;
      let duplicatesRemoved = 0;

      if (!items && csvData) {
        const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
        const rawRows = parsed.data as any[];
        totalRows = rawRows.length;

        const uniqueMap = new Map<string, any>();
        rawRows.forEach(row => {
          const nameEn = (row.name_en || row.Name_en || row.name || row.Name || '').toString().trim();
          const nameFr = (row.name_fr || row.Name_fr || '').toString().trim();
          const nameAr = (row.name_ar || row.Name_ar || '').toString().trim();
          const mainName = nameEn || nameFr || nameAr || '';
          if (!mainName) return;

          const key = mainName.toLowerCase();
          if (uniqueMap.has(key)) {
            duplicatesRemoved++;
            const existing = uniqueMap.get(key);
            if (nameEn && !existing.name_en) existing.name_en = nameEn;
            if (nameFr && !existing.name_fr) existing.name_fr = nameFr;
            if (nameAr && !existing.name_ar) existing.name_ar = nameAr;
          } else {
            uniqueMap.set(key, row);
          }
        });
        items = Array.from(uniqueMap.values());
      } else if (items) {
        totalRows = items.length;
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'File is empty or could not be parsed' });
      }

      let importedCount = 0;
      let categoryOrder = 0;

      // Determine language type from headers or items
      const firstItem = items[0] || {};
      const hasFrench = Boolean(firstItem.category_fr || firstItem.Name_fr || firstItem.name_fr || firstItem.description_fr);
      const hasArabic = Boolean(firstItem.category_ar || firstItem.Name_ar || firstItem.name_ar || firstItem.description_ar);
      const hasEnglish = Boolean(firstItem.category_en || firstItem.Name_en || firstItem.name_en || firstItem.description_en || firstItem.category || firstItem.name);

      for (const item of items) {
        const categoryEn = (item.category_en || item.Category_en || item.category || item.Category || '').toString().trim();
        const categoryFr = (item.category_fr || item.Category_fr || '').toString().trim();
        const categoryAr = (item.category_ar || item.Category_ar || '').toString().trim();
        const categoryMain = categoryEn || categoryFr || categoryAr || 'General';

        const nameEn = (item.name_en || item.Name_en || item.name || item.Name || '').toString().trim();
        const nameFr = (item.name_fr || item.Name_fr || '').toString().trim();
        const nameAr = (item.name_ar || item.Name_ar || '').toString().trim();
        const nameMain = nameEn || nameFr || nameAr || '';

        const descEn = (item.description_en || item.Description_en || item.description || item.Description || '').toString().trim();
        const descFr = (item.description_fr || item.Description_fr || '').toString().trim();
        const descAr = (item.description_ar || item.Description_ar || '').toString().trim();
        const descMain = descEn || descFr || descAr || '';

        const priceRaw = (item.price || item.Price || '0').toString().replace(/[^0-9.]/g, '');
        const price = parseFloat(priceRaw);
        const imageUrl = (item.imageUrl || item.image_url || item.Image || item.image || '').toString().trim();

        if (!nameMain || isNaN(price)) continue;

        // Find or create category
        let { data: cat } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .or(`name.eq."${categoryMain}",name_en.eq."${categoryMain}",name_fr.eq."${categoryMain}",name_ar.eq."${categoryMain}"`)
          .maybeSingle();
        
        if (!cat) {
          categoryOrder += 1;
          const { data: newCat, error: catErr } = await supabase
            .from('categories')
            .insert([{
              restaurant_id: restaurantId,
              name: categoryMain,
              name_en: categoryEn || categoryMain,
              name_fr: categoryFr,
              name_ar: categoryAr,
              order: categoryOrder
            }])
            .select()
            .maybeSingle();
          if (catErr) console.error('Cat error:', catErr);
          cat = newCat;
        } else {
          // Update category multi-lang fields if present
          await supabase
            .from('categories')
            .update({
              name_en: categoryEn || cat.name_en || cat.name,
              name_fr: categoryFr || cat.name_fr,
              name_ar: categoryAr || cat.name_ar
            })
            .eq('id', cat.id);
        }

        if (!cat) continue;

        // Insert or update product
        const { data: existingProd } = await supabase
          .from('products')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('category_id', cat.id)
          .eq('name', nameMain)
          .maybeSingle();
        
        if (!existingProd) {
          const { error: prodErr } = await supabase.from('products').insert([{
            restaurant_id: restaurantId,
            category_id: cat.id,
            name: nameMain,
            description: descMain,
            name_en: nameEn || nameMain,
            name_fr: nameFr,
            name_ar: nameAr,
            description_en: descEn || descMain,
            description_fr: descFr,
            description_ar: descAr,
            price: price || 0,
            image_url: imageUrl,
            is_available: true,
            is_featured: false
          }]);
          if (!prodErr) importedCount++;
        } else {
          const { error: prodErr } = await supabase.from('products').update({
            description: descMain,
            name_en: nameEn || nameMain,
            name_fr: nameFr,
            name_ar: nameAr,
            description_en: descEn || descMain,
            description_fr: descFr,
            description_ar: descAr,
            price: price || 0,
            image_url: imageUrl,
          }).eq('id', existingProd.id);
          if (!prodErr) importedCount++;
        }
      }

      // Update restaurant languages if needed
      const { data: restData } = await supabase.from('restaurants').select('languages').eq('id', restaurantId).maybeSingle();
      if (restData) {
        const currentLangs = new Set((restData.languages || 'en').split(',').map((s: string) => s.trim()).filter(Boolean));
        if (hasFrench) currentLangs.add('fr');
        if (hasArabic) currentLangs.add('ar');
        if (hasEnglish) currentLangs.add('en');
        await supabase.from('restaurants').update({ languages: Array.from(currentLangs).join(',') }).eq('id', restaurantId);
      }

      res.json({ 
        success: true, 
        message: `Successfully imported ${importedCount} product(s)!`,
        summary: {
          totalRows: totalRows || (items.length + duplicatesRemoved),
          duplicatesRemoved,
          importedCount
        }
      });
    } catch (error: any) {
      console.error('CSV import error:', error);
      res.status(500).json({ error: error.message || 'Import failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    import("vite").then(async ({ createServer: createViteServer }) => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      if (!process.env.VERCEL) {
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`Server running with Vite dev middleware on port ${PORT}`);
        });
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    if (!process.env.VERCEL) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running in production on port ${PORT}`);
      });
    }
  }

export default app;
