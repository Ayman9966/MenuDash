var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express2 = __toESM(require("express"), 1);
var dotenv2 = __toESM(require("dotenv"), 1);

// server/backendCore.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var dotenv = __toESM(require("dotenv"), 1);

// server/telegramBot.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
var isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
var DATA_DIR = isVercel ? "/tmp" : import_path.default.join(process.cwd(), "data");
var ADMINS_FILE = import_path.default.join(DATA_DIR, "telegram_admins.json");
if (!isVercel && !import_fs.default.existsSync(DATA_DIR)) {
  try {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data dir:", err);
  }
}
var adminChatIds = /* @__PURE__ */ new Set();
function loadAdminChatIds() {
  try {
    if (import_fs.default.existsSync(ADMINS_FILE)) {
      const data = import_fs.default.readFileSync(ADMINS_FILE, "utf-8");
      const list = JSON.parse(data);
      if (Array.isArray(list)) {
        list.forEach((id) => adminChatIds.add(id));
      }
    }
  } catch (err) {
    console.error("Failed to load telegram admin chat IDs:", err);
  }
}
function saveAdminChatIds() {
  if (isVercel) return;
  try {
    import_fs.default.writeFileSync(ADMINS_FILE, JSON.stringify(Array.from(adminChatIds)), "utf-8");
  } catch (err) {
    console.error("Failed to save telegram admin chat IDs:", err);
  }
}
loadAdminChatIds();
async function sendTelegramMessage(chatId, text, parseMode = "HTML") {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    console.error("Telegram sendMessage error:", err);
    return null;
  }
}
async function broadcastToAdmins(text, parseMode = "HTML") {
  if (adminChatIds.size === 0) {
    console.log("No Telegram admin chat IDs recorded yet. Waiting for superadmin to message @menuquickadmin_bot.");
    return;
  }
  for (const chatId of adminChatIds) {
    await sendTelegramMessage(chatId, text, parseMode);
  }
}
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
async function sendNewUserAlert(data) {
  const regDate = data.createdAt ? new Date(data.createdAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" }) : (/* @__PURE__ */ new Date()).toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" });
  const message = `\u{1F6A8} <b>New Registration Alert!</b> \u{1F6A8}

\u{1F464} <b>Username:</b> <code>${escapeHtml(data.username)}</code>
\u{1F4F1} <b>Phone:</b> ${data.phone ? escapeHtml(data.phone) : "<i>None</i>"}
\u{1F194} <b>User ID:</b> <code>${data.userId}</code>

\u{1F3E8} <b>Restaurant:</b> ${escapeHtml(data.restaurantName || "N/A")}
\u{1F511} <b>Restaurant ID:</b> <code>${data.restaurantId || "N/A"}</code>
\u{1F310} <b>Slug:</b> /menu/${data.restaurantSlug || ""}

\u{1F4C5} <b>Registered At:</b> ${regDate}
\u26A1 <b>Initial Plan:</b> FREE

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4A1} <b>Quick Plan Activation (Superadmin):</b>
Send: <code>${data.restaurantId || "RESTAURANT_ID"}-YYYY-MM-DD</code>
<i>Example:</i> <code>${data.restaurantId || "RESTAURANT_ID"}-2027-12-31</code>`;
  await broadcastToAdmins(message);
}
async function updateRestaurantPlan(supabase2, restaurantId, expireDateInput) {
  const targetId = restaurantId.trim();
  const dateInput = expireDateInput.trim().toLowerCase();
  let { data: restaurant } = await supabase2.from("restaurants").select("*").or(`id.eq.${targetId},slug.eq.${targetId}`).maybeSingle();
  if (!restaurant) {
    return { success: false, error: `Restaurant ID or Slug "${targetId}" not found.` };
  }
  if (["free", "cancel", "clear"].includes(dateInput)) {
    const { data: updated2, error: error2 } = await supabase2.from("restaurants").update({ plan: "free" }).eq("id", restaurant.id).select().maybeSingle();
    if (error2) return { success: false, error: error2.message };
    return {
      success: true,
      restaurant: updated2,
      planStatus: "FREE",
      expiresAt: null,
      message: `Plan reset to FREE for "${updated2.name}"`
    };
  }
  const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    return { success: false, error: `Invalid date format "${expireDateInput}". Please use YYYY-MM-DD (e.g. 2026-12-31) or "free".` };
  }
  const expireIsoDate = dateInput;
  const expDateTime = /* @__PURE__ */ new Date(`${expireIsoDate}T23:59:59Z`);
  const isFuture = !isNaN(expDateTime.getTime()) && expDateTime.getTime() > Date.now();
  const planDbValue = `pro:${expireIsoDate}`;
  const { data: updated, error } = await supabase2.from("restaurants").update({ plan: planDbValue }).eq("id", restaurant.id).select().maybeSingle();
  if (error) return { success: false, error: error.message };
  return {
    success: true,
    restaurant: updated,
    planStatus: isFuture ? "PRO (Active)" : "FREE (Expired)",
    isFuture,
    expiresAt: expireIsoDate,
    message: isFuture ? `PRO plan activated until ${expireIsoDate} for "${updated.name}"!` : `Date ${expireIsoDate} has passed. Restaurant "${updated.name}" plan set to FREE.`
  };
}
var isPolling = false;
var updateOffset = 0;
function startTelegramPolling(supabase2) {
  if (isPolling) return;
  isPolling = true;
  console.log("\u{1F916} Telegram Superadmin Bot Polling Started (@menuquickadmin_bot)...");
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
            if (!adminChatIds.has(chatId)) {
              adminChatIds.add(chatId);
              saveAdminChatIds();
              console.log(`\u{1F4CC} Recorded new Telegram Superadmin chat_id: ${chatId}`);
            }
            await handleTelegramCommand(supabase2, chatId, text);
          }
        }
      }
    } catch (err) {
    } finally {
      setTimeout(poll, 2e3);
    }
  };
  poll();
}
async function deleteRestaurantPermanently(supabase2, targetId) {
  const idOrSlug = targetId.trim();
  const { data: restaurant } = await supabase2.from("restaurants").select("id, name, owner_id").or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`).maybeSingle();
  if (!restaurant) {
    return { success: false, error: `Restaurant "${idOrSlug}" not found.` };
  }
  const restaurantId = restaurant.id;
  const ownerId = restaurant.owner_id;
  try {
    const { error: deleteRestError } = await supabase2.from("restaurants").delete().eq("id", restaurantId);
    if (deleteRestError) throw deleteRestError;
    const { error: deleteUserError } = await supabase2.from("users").delete().eq("id", ownerId);
    return {
      success: true,
      restaurantName: restaurant.name,
      message: `Restaurant "${restaurant.name}" and its owner have been permanently deleted.`
    };
  } catch (err) {
    console.error("Permanent deletion error:", err);
    return { success: false, error: err.message || "Unknown error during deletion" };
  }
}
async function handleTelegramCommand(supabase2, chatId, text) {
  const lowerText = text.toLowerCase();
  if (lowerText === "/start" || lowerText === "/help") {
    const helpMsg = `\u{1F44B} <b>Welcome Superadmin!</b>

I am your QuickMenu assistant. I'll alert you of new signups and help you manage plans.

\u{1F680} <b>EASY COMMANDS:</b>

\u26A1 <b>Activate Pro Plan:</b>
Just send: <code>ID-YYYY-MM-DD</code>
<i>(e.g. <code>910d...-2027-12-31</code>)</i>

\u{1F193} <b>Revert to Free:</b>
Just send: <code>ID-free</code>

\u{1F4CB} <b>List Everything:</b>
Send: <code>/list</code>

\u{1F50D} <b>Check Status:</b>
Send: <code>/status ID</code>

\u{1F5D1} <b>PERMANENT DELETE:</b>
Send: <code>/delete ID</code>
<i>(Deletes restaurant, menu, and owner forever)</i>

\u{1F4A1} <i>Tip: You can use the Restaurant ID or its Slug (link name) for all commands.</i>`;
    await sendTelegramMessage(chatId, helpMsg);
    return;
  }
  if (lowerText === "/list" || lowerText === "/restaurants" || lowerText === "/users") {
    const { data: restaurants } = await supabase2.from("restaurants").select("*").order("created_at", { ascending: false }).limit(25);
    if (!restaurants || restaurants.length === 0) {
      await sendTelegramMessage(chatId, "\u2139\uFE0F No restaurants found in database.");
      return;
    }
    let listMsg = `\u{1F4CB} <b>Recently Registered (${restaurants.length}):</b>

`;
    for (const r of restaurants) {
      let rawPlan = r.plan || "free";
      let planExpiresAt = null;
      let statusStr = "\u{1F193} FREE";
      if (typeof rawPlan === "string" && rawPlan.includes(":")) {
        planExpiresAt = rawPlan.split(":")[1];
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawPlan)) {
        planExpiresAt = rawPlan;
      }
      if (planExpiresAt) {
        const expDate = /* @__PURE__ */ new Date(planExpiresAt + "T23:59:59Z");
        if (!isNaN(expDate.getTime()) && expDate.getTime() > Date.now()) {
          statusStr = `\u{1F48E} PRO (Expires: ${planExpiresAt})`;
        } else {
          statusStr = `\u231B EXPIRED (${planExpiresAt})`;
        }
      }
      listMsg += `\u{1F3E8} <b>${escapeHtml(r.name)}</b>
`;
      listMsg += `ID: <code>${r.id}</code>
`;
      listMsg += `\u{1F517} /menu/${r.slug}
`;
      listMsg += `Status: <b>${statusStr}</b>

`;
    }
    await sendTelegramMessage(chatId, listMsg + "<i>Use /status ID for more details.</i>");
    return;
  }
  if (lowerText.startsWith("/status ")) {
    const idInput = text.substring(8).trim();
    const { data: restaurant } = await supabase2.from("restaurants").select("*").or(`id.eq.${idInput},slug.eq.${idInput}`).maybeSingle();
    if (!restaurant) {
      await sendTelegramMessage(chatId, `\u274C Restaurant "${idInput}" not found.`);
    } else {
      const r = restaurant;
      let planStr = r.plan || "free";
      let planExpiresAt = null;
      if (planStr.includes(":")) planExpiresAt = planStr.split(":")[1];
      await sendTelegramMessage(chatId, `\u2139\uFE0F <b>Details for: ${escapeHtml(r.name)}</b>

\u{1F3E8} <b>Name:</b> ${escapeHtml(r.name)}
\u{1F194} <b>ID:</b> <code>${r.id}</code>
\u{1F310} <b>Slug:</b> /menu/${r.slug}
\u26A1 <b>Raw Plan:</b> ${r.plan}
\u{1F4C5} <b>Expiration:</b> ${planExpiresAt || "None"}
\u{1F4DE} <b>WhatsApp:</b> ${r.whatsapp_number || "Not set"}
\u{1F552} <b>Created:</b> ${new Date(r.created_at).toLocaleDateString()}

<b>Commands for this restaurant:</b>
\u2022 Activate: <code>${r.id}-2027-12-31</code>
\u2022 Free: <code>${r.id}-free</code>
\u2022 Delete: <code>/delete ${r.id}</code>`);
    }
    return;
  }
  if (lowerText.startsWith("/delete ")) {
    const idInput = text.substring(8).trim();
    if (!text.includes("--confirm")) {
      await sendTelegramMessage(chatId, `\u26A0\uFE0F <b>WARNING: PERMANENT DELETION</b>

You are about to delete <b>"${idInput}"</b> and all its associated data (menu, categories, products, and user account).

This action <b>CANNOT BE UNDONE</b>.

To proceed, please send:
<code>/delete ${idInput} --confirm</code>`);
      return;
    }
    const targetId = idInput.replace("--confirm", "").trim();
    const result = await deleteRestaurantPermanently(supabase2, targetId);
    if (result.success) {
      await sendTelegramMessage(chatId, `\u2705 <b>DELETED PERMANENTLY</b>
      
The restaurant <b>"${result.restaurantName}"</b> and its owner have been successfully removed from the system.`);
    } else {
      await sendTelegramMessage(chatId, `\u274C <b>Deletion Failed:</b> ${result.error}`);
    }
    return;
  }
  const activateCommandMatch = text.match(/^(\/activate\s+)?([a-f0-9\-]{10,40}|[\w\-]+)[- ](\d{4}-\d{2}-\d{2})$/i);
  if (activateCommandMatch) {
    const restaurantId = activateCommandMatch[2];
    const expireDate = activateCommandMatch[3];
    const result = await updateRestaurantPlan(supabase2, restaurantId, expireDate);
    if (!result.success) {
      await sendTelegramMessage(chatId, `\u274C <b>Activation Failed:</b> ${result.error}`);
    } else {
      const r = result.restaurant;
      await sendTelegramMessage(chatId, `\u2705 <b>Plan Updated!</b>

\u{1F3E8} <b>Restaurant:</b> ${escapeHtml(r.name)}
\u26A1 <b>Status:</b> <b>${result.planStatus}</b>
\u{1F4C5} <b>Expires:</b> <code>${result.expiresAt}</code>`);
    }
    return;
  }
  const quickFreeMatch = text.match(/^([a-f0-9\-]{10,40}|[\w\-]+)-free$/i);
  if (quickFreeMatch) {
    const restaurantId = quickFreeMatch[1];
    const result = await updateRestaurantPlan(supabase2, restaurantId, "free");
    if (!result.success) {
      await sendTelegramMessage(chatId, `\u274C <b>Failed:</b> ${result.error}`);
    } else {
      const r = result.restaurant;
      await sendTelegramMessage(chatId, `\u2705 <b>Plan Reset to FREE</b>
      
\u{1F3E8} <b>Restaurant:</b> ${escapeHtml(r.name)}
\u26A1 Status: FREE`);
    }
    return;
  }
  if (lowerText.startsWith("/cancel ")) {
    const restaurantId = text.substring(8).trim();
    const result = await updateRestaurantPlan(supabase2, restaurantId, "free");
    if (!result.success) {
      await sendTelegramMessage(chatId, `\u274C <b>Failed:</b> ${result.error}`);
    } else {
      const r = result.restaurant;
      await sendTelegramMessage(chatId, `\u2705 <b>Plan Reset to FREE</b>
      
\u{1F3E8} <b>Restaurant:</b> ${escapeHtml(r.name)}
\u26A1 Status: FREE`);
    }
    return;
  }
  await sendTelegramMessage(chatId, `\u2753 Unrecognized command.
Send <code>/help</code> for instructions.`);
}
function getAdminChatCount() {
  return adminChatIds.size;
}

// server/backendCore.ts
dotenv.config();
var SUPABASE_URL = process.env.SUPABASE_URL || "";
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
var JWT_SECRET = process.env.JWT_SECRET || "jwt-secret";
var supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
var pollingStarted = false;
function initTelegram() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }
  if (!pollingStarted) {
    pollingStarted = true;
    startTelegramPolling(supabase);
  }
}
function formatRestaurant(restaurant) {
  if (!restaurant) return null;
  const rawPlan = restaurant.plan || "free";
  let planExpiresAt = null;
  let effectivePlan = "free";
  if (typeof rawPlan === "string" && rawPlan.includes(":")) {
    const parts = rawPlan.split(":");
    const planType = parts[0].toLowerCase();
    const datePart = parts[1];
    if (planType === "pro" || planType === "premium") {
      planExpiresAt = datePart;
    }
  } else if (rawPlan === "premium" || rawPlan === "pro") {
    effectivePlan = "premium";
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawPlan)) {
    planExpiresAt = rawPlan;
  }
  if (planExpiresAt) {
    const expDate = /* @__PURE__ */ new Date(planExpiresAt + "T23:59:59Z");
    if (!isNaN(expDate.getTime()) && expDate.getTime() > Date.now()) {
      effectivePlan = "premium";
    } else {
      effectivePlan = "free";
    }
  }
  return {
    ...restaurant,
    ownerId: restaurant.owner_id || restaurant.ownerId,
    whatsappNumber: restaurant.whatsapp_number || restaurant.whatsappNumber,
    logoUrl: restaurant.logo_url || restaurant.logoUrl,
    coverUrl: restaurant.cover_url || restaurant.coverUrl,
    languages: restaurant.languages || "en",
    defaultLanguage: restaurant.default_language || restaurant.defaultLanguage || "en",
    plan: effectivePlan,
    planExpiresAt,
    rawPlan
  };
}
async function ensureUserRestaurant(user) {
  try {
    let restaurant = null;
    if (user.restaurant_id) {
      const { data } = await supabase.from("restaurants").select("*").eq("id", user.restaurant_id).maybeSingle();
      restaurant = data;
    }
    if (!restaurant) {
      const { data } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).maybeSingle();
      restaurant = data;
    }
    if (!restaurant) {
      const cleanUsername = (user.username || "My Restaurant").trim();
      const baseSlug = cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, "-") || "restaurant";
      const uniqueSlug = `${baseSlug}-${Math.floor(Math.random() * 89999 + 1e4)}`;
      const { data: newRest, error: restError } = await supabase.from("restaurants").insert([{
        name: `${cleanUsername}'s Restaurant`,
        slug: uniqueSlug,
        owner_id: user.id,
        description: "Welcome to our digital menu!",
        whatsapp_number: "",
        address: "",
        currency: "USD",
        template: "list"
      }]).select().maybeSingle();
      if (!restError && newRest) {
        restaurant = newRest;
      }
    }
    if (restaurant && user.restaurant_id !== restaurant.id) {
      await supabase.from("users").update({ restaurant_id: restaurant.id }).eq("id", user.id);
      user.restaurant_id = restaurant.id;
    }
    return { user, restaurant: formatRestaurant(restaurant) };
  } catch (err) {
    console.error("Error in ensureUserRestaurant:", err);
    return { user, restaurant: null };
  }
}
async function authenticate(req, res) {
  return new Promise((resolve, reject) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return resolve(null);
    }
    const token = authHeader.split("Bearer ")[1];
    try {
      const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      req.user = decoded;
      resolve(decoded);
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
      resolve(null);
    }
  });
}
async function superadminOnly(req, res) {
  const user = await authenticate(req, res);
  if (!user) return false;
  if (user.role !== "superadmin") {
    res.status(403).json({ error: "Forbidden: Superadmin access required" });
    return false;
  }
  return true;
}

// server/routes.ts
var import_express = __toESM(require("express"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_papaparse = __toESM(require("papaparse"), 1);
var apiRouter = import_express.default.Router();
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", supabaseConnected: !!SUPABASE_URL, telegramAdmins: getAdminChatCount() });
});
apiRouter.get("/admin/telegram-status", async (req, res) => {
  if (!await superadminOnly(req, res)) return;
  res.json({
    botUsername: "menuquickadmin_bot",
    adminChatCount: getAdminChatCount(),
    instructions: "Send /start or <restaurant_id>-YYYY-MM-DD to @menuquickadmin_bot in Telegram"
  });
});
apiRouter.post("/admin/activate-plan", async (req, res) => {
  if (!await superadminOnly(req, res)) return;
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
apiRouter.get("/admin/restaurants", async (req, res) => {
  if (!await superadminOnly(req, res)) return;
  try {
    const { data: list, error } = await supabase.from("restaurants").select(`
        *,
        categories:categories(count),
        products:products(count)
      `).order("created_at", { ascending: false });
    if (error) throw error;
    const formattedList = list.map((r) => ({
      ...formatRestaurant(r),
      categoryCount: r.categories?.[0]?.count || 0,
      productCount: r.products?.[0]?.count || 0
    }));
    res.json(formattedList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.delete("/admin/restaurants/:id", async (req, res) => {
  if (!await superadminOnly(req, res)) return;
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing restaurant id" });
    await supabase.from("products").delete().eq("restaurant_id", id);
    await supabase.from("categories").delete().eq("restaurant_id", id);
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true, message: "Restaurant and all associated data deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/auth/register", async (req, res) => {
  const { username, password, phone } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const trimmedUsername = username.trim();
  const trimmedPhone = phone ? phone.trim() : null;
  try {
    const hashedPassword = await import_bcryptjs.default.hash(password, 10);
    const { data: user, error } = await supabase.from("users").insert([{
      username: trimmedUsername,
      password: hashedPassword,
      phone: trimmedPhone,
      role: "owner"
    }]).select().maybeSingle();
    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Username or phone number already exists" });
      }
      return res.status(400).json({ error: error.message });
    }
    if (!user) {
      return res.status(500).json({ error: "Failed to create user record" });
    }
    const { user: updatedUser, restaurant } = await ensureUserRestaurant(user);
    sendNewUserAlert({
      username: updatedUser.username,
      phone: updatedUser.phone,
      userId: updatedUser.id,
      restaurantName: restaurant?.name,
      restaurantId: restaurant?.id,
      restaurantSlug: restaurant?.slug,
      createdAt: user.created_at || (/* @__PURE__ */ new Date()).toISOString()
    }).catch((err) => console.error("Telegram alert trigger error:", err));
    const token = import_jsonwebtoken2.default.sign({ uid: updatedUser.id, username: updatedUser.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: updatedUser, restaurant, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});
apiRouter.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username/Email and password are required" });
  }
  const inputVal = username.trim();
  const SUPERADMIN_USER = process.env.SUPERADMIN_USERNAME;
  const SUPERADMIN_PASS = process.env.SUPERADMIN_PASSWORD;
  if (SUPERADMIN_USER && SUPERADMIN_PASS && inputVal === SUPERADMIN_USER && password === SUPERADMIN_PASS) {
    const superUser = {
      id: "superadmin-id",
      username: SUPERADMIN_USER,
      role: "superadmin"
    };
    const token = import_jsonwebtoken2.default.sign({ uid: superUser.id, username: superUser.username, role: "superadmin" }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ user: superUser, restaurant: null, token });
  }
  try {
    let { data: user, error } = await supabase.from("users").select("*").ilike("username", inputVal).maybeSingle();
    if (!user) {
      const { data: userPhone } = await supabase.from("users").select("*").ilike("phone", inputVal).maybeSingle();
      if (userPhone) {
        user = userPhone;
      }
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid username/phone or password" });
    }
    const validPassword = await import_bcryptjs.default.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username/phone or password" });
    }
    const { user: updatedUser, restaurant } = await ensureUserRestaurant(user);
    const token = import_jsonwebtoken2.default.sign({ uid: updatedUser.id, username: updatedUser.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: updatedUser, restaurant, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed due to server error" });
  }
});
apiRouter.get("/me", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (user.role === "superadmin") {
    return res.json({
      user: { id: user.uid, username: user.username, role: "superadmin" },
      restaurant: null
    });
  }
  try {
    const { data: dbUser, error: userError } = await supabase.from("users").select("*").eq("id", user.uid).maybeSingle();
    if (userError || !dbUser) return res.status(404).json({ error: "User not found" });
    const { user: updatedUser, restaurant } = await ensureUserRestaurant(dbUser);
    res.json({ user: updatedUser, restaurant });
  } catch (error) {
    console.error("Me endpoint error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});
apiRouter.post("/restaurant", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const { name, slug, description, whatsappNumber, address, currency, template, languages, defaultLanguage } = req.body;
  try {
    const { data: existing } = await supabase.from("restaurants").select("id").eq("owner_id", user.uid).maybeSingle();
    if (slug) {
      const { data: slugCheck } = await supabase.from("restaurants").select("id").eq("slug", slug).maybeSingle();
      if (slugCheck && (!existing || slugCheck.id !== existing.id)) {
        return res.status(400).json({ error: "This menu URL slug is already taken by another restaurant. Please choose a different one." });
      }
    }
    let restaurantData;
    if (existing) {
      const { data: updated, error } = await supabase.from("restaurants").update({
        name,
        slug,
        description,
        whatsapp_number: whatsappNumber,
        address,
        currency,
        template,
        languages: languages || "en",
        default_language: defaultLanguage || "en"
      }).eq("id", existing.id).select().maybeSingle();
      if (error) throw error;
      restaurantData = updated;
    } else {
      const { data: created, error } = await supabase.from("restaurants").insert([{
        name,
        slug,
        owner_id: user.uid,
        description,
        whatsapp_number: whatsappNumber,
        address,
        currency,
        template,
        languages: languages || "en",
        default_language: defaultLanguage || "en"
      }]).select().maybeSingle();
      if (error) throw error;
      restaurantData = created;
    }
    if (restaurantData) {
      await supabase.from("users").update({ restaurant_id: restaurantData.id }).eq("id", user.uid);
    }
    res.json(formatRestaurant(restaurantData));
  } catch (error) {
    console.error("Save restaurant error:", error);
    const errMessage = error?.message || error?.details || (typeof error === "object" ? JSON.stringify(error) : String(error)) || "Failed to save restaurant";
    res.status(500).json({ error: errMessage });
  }
});
apiRouter.get("/menu/:slug", async (req, res) => {
  const slug = req.params.slug;
  if (!slug) return res.status(400).json({ error: "Missing slug" });
  try {
    const { data: restaurant, error: resError } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
    if (resError || !restaurant) return res.status(404).json({ error: "Restaurant not found" });
    const { data: menuCategories } = await supabase.from("categories").select("*").eq("restaurant_id", restaurant.id).order("order", { ascending: true });
    const { data: menuProducts } = await supabase.from("products").select("*").eq("restaurant_id", restaurant.id).order("created_at", { ascending: false });
    const formattedRest = formatRestaurant(restaurant);
    res.json({
      restaurant: formattedRest,
      categories: menuCategories?.map((c) => ({
        ...c,
        restaurantId: c.restaurant_id
      })) || [],
      products: menuProducts?.map((p) => ({
        ...p,
        restaurantId: p.restaurant_id,
        categoryId: p.category_id,
        imageUrl: p.image_url,
        isAvailable: p.is_available ?? true,
        isFeatured: p.is_featured ?? false
      })) || []
    });
  } catch (error) {
    console.error("Fetch public menu error:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});
apiRouter.get("/products", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  try {
    const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user.uid).maybeSingle();
    if (!restaurant) {
      return res.json({ categories: [], products: [] });
    }
    const { data: categories } = await supabase.from("categories").select("*").eq("restaurant_id", restaurant.id).order("order", { ascending: true });
    const { data: products } = await supabase.from("products").select("*").eq("restaurant_id", restaurant.id).order("created_at", { ascending: false });
    res.json({
      categories: categories?.map((c) => ({
        ...c,
        restaurantId: c.restaurant_id
      })) || [],
      products: products?.map((p) => ({
        ...p,
        restaurantId: p.restaurant_id,
        categoryId: p.category_id,
        imageUrl: p.image_url,
        isAvailable: p.is_available ?? true,
        isFeatured: p.is_featured ?? false
      })) || []
    });
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
apiRouter.post("/products", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const { categoryId, name, description, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, price, imageUrl, isAvailable, isFeatured } = req.body;
  try {
    const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: "Restaurant not found" });
    const { data: product, error } = await supabase.from("products").insert([{
      restaurant_id: restaurant.id,
      category_id: categoryId,
      name: name || nameEn || nameFr || nameAr || "",
      description: description || descriptionEn || descriptionFr || descriptionAr || "",
      name_en: nameEn || name || "",
      name_fr: nameFr || "",
      name_ar: nameAr || "",
      description_en: descriptionEn || description || "",
      description_fr: descriptionFr || "",
      description_ar: descriptionAr || "",
      price: parseFloat(price) || 0,
      image_url: imageUrl || "",
      is_available: isAvailable !== false,
      is_featured: isFeatured === true
    }]).select().maybeSingle();
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
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: error.message || "Failed to create product" });
  }
});
apiRouter.put("/products/:id", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing product id" });
  const { categoryId, name, description, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, price, imageUrl, isAvailable, isFeatured } = req.body;
  try {
    const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: "Restaurant not found" });
    const { data: product, error } = await supabase.from("products").update({
      category_id: categoryId,
      name: name || nameEn || nameFr || nameAr || "",
      description: description || descriptionEn || descriptionFr || descriptionAr || "",
      name_en: nameEn || name || "",
      name_fr: nameFr || "",
      name_ar: nameAr || "",
      description_en: descriptionEn || description || "",
      description_fr: descriptionFr || "",
      description_ar: descriptionAr || "",
      price: parseFloat(price) || 0,
      image_url: imageUrl,
      is_available: isAvailable,
      is_featured: isFeatured
    }).eq("id", id).eq("restaurant_id", restaurant.id).select().maybeSingle();
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
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: error.message || "Failed to update product" });
  }
});
apiRouter.delete("/products/:id", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing product id" });
  try {
    const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: "Restaurant not found" });
    const { error } = await supabase.from("products").delete().eq("id", id).eq("restaurant_id", restaurant.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: error.message || "Failed to delete product" });
  }
});
apiRouter.post("/categories", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Category name is required" });
  try {
    const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: "Restaurant not found" });
    const { data: cat, error } = await supabase.from("categories").insert([{
      restaurant_id: restaurant.id,
      name: name.trim(),
      order: 0
    }]).select().maybeSingle();
    if (error) throw error;
    res.json({
      ...cat,
      restaurantId: cat.restaurant_id
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: error.message || "Failed to create category" });
  }
});
apiRouter.delete("/categories/:id", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing category id" });
  try {
    const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user.uid).maybeSingle();
    if (!restaurant) return res.status(400).json({ error: "Restaurant not found" });
    const { error } = await supabase.from("categories").delete().eq("id", id).eq("restaurant_id", restaurant.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: error.message || "Failed to delete category" });
  }
});
apiRouter.post("/import-csv", async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const { csvData, items: rawItems, restaurantId } = req.body;
  if (!restaurantId) {
    return res.status(400).json({ error: "Missing restaurant ID" });
  }
  try {
    let items = rawItems;
    let totalRows = 0;
    let duplicatesRemoved = 0;
    if (!items && csvData) {
      const parsed = import_papaparse.default.parse(csvData, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
      const rawRows = parsed.data;
      totalRows = rawRows.length;
      const uniqueMap = /* @__PURE__ */ new Map();
      rawRows.forEach((row) => {
        const nameEn = (row.name_en || row.Name_en || row.name || row.Name || "").toString().trim();
        const nameFr = (row.name_fr || row.Name_fr || "").toString().trim();
        const nameAr = (row.name_ar || row.Name_ar || "").toString().trim();
        const mainName = nameEn || nameFr || nameAr || "";
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
      return res.status(400).json({ error: "File is empty or could not be parsed" });
    }
    let importedCount = 0;
    let categoryOrder = 0;
    const firstItem = items[0] || {};
    const hasFrench = Boolean(firstItem.category_fr || firstItem.Name_fr || firstItem.name_fr || firstItem.description_fr);
    const hasArabic = Boolean(firstItem.category_ar || firstItem.Name_ar || firstItem.name_ar || firstItem.description_ar);
    const hasEnglish = Boolean(firstItem.category_en || firstItem.Name_en || firstItem.name_en || firstItem.description_en || firstItem.category || firstItem.name);
    for (const item of items) {
      const categoryEn = (item.category_en || item.Category_en || item.category || item.Category || "").toString().trim();
      const categoryFr = (item.category_fr || item.Category_fr || "").toString().trim();
      const categoryAr = (item.category_ar || item.Category_ar || "").toString().trim();
      const categoryMain = categoryEn || categoryFr || categoryAr || "General";
      const nameEn = (item.name_en || item.Name_en || item.name || item.Name || "").toString().trim();
      const nameFr = (item.name_fr || item.Name_fr || "").toString().trim();
      const nameAr = (item.name_ar || item.Name_ar || "").toString().trim();
      const nameMain = nameEn || nameFr || nameAr || "";
      const descEn = (item.description_en || item.Description_en || item.description || item.Description || "").toString().trim();
      const descFr = (item.description_fr || item.Description_fr || "").toString().trim();
      const descAr = (item.description_ar || item.Description_ar || "").toString().trim();
      const descMain = descEn || descFr || descAr || "";
      const priceRaw = (item.price || item.Price || "0").toString().replace(/[^0-9.]/g, "");
      const price = parseFloat(priceRaw);
      const imageUrl = (item.imageUrl || item.image_url || item.Image || item.image || "").toString().trim();
      if (!nameMain || isNaN(price)) continue;
      const { data: existingCategories } = await supabase.from("categories").select("*").eq("restaurant_id", restaurantId);
      let cat = existingCategories?.find(
        (c) => c.name?.toLowerCase() === categoryMain.toLowerCase() || c.name_en?.toLowerCase() === categoryMain.toLowerCase() || c.name_fr?.toLowerCase() === categoryMain.toLowerCase() || c.name_ar?.toLowerCase() === categoryMain.toLowerCase()
      );
      if (!cat) {
        categoryOrder += 1;
        const { data: newCat, error: catErr } = await supabase.from("categories").insert([{
          restaurant_id: restaurantId,
          name: categoryMain,
          name_en: categoryEn || categoryMain,
          name_fr: categoryFr,
          name_ar: categoryAr,
          order: categoryOrder
        }]).select().maybeSingle();
        if (catErr) console.error("Cat error:", catErr);
        cat = newCat;
      } else {
        await supabase.from("categories").update({
          name_en: categoryEn || cat.name_en || cat.name,
          name_fr: categoryFr || cat.name_fr,
          name_ar: categoryAr || cat.name_ar
        }).eq("id", cat.id);
      }
      if (!cat) continue;
      const { data: existingProd } = await supabase.from("products").select("id").eq("restaurant_id", restaurantId).eq("category_id", cat.id).eq("name", nameMain).maybeSingle();
      if (!existingProd) {
        const { error: prodErr } = await supabase.from("products").insert([{
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
        const { error: prodErr } = await supabase.from("products").update({
          description: descMain,
          name_en: nameEn || nameMain,
          name_fr: nameFr,
          name_ar: nameAr,
          description_en: descEn || descMain,
          description_fr: descFr,
          description_ar: descAr,
          price: price || 0,
          image_url: imageUrl
        }).eq("id", existingProd.id);
        if (!prodErr) importedCount++;
      }
    }
    const { data: restData } = await supabase.from("restaurants").select("languages").eq("id", restaurantId).maybeSingle();
    if (restData) {
      const currentLangs = new Set((restData.languages || "en").split(",").map((s) => s.trim()).filter(Boolean));
      if (hasFrench) currentLangs.add("fr");
      if (hasArabic) currentLangs.add("ar");
      if (hasEnglish) currentLangs.add("en");
      await supabase.from("restaurants").update({ languages: Array.from(currentLangs).join(",") }).eq("id", restaurantId);
    }
    res.json({
      success: true,
      message: `Successfully imported ${importedCount} product(s)!`,
      summary: {
        totalRows: totalRows || items.length + duplicatesRemoved,
        duplicatesRemoved,
        importedCount
      }
    });
  } catch (error) {
    console.error("CSV import error:", error);
    res.status(500).json({ error: error.message || "Import failed" });
  }
});

// api/index.ts
dotenv2.config();
var app = (0, import_express2.default)();
initTelegram();
app.use(import_express2.default.json({ limit: "10mb" }));
app.use("/api", apiRouter);
var index_default = app;
//# sourceMappingURL=index.js.map
