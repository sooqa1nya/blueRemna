import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { aUserProfileKeyboard } from '../../keyboards/admin.js';
import { setActive, updateRefBalance } from '../../database/users.js';
import { aUserProfileText } from '../../utils/text/a-user-profile-text.js';
import { bot } from '../../bot.js';


export const changeRefBalanceScene = new Scene('change_ref_balance')
    .params<{ userId: string; }>()
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Отправьте сколько добавить или списать с реф. баланса (100, -100)', { reply_markup: sceneCancelKeyboard });
        }

        const userId = context.scene.params.userId;
        if (context.is("callback_query")) {
            await context.send(await aUserProfileText(userId), {
                parse_mode: 'HTML',
                reply_markup: aUserProfileKeyboard(userId)
            });
            await context.answerCallbackQuery();
            return context.scene.exit();
        }

        const amount = Number(context.text);

        if (!Number.isInteger(amount) || amount == 0) {
            return await context.send('Пожалуйста, введите число', { reply_markup: sceneCancelKeyboard });
        }

        await updateRefBalance(userId, amount);

        await context.send(await aUserProfileText(userId) + `✅ Баланс изменен: <code>${amount}</code>`, {
            parse_mode: 'HTML',
            reply_markup: aUserProfileKeyboard(userId)
        });

        try {
            await bot.api.sendMessage({
                chat_id: userId,
                parse_mode: 'HTML',
                text: `👤 Персональное сообщение\n\n▶️ ${amount > 0 ? 'Начислено на реф. баланс' : 'Списано с реф. баланса'}: <code>${amount}₽</code>`
            });
        } catch {
            await context.send('Пользователь заблокировал бота');
            await setActive(userId, false);
        }

        return await context.scene.exit();
    });