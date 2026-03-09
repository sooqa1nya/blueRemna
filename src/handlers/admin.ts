import { Composer } from 'gramio';
import { globalDiscountScene } from '../scenes/global-discount.js';
import { adminMenuKeyboard, broadcastMenuKeyboard, checkMailingData, startMailingData, statsKeyboard } from '../keyboards/admin.js';
import { sceneInit } from '../plugins/scenes.js';
import { broadcastScene } from '../scenes/broadcast.js';
import { getActiveUsers, setActive } from '../database/users.js';
import { withRetries } from 'gramio/utils';
import { bot } from '../index.js';
import { scheduler } from 'node:timers/promises';
import { refStats } from '../scenes/ref-stats.js';


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
    });