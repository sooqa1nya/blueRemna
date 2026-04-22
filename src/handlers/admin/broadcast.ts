import { Composer, InlineKeyboard } from 'gramio';
import { sceneInit } from '../../plugins/scenes.js';
import { broadcastScene } from '../../scenes/admin/broadcast.js';
import { getActiveUsers, setActive } from '../../database/users.js';
import { withRetries } from 'gramio/utils';
import { bot } from '../../bot.js';
import { scheduler } from 'node:timers/promises';
import { remnawave } from '../../services/remnawave/index.js';
import {
    broadcastMenuKeyboard,
    checkMailingData,
    startMailingData,
    startActiveSubMailingData,
    cancelMailingKeyboard,
    backAdminMenuKeyboard
} from '../../keyboards/admin.js';

const mailingControllers = new Map<number, AbortController>();

export const broadcastAdmin = new Composer({ name: 'admin-broadcast' })
    .extend(sceneInit)
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
        if (context.queryData.id == 0) {
            return await context.answerCallbackQuery('❌ Сначала загрузите пост');
        }

        // Контроллер для рассылки
        const abortController = new AbortController();
        mailingControllers.set(context.from.id, abortController);

        await context.editText('✅ Рассылка запущена', {
            reply_markup: cancelMailingKeyboard
        });
        await context.answerCallbackQuery();

        const users = await getActiveUsers();
        const allUsers = users.length;
        let success = 0;
        let failed = 0;
        for (const user of users) {
            // Отмена рассылки
            if (abortController.signal.aborted) {
                await context.editText(`❌ Рассылка отменена\n\n👤 Отправлено: <code>${success + failed}/${allUsers}</code>\n🟢 Успешно: <code>${success}</code>\n🔴 Заблокировали: <code>${failed}</code>`, {
                    parse_mode: 'HTML',
                    reply_markup: backAdminMenuKeyboard
                });
                mailingControllers.delete(context.from.id);
                return;
            }

            await withRetries(async () => {
                try {
                    await bot.api.copyMessage({
                        chat_id: user.id,
                        from_chat_id: context.from.id,
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

👤 Отправлено: <code>${success + failed}/${allUsers}</code>
🟢 Успешно: <code>${success}</code>
🔴 Заблокировали: <code>${failed}</code>
            `;
            try {
                if (!((success + failed) % 25) || lastMailing) {
                    await context.editText(text, {
                        parse_mode: 'HTML',
                        reply_markup: lastMailing ? new InlineKeyboard() : cancelMailingKeyboard
                    });
                }
            } catch {
                if (lastMailing) {
                    await context.send(text, {
                        parse_mode: 'HTML',
                        reply_markup: lastMailing ? new InlineKeyboard() : cancelMailingKeyboard
                    });
                }
            }

            await scheduler.wait(4000);
        }

        mailingControllers.delete(context.from.id);
    })

    .callbackQuery(startActiveSubMailingData, async context => {
        if (context.queryData.id == 0) {
            return await context.answerCallbackQuery('❌ Сначала загрузите пост');
        }

        const abortController = new AbortController();
        mailingControllers.set(context.from.id, abortController);

        await context.editText('✅ Рассылка запущена', {
            reply_markup: cancelMailingKeyboard
        });
        await context.answerCallbackQuery();

        // Получаем общее число пользователей
        const rwUsers = await remnawave.getUsers({ size: 1 });
        if (!rwUsers) {
            mailingControllers.delete(context.from.id);
            return await context.answerCallbackQuery('❌ Ошибка получения пользователей из RemnaWave');
        }

        // Собираем всех пользователей с активной подпиской
        let users = [];
        for (let i = 0; i <= rwUsers.response.total; i) {
            const tempUsers = await remnawave.getUsers({ size: 50, start: i });
            if (!tempUsers) {
                continue;
            }

            users.push(...tempUsers.response.users.filter((x) => (x.status === 'ACTIVE' || x.status === 'LIMITED') && x.telegramId));
            i += 50;
        }

        const allUsers = users.length;
        let success = 0;
        let failed = 0;

        for (const user of users) {
            if (abortController.signal.aborted) {
                await context.editText(`❌ Рассылка отменена\n\n👤 Отправлено: <code>${success + failed}/${allUsers}</code>\n🟢 Успешно: <code>${success}</code>\n🔴 Заблокировали: <code>${failed}</code>`, {
                    parse_mode: 'HTML',
                    reply_markup: backAdminMenuKeyboard
                });
                mailingControllers.delete(context.from.id);
                return;
            }

            await withRetries(async () => {
                try {
                    await bot.api.copyMessage({
                        chat_id: user.telegramId!,
                        from_chat_id: context.from.id,
                        message_id: context.queryData.id
                    });
                    success += 1;
                } catch {
                    failed += 1;
                    try { await setActive(user.id, false); } catch { }
                }
            });

            const lastMailing: boolean = (success + failed) == users.length;

            const text = `
${!lastMailing ? '🔄 Рассылка' : '✅ Рассылка завершена'}

👤 Отправлено: <code>${success + failed}/${allUsers}</code>
🟢 Успешно: <code>${success}</code>
🔴 Заблокировали: <code>${failed}</code>
            `;

            try {
                if (!((success + failed) % 25) || lastMailing) {
                    await context.editText(text, {
                        parse_mode: 'HTML',
                        reply_markup: lastMailing ? new InlineKeyboard() : cancelMailingKeyboard
                    });
                }
            } catch {
                if (lastMailing) {
                    await context.send(text, {
                        parse_mode: 'HTML',
                        reply_markup: lastMailing ? new InlineKeyboard() : cancelMailingKeyboard
                    });
                }
            }

            await scheduler.wait(40);
        }

        mailingControllers.delete(context.from.id);
    })

    .callbackQuery('cancel_mailing', async context => {
        const controller = mailingControllers.get(context.from.id);
        if (controller) {
            controller.abort();
            await context.answerCallbackQuery('🛑 Отмена рассылки...');
        } else {
            await context.answerCallbackQuery('❌ Рассылка не найдена');
        }
    });
