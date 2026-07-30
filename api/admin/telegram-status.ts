import { superadminOnly, getAdminChatCount } from '../../server/backendCore';

export default async function handler(req: any, res: any) {
  if (!await superadminOnly(req, res)) return;
  res.json({
    botUsername: 'menuquickadmin_bot',
    adminChatCount: getAdminChatCount(),
    instructions: 'Send /start or <restaurant_id>-YYYY-MM-DD to @menuquickadmin_bot in Telegram'
  });
}
