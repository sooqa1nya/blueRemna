import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { backToMainMenuKeyboard } from '../keyboards/main.js';
import { findPayloadCount } from '../database/users.js';

export const handleAffiliateProgram = async (context: CallbackQueryShorthandContext<Bot, 'affiliate_program'>) => {
    const [referals] = await findPayloadCount(`id${context.from.id}`);

    const text = `
<b>⏺️ Партнерская программа:</b>

👤 Рефералы: <code>${referals!.count}</code>
💳 Баланс: <code>${context.dbuser?.ref_balance}₽</code>
🔄 Процент: <code>${context.dbuser?.ref_proc}%</code>

▶️ Реферальная ссылка:
<code>https://t.me/lightbluevpn_bot?start=id${context.from.id}</code>
`;

    await context.editText(text, {
        reply_markup: backToMainMenuKeyboard,
        parse_mode: 'HTML'
    });
};