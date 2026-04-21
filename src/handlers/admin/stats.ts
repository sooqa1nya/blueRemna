import { Composer } from 'gramio';
import { bot } from '../../bot.js';
import { getUsers, setActive } from '../../database/users.js';
import { getPaymentStats } from '../../database/payment.js';
import { remnawave } from '../../services/remnawave/index.js';
import {
    statsKeyboard,
    backRefKeyboard
} from '../../keyboards/admin.js';

export const statsAdmin = new Composer({ name: 'admin-stats' })
    .callbackQuery('admin_stats', async context => {
        await context.editText('📋 Статистика', {
            reply_markup: statsKeyboard
        });
        await context.answerCallbackQuery();
    })
    .callbackQuery('general_stats', async context => {
        await context.editText('⏳ Обработка запроса');

        try {
            const users = await getUsers();

            const usersCount = users.length;
            let liveUsers = 0;
            let deathUsers = 0;
            let freeTrials = 0;
            let agreedPolicy = 0;
            let agreedPolicyActive = 0;
            let onlineAt = 0;

            for (const user of users) {
                if (user.trial_key) {
                    freeTrials++;
                }

                if (user.agreed_policy) {
                    agreedPolicy++;
                }

                try {
                    if (!user.is_active) {
                        throw new Error;
                    }

                    if (user.agreed_policy) {
                        agreedPolicyActive++;
                    }

                    await bot.api.sendChatAction({
                        chat_id: user.id,
                        action: 'typing'
                    });
                    liveUsers++;
                } catch {
                    await setActive(user.id, false);
                    deathUsers++;
                }

                const remnaUser = await remnawave.getUserByTelegramId(user.id.toString());
                if (remnaUser && remnaUser.response.length) {
                    for (const element of remnaUser.response) {
                        if (element.userTraffic.onlineAt) {
                            onlineAt++;
                            break;
                        }
                    }
                }

                const usersProcessed = liveUsers + deathUsers;
                if (!(usersProcessed % 50)) {
                    await context.editText(`⏳ Обработано <code>${usersProcessed} (${(usersProcessed * 100 / usersCount).toFixed(2)}%)</code> пользователей`, {
                        parse_mode: 'HTML'
                    });
                }
            }


            const text = `
👤 Всего: <code>${usersCount}</code>
  └ Активных: <code>${agreedPolicy} (${(agreedPolicy * 100 / usersCount).toFixed(2)}%)</code>


🟢 Живых: <code>${liveUsers} (${(liveUsers * 100 / usersCount).toFixed(2)}%)</code>
  └ Активных: <code>${agreedPolicyActive} (${(agreedPolicyActive * 100 / liveUsers).toFixed(2)}%)</code>

🔴 Мертвых: <code>${deathUsers}</code>

🆓 Пробных подписок: <code>${freeTrials} (${(freeTrials * 100 / usersCount).toFixed(2)}%)</code>
🌐 Подключений: <code>${onlineAt} (${(onlineAt * 100 / freeTrials).toFixed(2)}%)</code>
            `;

            await context.editText(text, {
                parse_mode: 'HTML',
                reply_markup: backRefKeyboard
            });
        } catch {
            await context.editText('🚫 Ошибка получения статистики', { reply_markup: backRefKeyboard });
        }
    })
    .callbackQuery('a_payment_stats', async context => {
        const [stats] = await getPaymentStats();
        const text = `
<b>📊 Статистика

💎 Пополнения
  ├ Общая сумма: <code>${stats.sum_all}₽ (${stats.count_all})</code>
  │
  ├ За день: <code>${stats.sum_today}₽ (${stats.count_today})</code>
  ├ За неделю: <code>${stats.sum_week}₽ (${stats.count_week})</code>
  └ За месяц: <code>${stats.sum_month}₽ (${stats.count_month})</code></b>
        `;

        await context.editText(text, {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: backRefKeyboard
        });
    });
