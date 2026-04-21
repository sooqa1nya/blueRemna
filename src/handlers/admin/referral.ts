import { Composer } from 'gramio';
import { sceneInit } from '../../plugins/scenes.js';
import { refStatsScene } from '../../scenes/admin/ref-stats.js';
import { refGenerate } from '../../utils/ref-generate.js';
import { backAdminMenuKeyboard } from '../../keyboards/admin.js';

export const referralAdmin = new Composer({ name: 'admin-referral' })
    .extend(sceneInit)
    .callbackQuery('ref_stats', async context => {
        await context.scene.enter(refStatsScene);
    })
    .callbackQuery('ref_generate', async context => {
        const ref = refGenerate();

        const text = `
<b>✅ Реферальная ссылка создана</b>

📌 Реф: <code>${ref}</code>
🔗 Ссылка: <code>https://t.me/lightbluevpn_bot?start=${ref}</code>
        `;

        await context.editText(text, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: backAdminMenuKeyboard
        });
    });
