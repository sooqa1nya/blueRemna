import { Scene } from '@gramio/scenes';
import { adminMenuKeyboard, retryRefStatsKeyboard } from '../../keyboards/admin.js';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { getUsersPayload, setActive } from '../../database/users.js';
import { getPaymentPayload } from '../../database/payment.js';
import { remnawave } from '../../services/remnawave/index.js';
import { IUser } from '../../database/types.js';
import { bot } from '../../bot.js';


export const refStatsScene = new Scene('ref_stats')
    .step(['message', 'callback_query'], async context => {
        if (context.scene.step.firstTime) {
            return await context.editText('Отправьте реферальную ссылку', { reply_markup: sceneCancelKeyboard });
        }

        if (context.is("callback_query")) {
            await context.send('💮 Админ-панель', {
                reply_markup: await adminMenuKeyboard()
            });
            await context.answerCallbackQuery();
            return context.scene.exit();
        }

        if (!context.text) {
            return await context.send('Пользователи с такой реф. ссылкой не найдены, попробуйте снова', { reply_markup: sceneCancelKeyboard });
        }

        const getRef = context.text.match(/https:\/\/t.me\/\w+\?start=(?<ref>\w+)/);
        const ref = getRef ? getRef[1] : context.text;

        const users = await getUsersPayload(ref);
        if (!users.length) {
            return await context.send('Пользователи с такой реф. ссылкой не найдены, попробуйте снова', { reply_markup: sceneCancelKeyboard });
        }

        await context.scene.update({
            ref,
            users
        });
    })

    .step(['message', 'callback_query'], async context => {
        const message = await context.send('⏳ Обработка запроса');
        const users: IUser[] = context.scene.state.users;

        let liveUsers = 0;
        let deathUsers = 0;
        let freeTrials = 0;
        let agreedPolicy = 0;
        let onlineAt = 0;

        for (const user of users) {
            if (user.trial_key) {
                freeTrials++;
            }

            if (user.agreed_policy) {
                agreedPolicy++;
            }

            try {
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
                await message.editText(`⏳ Обработано ${countUsers} пользователей`);
            }
        }

        const text = `
🔗 Реферальная ссылка: <code>${context.scene.state.ref}</code>
📜 Авторизировалось: <code>${agreedPolicy} (${(agreedPolicy * 100 / users.length).toFixed(2)}%)</code>

👤 Всего: <code>${users.length}</code>
🟢 Живых: <code>${liveUsers} (${(liveUsers * 100 / users.length).toFixed(2)}%)</code>
🔴 Мертвых: <code>${deathUsers}</code>

🆓 Пробных подписок: <code>${freeTrials}</code>
🌐 Подключений: <code>${onlineAt} (${(onlineAt * 100 / freeTrials).toFixed(2)}%)</code>
💳 Оплачено подписок: <code>${(await getPaymentPayload(context.scene.state.ref)).length}</code>
        `;

        await message.editText(text, {
            parse_mode: 'HTML',
            reply_markup: retryRefStatsKeyboard
        });

        return await context.scene.exit();
    });