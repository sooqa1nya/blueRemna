import { Composer } from 'gramio';
import { globalDiscountScene } from '../scenes/admin/global-discount.js';
import { aChangeUserRefBalanceData, aChangeUserRefProcData, aChangeUserSaleData, adminAddClientData, adminListOsKeyboard, adminlistVpnClientsKeyboard, adminMenuKeyboard, adminVpnClientData, adminVpnClientProfileKeyboard, adminVpnClientsListData, aUserProfileKeyboard, aUserSubData, backAdminMenuKeyboard, backAUserProfileData, backAUserProfileKeyboard, backRefKeyboard, broadcastMenuKeyboard, changeClientPriorityData, changeStyleButtonKeyboard, checkMailingData, chooseButtonStyleData, deleteVpnClientData, linkVpnClientData, nameVpnClientData, newButtonStyleData, startActiveSubMailingData, startMailingData, statsKeyboard } from '../keyboards/admin.js';
import { sceneInit } from '../plugins/scenes.js';
import { broadcastScene } from '../scenes/admin/broadcast.js';
import { getActiveUsers, getUsers, setActive } from '../database/users.js';
import { withRetries } from 'gramio/utils';
import { bot } from '../bot.js';
import { scheduler } from 'node:timers/promises';
import { refStatsScene } from '../scenes/admin/ref-stats.js';
import { refGenerate } from '../utils/ref-generate.js';
import { remnawave } from '../services/remnawave/index.js';
import { getPaymentStats } from '../database/payment.js';
import { aFindUserProfileScene } from '../scenes/admin/find-user-profile.js';
import { aUserProfileText } from '../utils/text/a-user-profile-text.js';
import { changeSaleScene } from '../scenes/admin/change-sale.js';
import { changeRefBalanceScene } from '../scenes/admin/change-ref-balance.js';
import { changeRefProcentScene } from '../scenes/admin/change-ref-procent.js';
import { addVpnClientScene } from '../scenes/admin/add-vpn-client.js';
import { changeVpnClientButtonStyle, deleteVpnClient, updateVpnClientPriority } from '../database/vpn_clients.js';
import { clientInfoText } from '../utils/text/a-client-info-text.js';
import { changeVpnClientNameScene } from '../scenes/admin/change-vpn-client-name.js';
import { changeVpnClientLinkScene } from '../scenes/admin/change-vpn-client-link.js';


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
        if (context.queryData.id == 0) {
            return await context.answerCallbackQuery('❌ Сначала загрузите пост');
        }

        await context.editText('✅ Рассылка запущена');
        await context.answerCallbackQuery();

        const users = await getActiveUsers();
        const allUsers = users.length;
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

👤 Отправлено: <code>${success + failed}/${allUsers}</code>
🟢 Успешно: <code>${success}</code>
🔴 Заблокировали: <code>${failed}</code>
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

            await scheduler.wait(40);
        }
    })

    .callbackQuery(startActiveSubMailingData, async context => {
        if (context.queryData.id == 0) {
            return await context.answerCallbackQuery('❌ Сначала загрузите пост');
        }

        await context.editText('✅ Рассылка запущена');
        await context.answerCallbackQuery();

        // Получаем общее число пользователей
        const rwUsers = await remnawave.getUsers({ size: 1 });
        if (!rwUsers) {
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
            await withRetries(async () => {
                try {
                    await bot.api.copyMessage({
                        chat_id: user.telegramId!,
                        from_chat_id: context.chatId as number,
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
                    await context.editText(text, { parse_mode: 'HTML' });
                }
            } catch {
                if (lastMailing) {
                    await context.send(text, { parse_mode: 'HTML' });
                }
            }

            await scheduler.wait(40);
        }
    })

    .callbackQuery('admin_stats', async context => {
        await context.editText('📋 Статистика', {
            reply_markup: statsKeyboard
        });
        await context.answerCallbackQuery();
    })

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
    })

    .callbackQuery('general_stats', async context => {
        await context.editText('⏳ Обработка запроса');

        try {
            const users = await getUsers();

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

                const countUsers = liveUsers + deathUsers;
                if (!(countUsers % 50)) {
                    await context.editText(`⏳ Обработано ${countUsers} пользователей`);
                }
            }


            const text = `
👤 Всего: <code>${users.length}</code>
  └ Активных: <code>${agreedPolicy} (${(agreedPolicy * 100 / users.length).toFixed(2)}%)</code>


🟢 Живых: <code>${liveUsers} (${(liveUsers * 100 / users.length).toFixed(2)}%)</code>
  └ Активных: <code>${agreedPolicyActive} (${(agreedPolicyActive * 100 / liveUsers).toFixed(2)}%)</code>

🔴 Мертвых: <code>${deathUsers}</code>

🆓 Пробных подписок: <code>${freeTrials} (${(freeTrials * 100 / users.length).toFixed(2)}%)</code>
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

    .callbackQuery('admin_user_profile', async context => {
        await context.scene.enter(aFindUserProfileScene);
    })

    .callbackQuery(backAUserProfileData, async context => {
        await context.editText(await aUserProfileText(context.queryData.i), {
            parse_mode: 'HTML',
            reply_markup: aUserProfileKeyboard(context.queryData.i)
        });
    })

    .callbackQuery(aChangeUserSaleData, async context => {
        await context.scene.enter(changeSaleScene, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aChangeUserRefBalanceData, async context => {
        await context.scene.enter(changeRefBalanceScene, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aChangeUserRefProcData, async context => {
        await context.scene.enter(changeRefProcentScene, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aUserSubData, async context => {
        await context.editText('В разработке..',
            {
                reply_markup: backAUserProfileKeyboard(context.queryData.i)
            }
        );
    })

    .callbackQuery('admin_clients', async context => {
        await context.editText('Список ОС',
            {
                reply_markup: await adminListOsKeyboard()
            }
        );
    })

    .callbackQuery(adminVpnClientsListData, async context => {
        await context.editText('Список клиентов',
            {
                reply_markup: await adminlistVpnClientsKeyboard(context.queryData.id)
            }
        );
    })

    .callbackQuery(adminAddClientData, async context => {
        await context.scene.enter(addVpnClientScene, {
            osId: context.queryData.os
        });
    })

    .callbackQuery(adminVpnClientData, async context => {
        await context.editText(await clientInfoText(context.queryData.id), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: await adminVpnClientProfileKeyboard(context.queryData.os, context.queryData.id)
        });
    })

    .callbackQuery(changeClientPriorityData, async context => {
        await updateVpnClientPriority(context.queryData.id, context.queryData.value);
        await context.answerCallbackQuery();

        await context.editText(await clientInfoText(context.queryData.id), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: await adminVpnClientProfileKeyboard(context.queryData.os, context.queryData.id)
        });
    })

    .callbackQuery(deleteVpnClientData, async context => {
        await deleteVpnClient(context.queryData.id);
        await context.answerCallbackQuery();

        await context.editText('Список клиентов', {
            reply_markup: await adminlistVpnClientsKeyboard(context.queryData.os)
        });
    })

    .callbackQuery(nameVpnClientData, async context => {
        await context.scene.enter(changeVpnClientNameScene, {
            osId: context.queryData.os,
            clientId: context.queryData.id
        });
    })

    .callbackQuery(linkVpnClientData, async context => {
        await context.scene.enter(changeVpnClientLinkScene, {
            osId: context.queryData.os,
            clientId: context.queryData.id
        });
    })

    .callbackQuery(chooseButtonStyleData, async context => {
        await context.editText('Выберите стиль кнопки', {
            reply_markup: await changeStyleButtonKeyboard(context.queryData.os, context.queryData.id)
        });
    })

    .callbackQuery(newButtonStyleData, async context => {
        const style: string | null = context.queryData.style ? context.queryData.style : null;
        await changeVpnClientButtonStyle(context.queryData.id, style);
        await context.answerCallbackQuery();

        await context.editText(await clientInfoText(context.queryData.id), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: await adminVpnClientProfileKeyboard(context.queryData.os, context.queryData.id)
        });
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
