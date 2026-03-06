import { Composer } from 'gramio';
import { findPayloadCount } from '../database/users.js';
import { refKeyboard } from '../keyboards/affiliate-program.js';

export const affilianteProgram = new Composer({ name: 'affilianteProgram' })
    .callbackQuery('affiliate_program', async context => {
        const [referals] = await findPayloadCount(`id${context.from.id}`);
        const refUrl = `https://t.me/lightbluevpn_bot?start=id${context.from.id}`;

        const text = `
<b>⏺️ Партнерская программа</b>

👤 Рефералы: <code>${referals!.count}</code>
💳 Баланс: <code>${context.dbuser?.ref_balance}₽</code>
🔄 Процент: <code>${context.dbuser?.ref_proc}%</code>

ℹ️ Инфоримация:
<i> - Приводи друзей и получай бонусы
 - За каждого реферала ты получаешь ${context.dbuser?.ref_proc}% от его пополнения
 - Накопленные средства можно потратить на любую транзацию в боте</i> 

▶️ Реферальная ссылка:
<code>${refUrl}</code>
`;

        await context.editText(text, {
            reply_markup: refKeyboard(refUrl),
            parse_mode: 'HTML'
        });
    });