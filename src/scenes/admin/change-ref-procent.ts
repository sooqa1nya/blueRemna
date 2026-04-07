import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { aUserProfileKeyboard } from '../../keyboards/admin.js';
import { setActive, setUserRefProc, updateRefBalance } from '../../database/users.js';
import { aUserProfileText } from '../../utils/text/a-user-profile-text.js';
import { bot } from '../../bot.js';


export const changeRefProcentScene = new Scene('change_ref_procent')
    .params<{ userId: number; }>()
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Введите новый реф. процент (число от 0 до 100)', { reply_markup: sceneCancelKeyboard });
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

        const proc = Number(context.text);

        if (!Number.isInteger(proc) || proc < 0 || proc > 100) {
            return await context.send('Пожалуйста, введите число от 0 до 100', { reply_markup: sceneCancelKeyboard });
        }

        await setUserRefProc(userId, proc);

        await context.send(await aUserProfileText(userId) + `✅ Реферальный процент изменен: <code>${proc}%</code>`, {
            parse_mode: 'HTML',
            reply_markup: aUserProfileKeyboard(userId)
        });

        try {
            await bot.api.sendMessage({
                chat_id: userId,
                parse_mode: 'HTML',
                text: `👤 Персональное сообщение\n\n▶️ Новый реферальный процент: <code>${proc}%</code>`
            });
        } catch {
            await context.send('Пользователь заблокировал бота');
            await setActive(userId, false);
        }

        return await context.scene.exit();
    });