import { Router } from "express";
import { supabase } from "../supabase";
import { formatRestaurant } from "../utils";
import { 
  getAdminChatCount, 
  getTelegramWebhookInfo, 
  setTelegramWebhook, 
  updateRestaurantPlan 
} from "../../../bot/telegramBot";
import { superadminOnly } from "../auth";

const router = Router();

router.use(superadminOnly);

router.get("/telegram-status", async (req, res) => {
  const webhookInfo = await getTelegramWebhookInfo();
  res.json({
    botUsername: 'menuquickadmin_bot',
    adminChatCount: getAdminChatCount(),
    webhook: webhookInfo,
    instructions: 'Send /start or <restaurant_id>-YYYY-MM-DD to @menuquickadmin_bot in Telegram'
  });
});

router.post("/setup-telegram-webhook", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  const result = await setTelegramWebhook(url);
  res.json(result);
});

router.post("/activate-plan", async (req, res) => {
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

router.get("/restaurants", async (req, res) => {
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

router.delete("/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('products').delete().eq('restaurant_id', id);
    await supabase.from('categories').delete().eq('restaurant_id', id);
    const { error } = await supabase.from('restaurants').delete().eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Restaurant and all associated data deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
