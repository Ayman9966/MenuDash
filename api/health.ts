import { SUPABASE_URL, getAdminChatCount } from '../server/backendCore';

export default async function handler(req: any, res: any) {
  res.json({ status: "ok", supabaseConnected: !!SUPABASE_URL, telegramAdmins: getAdminChatCount() });
}
