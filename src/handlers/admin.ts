import { Composer } from 'gramio';
import { globalDiscountScene } from '../scenes/admin/global-discount.js';
import { aChangeUserRefBalanceData, aChangeUserRefProcData, aChangeUserSaleData, adminMenuKeyboard, aUserProfileKeyboard, aUserSubData, backAdminMenuKeyboard, backAUserProfileData, backAUserProfileKeyboard, backRefKeyboard, broadcastMenuKeyboard, checkMailingData, startMailingData, statsKeyboard } from '../keyboards/admin.js';
import { sceneInit } from '../plugins/scenes.js';
import { broadcastScene } from '../scenes/admin/broadcast.js';
import { getActiveUsers, getUsers, setActive } from '../database/users.js';
import { withRetries } from 'gramio/utils';
import { bot } from '../index.js';
import { scheduler } from 'node:timers/promises';
import { refStats } from '../scenes/admin/ref-stats.js';
import { refGenerate } from '../utils/ref-generate.js';
import { remnawave } from '../services/remnawave/index.js';
import { getPaid, getPaidSubs } from '../database/payment.js';
import { aFindUserProfile } from '../scenes/admin/find-user-profile.js';
import { aUserProfileText } from '../utils/a-user-profile.js';
import { changeSale } from '../scenes/admin/change-sale.js';
import { changeRefBalance } from '../scenes/admin/change-ref-balance.js';
import { changeRefProcent } from '../scenes/admin/change-ref-procent.js';


export const admin = new Composer({ name: 'admin' })
    .guard(context => !!context.dbuser?.is_admin)
    .extend(sceneInit)
    .command('a', async context => {
        await context.send('💮 Админ-панель', {
            reply_markup: await adminMenuKeyboard()
        });
    })

    .callbackQuery('a', async context => {
        await context.editText('💮 Админ-панель', {
            reply_markup: await adminMenuKeyboard()
        });
        await context.answerCallbackQuery();
    })

    .callbackQuery('change_discount', async context => {
        await context.scene.enter(globalDiscountScene);
    })

    .callbackQuery('broadcast_settings', async context => {
        await context.editText('Меню рассылки', {
            reply_markup: broadcastMenuKeyboard()
        });
    })

    .callbackQuery('change_post', async context => {
        await context.scene.enter(broadcastScene);
    })

    .callbackQuery(checkMailingData, async context => {
        if (context.queryData.id == 0)
            await context.answerCallbackQuery('❌ Сначала загрузите пост');

        await context.message?.copy({ message_id: context.queryData.id });
        await context.answerCallbackQuery();
    })

    .callbackQuery(startMailingData, async context => {
        if (context.queryData.id == 0)
            await context.answerCallbackQuery('❌ Сначала загрузите пост');

        await context.answerCallbackQuery();

        await context.editText('✅ Рассылка запущена');

        const users = await getActiveUsers();
        let success = 0;
        let failed = 0;
        for (const user of users) {
            await withRetries(async () => {
                try {
                    await bot.api.copyMessage({
                        chat_id: user.id,
                        from_chat_id: context.chatId as number,
                        message_id: context.queryData.id
                    });
                    success += 1;
                } catch {
                    failed += 1;
                    await setActive(user.id, false);
                }
            });

            const lastMailing: boolean = (success + failed) == users.length;

            const text = `
${!lastMailing ? '🔄 Рассылка' : '✅ Рассылка завершена'}

👤 Всего: <code>${success + failed}</code>
🟢 Успешно: <code>${success}</code>
🔴 С ошибкой: <code>${failed}</code>
            `;

            try {
                if (!((success + failed) % 25) || lastMailing) {
                    await context.editText(text, { parse_mode: 'HTML' });
                }
            } catch {
                if (lastMailing) {
                    await context.send(text, { parse_mode: 'HTML' });
                }
            }

            await scheduler.wait(100);
        }
    })

    .callbackQuery('admin_stats', async context => {
        await context.editText('📋 Статистика', {
            reply_markup: statsKeyboard
        });
        await context.answerCallbackQuery();
    })

    .callbackQuery('ref_stats', async context => {
        await context.scene.enter(refStats);
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
    })

    .callbackQuery('general_stats', async context => {
        await context.editText('⏳ Обработка запроса');

        try {
            const users = await getUsers();

            let liveUsers = 0;
            let deathUsers = 0;
            const freeTrials = users.filter(x => x.trial_key).length;
            let onlineAt = 0;

            for (const user of users) {
                try {
                    if (!user.is_active) {
                        throw new Error;
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
                if (!remnaUser || !remnaUser.response.length)
                    continue;

                for (const element of remnaUser.response) {
                    if (element.userTraffic.onlineAt) {
                        onlineAt++;
                        continue;
                    }
                }

                const countUsers = liveUsers + deathUsers;
                if (!(countUsers % 50)) {
                    await context.editText(`⏳ Обработано ${countUsers} пользователей`);
                }

                if (user.is_active) {
                    await scheduler.wait(100);
                }
            }


            const text = `
👤 Всего: <code>${users.length}</code>
🟢 Живых: <code>${liveUsers}</code>
🔴 Мертвых: <code>${deathUsers}</code>

🆓 Пробных подписок: <code>${freeTrials}</code>
🌐 Подключений: <code>${onlineAt}</code>
💳 Оплачено подписок: <code>${(await getPaid()).length}</code>
💰 Получено: <code>${await getPaidSubs()}₽</code>
            `;

            await context.editText(text, {
                parse_mode: 'HTML',
                reply_markup: backRefKeyboard
            });
        } catch {
            await context.editText('🚫 Ошибка получения статистики', { reply_markup: backRefKeyboard });
        }
    })

    .callbackQuery('admin_user_profile', async context => {
        await context.scene.enter(aFindUserProfile);
    })

    .callbackQuery(backAUserProfileData, async context => {
        await context.editText(await aUserProfileText(context.queryData.i), {
            parse_mode: 'HTML',
            reply_markup: aUserProfileKeyboard(context.queryData.i)
        });
    })

    .callbackQuery(aChangeUserSaleData, async context => {
        await context.scene.enter(changeSale, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aChangeUserRefBalanceData, async context => {
        await context.scene.enter(changeRefBalance, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aChangeUserRefProcData, async context => {
        await context.scene.enter(changeRefProcent, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aUserSubData, async context => {
        await context.editText('В разработке..',
            {
                reply_markup: backAUserProfileKeyboard(context.queryData.i)
            }
        );
    });