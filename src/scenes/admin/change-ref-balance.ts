import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { aUserProfileKeyboard } from '../../keyboards/admin.js';
import { updateRefBalance } from '../../database/users.js';
import { aUserProfileText } from '../../utils/a-user-profile.js';
import { bot } from '../../index.js';


export const changeRefBalance = new Scene('change_ref_balance')
    .params<{ userId: number; }>()
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

        await context.send(await aUserProfileText(userId) + `\n✅ Баланс изменен: <code>${amount}</code>`, {
            parse_mode: 'HTML',
            reply_markup: aUserProfileKeyboard(userId)
        });

        await bot.api.sendMessage({
            chat_id: userId,
            parse_mode: 'HTML',
            text: `👤 Персональное сообщение\n\n▶️ ${amount > 0 ? 'Начислено на реф. баланс' : 'Списано с реф. баланса'}: <code>${amount}₽</code>`
        });

        return context.scene.exit();
    });