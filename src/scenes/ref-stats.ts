import { Scene } from '@gramio/scenes';
import { adminMenuKeyboard, backAdminMenuKeyboard } from '../keyboards/admin.js';
import { sceneCancelKeyboard } from '../keyboards/scene-cancel.js';
import { getUsersPayload } from '../database/users.js';
import { getPaymentPayload } from '../database/payment.js';
import { remnawave } from '../services/remnawave/index.js';
import { IUser } from '../types/database.js';


export const refStats = new Scene('refStats')
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
        const users: IUser[] = context.scene.state.users;

        const liveUsers = users.filter(x => x.is_active).length;
        const deathUsers = users.length - liveUsers;
        const freeTrials = users.filter(x => x.trial_key).length;
        let onlineAt = 0;

        for (const user of users) {
            const remnaUser = await remnawave.getUserByTelegramId(user.id.toString());
            if (!remnaUser || !remnaUser.response.length)
                continue;

            for (const element of remnaUser.response) {
                if (element.userTraffic.onlineAt) {
                    onlineAt++;
                    continue;
                }
            }
        }


        const text = `
🔗 Реферальная ссылка: <code>${context.scene.state.ref}</code>

👤 Всего: <code>${users.length}</code>
🟢 Живых: <code>${liveUsers}</code>
🔴 Мертвых: <code>${deathUsers}</code>

🆓 Пробных подписок: <code>${freeTrials}</code>
🌐 Подключений: <code>${onlineAt}</code>
💳 Оплачено подписок: <code>${(await getPaymentPayload(context.scene.state.ref)).length}</code>
        `;

        await context.send(text, {
            parse_mode: 'HTML',
            reply_markup: backAdminMenuKeyboard
        });

        return context.scene.exit();
    });