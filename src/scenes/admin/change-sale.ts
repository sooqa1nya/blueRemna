import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { aUserProfileKeyboard } from '../../keyboards/admin.js';
import { setActive, setUserSale } from '../../database/users.js';
import { aUserProfileText } from '../../utils/text/a-user-profile-text.js';
import { bot } from '../../bot.js';


export const changeSaleScene = new Scene('change_sale')
    .params<{ userId: string; }>()
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Введите новую скидку в процентах (число от 0 до 100)', { reply_markup: sceneCancelKeyboard });
        }

        const userId = context.scene.params.userId;
        if (context.is("callback_query")) {
            await context.send(await aUserProfileText(userId), {
                parse_mode: 'HTML',
                reply_markup: aUserProfileKeyboard(userId)
            });
            await context.answerCallbackQuery();
            return await context.scene.exit();
        }

        const sale = Number(context.text);

        if (!Number.isInteger(sale) || sale < 0 || sale > 100) {
            return await context.send('Пожалуйста, введите число от 0 до 100', { reply_markup: sceneCancelKeyboard });
        }

        await setUserSale(userId, sale);

        await context.send(await aUserProfileText(userId) + '✅ Скидка изменена', {
            parse_mode: 'HTML',
            reply_markup: aUserProfileKeyboard(userId)
        });

        try {
            await bot.api.sendMessage({
                chat_id: userId,
                parse_mode: 'HTML',
                text: `👤 Персональное сообщение\n\n▶️ Новая личная скидка: <code>${sale}%</code>`
            });
        } catch {
            await context.send('Пользователь заблокировал бота');
            await setActive(userId, false);
        }

        return await context.scene.exit();
    });