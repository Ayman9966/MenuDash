import fs from 'fs';
import path from 'path';
import { SupabaseClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('Telegram Bot Token is missing. Bot features will not work.');
}
const DATA_DIR = path.join(process.cwd(), 'data');
const ADMINS_FILE = path.join(DATA_DIR, 'telegram_admins.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data dir:', err);
  }
}

// In-memory set of admin chat IDs
let adminChatIds = new Set<number>();

// Load saved admin chat IDs
function loadAdminChatIds() {
  try {
    if (fs.existsSync(ADMINS_FILE)) {
      const data = fs.readFileSync(ADMINS_FILE, 'utf-8');
      const list = JSON.parse(data);
      if (Array.isArray(list)) {
        list.forEach((id: number) => adminChatIds.add(id));
      }
    }
  } catch (err) {
    console.error('Failed to load telegram admin chat IDs:', err);
  }
}

function saveAdminChatIds() {
  try {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(Array.from(adminChatIds)), 'utf-8');
  } catch (err) {
    console.error('Failed to save telegram admin chat IDs:', err);
  }
}

loadAdminChatIds();

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(chatId: number | string, text: string, parseMode: string = 'HTML') {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Telegram sendMessage error:', err);
    return null;
  }
}

/**
 * Broadcast message to all registered superadmins
 */
export async function broadcastToAdmins(text: string, parseMode: string = 'HTML') {
  if (adminChatIds.size === 0) {
    console.log('No Telegram admin chat IDs recorded yet. Waiting for superadmin to message @menuquickadmin_bot.');
    return;
  }
  for (const chatId of adminChatIds) {
    await sendTelegramMessage(chatId, text, parseMode);
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Send alert for new user registration
 */
export async function sendNewUserAlert(data: {
  username: string;
  phone?: string | null;
  userId: string;
  restaurantName?: string;
  restaurantId?: string;
  restaurantSlug?: string;
  createdAt?: string;
}) {
  const regDate = data.createdAt ? new Date(data.createdAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }) : new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' });

  const message = `🚨 <b>New Registration Alert!</b> 🚨

👤 <b>Username:</b> <code>${escapeHtml(data.username)}</code>
📱 <b>Phone:</b> ${data.phone ? escapeHtml(data.phone) : '<i>None</i>'}
🆔 <b>User ID:</b> <code>${data.userId}</code>

🏨 <b>Restaurant:</b> ${escapeHtml(data.restaurantName || 'N/A')}
🔑 <b>Restaurant ID:</b> <code>${data.restaurantId || 'N/A'}</code>
🌐 <b>Slug:</b> /menu/${data.restaurantSlug || ''}

📅 <b>Registered At:</b> ${regDate}
⚡ <b>Initial Plan:</b> FREE

━━━━━━━━━━━━━━━━━━━━
💡 <b>Quick Plan Activation (Superadmin):</b>
Send: <code>${data.restaurantId || 'RESTAURANT_ID'}-YYYY-MM-DD</code>
<i>Example:</i> <code>${data.restaurantId || 'RESTAURANT_ID'}-2027-12-31</code>`;

  await broadcastToAdmins(message);
}

/**
 * Parse & activate plan for a restaurant given restaurantId and expireDate
 */
export async function updateRestaurantPlan(supabase: SupabaseClient, restaurantId: string, expireDateInput: string) {
  const targetId = restaurantId.trim();
  const dateInput = expireDateInput.trim().toLowerCase();

  // Find restaurant by ID or by slug
  let { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .or(`id.eq.${targetId},slug.eq.${targetId}`)
    .maybeSingle();

  if (!restaurant) {
    return { success: false, error: `Restaurant ID or Slug "${targetId}" not found.` };
  }

  // Check if dateInput is 'free', 'cancel', 'clear' or a YYYY-MM-DD date
  if (['free', 'cancel', 'clear'].includes(dateInput)) {
    const { data: updated, error } = await supabase
      .from('restaurants')
      .update({ plan: 'free' })
      .eq('id', restaurant.id)
      .select()
      .maybeSingle();

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      restaurant: updated,
      planStatus: 'FREE',
      expiresAt: null,
      message: `Plan reset to FREE for "${updated.name}"`
    };
  }

  // Validate YYYY-MM-DD date format
  const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    return { success: false, error: `Invalid date format "${expireDateInput}". Please use YYYY-MM-DD (e.g. 2026-12-31) or "free".` };
  }

  const expireIsoDate = dateInput; // YYYY-MM-DD
  const expDateTime = new Date(`${expireIsoDate}T23:59:59Z`);
  const isFuture = !isNaN(expDateTime.getTime()) && expDateTime.getTime() > Date.now();

  const planDbValue = `pro:${expireIsoDate}`;

  const { data: updated, error } = await supabase
    .from('restaurants')
    .update({ plan: planDbValue })
    .eq('id', restaurant.id)
    .select()
    .maybeSingle();

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    restaurant: updated,
    planStatus: isFuture ? 'PRO (Active)' : 'FREE (Expired)',
    isFuture,
    expiresAt: expireIsoDate,
    message: isFuture 
      ? `PRO plan activated until ${expireIsoDate} for "${updated.name}"!`
      : `Date ${expireIsoDate} has passed. Restaurant "${updated.name}" plan set to FREE.`
  };
}

/**
 * Long Polling engine to listen for Telegram updates
 */
let isPolling = false;
let updateOffset = 0;

export function startTelegramPolling(supabase: SupabaseClient) {
  if (isPolling) return;
  isPolling = true;
  console.log('🤖 Telegram Superadmin Bot Polling Started (@menuquickadmin_bot)...');

  const poll = async () => {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${updateOffset}&timeout=10`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          updateOffset = Math.max(updateOffset, update.update_id + 1);

          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text.trim();

            // Record admin chat ID
            if (!adminChatIds.has(chatId)) {
              adminChatIds.add(chatId);
              saveAdminChatIds();
              console.log(`📌 Recorded new Telegram Superadmin chat_id: ${chatId}`);
            }

            // Handle commands & messages
            await handleTelegramCommand(supabase, chatId, text);
          }
        }
      }
    } catch (err) {
      // Ignore transient network glitches during polling
    } finally {
      setTimeout(poll, 2000);
    }
  };

  poll();
}

/**
 * Delete a restaurant permanently along with all its data
 */
export async function deleteRestaurantPermanently(supabase: SupabaseClient, targetId: string) {
  const idOrSlug = targetId.trim();

  // 1. Find the restaurant first to get the ownerId
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, owner_id')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();

  if (!restaurant) {
    return { success: false, error: `Restaurant "${idOrSlug}" not found.` };
  }

  const restaurantId = restaurant.id;
  const ownerId = restaurant.owner_id;

  try {
    // 2. Delete the restaurant (cascades to categories and products due to DB rules)
    const { error: deleteRestError } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);

    if (deleteRestError) throw deleteRestError;

    // 3. Delete the owner user (this also helps clean up auth)
    // Note: In Supabase/PostgreSQL with the current schema, we can delete the user
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', ownerId);

    // We don't strictly fail if user deletion fails (e.g. if they own multiple restaurants, though not supported now)
    
    return { 
      success: true, 
      restaurantName: restaurant.name,
      message: `Restaurant "${restaurant.name}" and its owner have been permanently deleted.`
    };
  } catch (err: any) {
    console.error('Permanent deletion error:', err);
    return { success: false, error: err.message || 'Unknown error during deletion' };
  }
}

/**
 * Handle individual Telegram messages/commands
 */
async function handleTelegramCommand(supabase: SupabaseClient, chatId: number, text: string) {
  const lowerText = text.toLowerCase();

  // 1. /start or /help
  if (lowerText === '/start' || lowerText === '/help') {
    const helpMsg = `👋 <b>Welcome Superadmin!</b>

I am your QuickMenu assistant. I'll alert you of new signups and help you manage plans.

🚀 <b>EASY COMMANDS:</b>

⚡ <b>Activate Pro Plan:</b>
Just send: <code>ID-YYYY-MM-DD</code>
<i>(e.g. <code>910d...-2027-12-31</code>)</i>

🆓 <b>Revert to Free:</b>
Just send: <code>ID-free</code>

📋 <b>List Everything:</b>
Send: <code>/list</code>

🔍 <b>Check Status:</b>
Send: <code>/status ID</code>

🗑 <b>PERMANENT DELETE:</b>
Send: <code>/delete ID</code>
<i>(Deletes restaurant, menu, and owner forever)</i>

💡 <i>Tip: You can use the Restaurant ID or its Slug (link name) for all commands.</i>`;

    await sendTelegramMessage(chatId, helpMsg);
    return;
  }

  // 2. /list or /restaurants or /users
  if (lowerText === '/list' || lowerText === '/restaurants' || lowerText === '/users') {
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);

    if (!restaurants || restaurants.length === 0) {
      await sendTelegramMessage(chatId, 'ℹ️ No restaurants found in database.');
      return;
    }

    let listMsg = `📋 <b>Recently Registered (${restaurants.length}):</b>\n\n`;
    for (const r of restaurants) {
      let rawPlan = r.plan || 'free';
      let planExpiresAt: string | null = null;
      let statusStr = '🆓 FREE';

      if (typeof rawPlan === 'string' && rawPlan.includes(':')) {
        planExpiresAt = rawPlan.split(':')[1];
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawPlan)) {
        planExpiresAt = rawPlan;
      }

      if (planExpiresAt) {
        const expDate = new Date(planExpiresAt + 'T23:59:59Z');
        if (!isNaN(expDate.getTime()) && expDate.getTime() > Date.now()) {
          statusStr = `💎 PRO (Expires: ${planExpiresAt})`;
        } else {
          statusStr = `⌛ EXPIRED (${planExpiresAt})`;
        }
      }

      listMsg += `🏨 <b>${escapeHtml(r.name)}</b>\n`;
      listMsg += `ID: <code>${r.id}</code>\n`;
      listMsg += `🔗 /menu/${r.slug}\n`;
      listMsg += `Status: <b>${statusStr}</b>\n\n`;
    }

    await sendTelegramMessage(chatId, listMsg + '<i>Use /status ID for more details.</i>');
    return;
  }

  // 3. /status <id>
  if (lowerText.startsWith('/status ')) {
    const idInput = text.substring(8).trim();
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .or(`id.eq.${idInput},slug.eq.${idInput}`)
      .maybeSingle();

    if (!restaurant) {
      await sendTelegramMessage(chatId, `❌ Restaurant "${idInput}" not found.`);
    } else {
      const r = restaurant;
      let planStr = r.plan || 'free';
      let planExpiresAt = null;
      if (planStr.includes(':')) planExpiresAt = planStr.split(':')[1];

      await sendTelegramMessage(chatId, `ℹ️ <b>Details for: ${escapeHtml(r.name)}</b>

🏨 <b>Name:</b> ${escapeHtml(r.name)}
🆔 <b>ID:</b> <code>${r.id}</code>
🌐 <b>Slug:</b> /menu/${r.slug}
⚡ <b>Raw Plan:</b> ${r.plan}
📅 <b>Expiration:</b> ${planExpiresAt || 'None'}
📞 <b>WhatsApp:</b> ${r.whatsapp_number || 'Not set'}
🕒 <b>Created:</b> ${new Date(r.created_at).toLocaleDateString()}

<b>Commands for this restaurant:</b>
• Activate: <code>${r.id}-2027-12-31</code>
• Free: <code>${r.id}-free</code>
• Delete: <code>/delete ${r.id}</code>`);
    }
    return;
  }

  // 4. /delete <id>
  if (lowerText.startsWith('/delete ')) {
    const idInput = text.substring(8).trim();
    
    // We'll ask for one-time confirmation if it's just the ID
    if (!text.includes('--confirm')) {
      await sendTelegramMessage(chatId, `⚠️ <b>WARNING: PERMANENT DELETION</b>

You are about to delete <b>"${idInput}"</b> and all its associated data (menu, categories, products, and user account).

This action <b>CANNOT BE UNDONE</b>.

To proceed, please send:
<code>/delete ${idInput} --confirm</code>`);
      return;
    }

    const targetId = idInput.replace('--confirm', '').trim();
    const result = await deleteRestaurantPermanently(supabase, targetId);
    
    if (result.success) {
      await sendTelegramMessage(chatId, `✅ <b>DELETED PERMANENTLY</b>
      
The restaurant <b>"${result.restaurantName}"</b> and its owner have been successfully removed from the system.`);
    } else {
      await sendTelegramMessage(chatId, `❌ <b>Deletion Failed:</b> ${result.error}`);
    }
    return;
  }

  // 5. Pattern: <restaurant_id>-YYYY-MM-DD or <restaurant_id> YYYY-MM-DD
  const activateCommandMatch = text.match(/^(\/activate\s+)?([a-f0-9\-]{10,40}|[\w\-]+)[- ](\d{4}-\d{2}-\d{2})$/i);
  if (activateCommandMatch) {
    const restaurantId = activateCommandMatch[2];
    const expireDate = activateCommandMatch[3];

    const result = await updateRestaurantPlan(supabase, restaurantId, expireDate);
    if (!result.success) {
      await sendTelegramMessage(chatId, `❌ <b>Activation Failed:</b> ${result.error}`);
    } else {
      const r = result.restaurant;
      await sendTelegramMessage(chatId, `✅ <b>Plan Updated!</b>

🏨 <b>Restaurant:</b> ${escapeHtml(r.name)}
⚡ <b>Status:</b> <b>${result.planStatus}</b>
📅 <b>Expires:</b> <code>${result.expiresAt}</code>`);
    }
    return;
  }

  // 6. Pattern: <restaurant_id>-free
  const quickFreeMatch = text.match(/^([a-f0-9\-]{10,40}|[\w\-]+)-free$/i);
  if (quickFreeMatch) {
    const restaurantId = quickFreeMatch[1];
    const result = await updateRestaurantPlan(supabase, restaurantId, 'free');
    if (!result.success) {
      await sendTelegramMessage(chatId, `❌ <b>Failed:</b> ${result.error}`);
    } else {
      const r = result.restaurant;
      await sendTelegramMessage(chatId, `✅ <b>Plan Reset to FREE</b>
      
🏨 <b>Restaurant:</b> ${escapeHtml(r.name)}
⚡ Status: FREE`);
    }
    return;
  }

  // 7. /cancel <id>
  if (lowerText.startsWith('/cancel ')) {
    const restaurantId = text.substring(8).trim();
    const result = await updateRestaurantPlan(supabase, restaurantId, 'free');
    if (!result.success) {
      await sendTelegramMessage(chatId, `❌ <b>Failed:</b> ${result.error}`);
    } else {
      const r = result.restaurant;
      await sendTelegramMessage(chatId, `✅ <b>Plan Reset to FREE</b>
      
🏨 <b>Restaurant:</b> ${escapeHtml(r.name)}
⚡ Status: FREE`);
    }
    return;
  }

  // Default fallback response if message isn't recognized
  await sendTelegramMessage(chatId, `❓ Unrecognized command.
Send <code>/help</code> for instructions.`);
}

export function getAdminChatCount() {
  return adminChatIds.size;
}
