import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { adminMenuKeyboard, aUserProfileKeyboard } from '../../keyboards/admin.js';
import { findUser } from '../../database/users.js';
import { aUserProfileText } from '../../utils/a-user-profile.js';


export const aFindUserProfile = new Scene('a_find_user_profile')
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Отправьте id пользователя', { reply_markup: sceneCancelKeyboard });
        }

        if (context.is("callback_query")) {
            await context.send('💮 Админ-панель', {
                reply_markup: await adminMenuKeyboard()
            });
            await context.answerCallbackQuery();
            return context.scene.exit();
        }

        const userId = Number(context.text);
        if (!Number.isInteger(userId)) {
            return await context.send('Некорректный формат.. Попробуйте снова', { reply_markup: sceneCancelKeyboard });
        }

        const user = await findUser(userId);
        if (!user) {
            return await context.send('Пользователь не найден.. Попробуйте снова', { reply_markup: sceneCancelKeyboard });
        }

        console.log(1);
        const text = await aUserProfileText(userId);
        console.log(2);
        console.log(text);

        await context.send(text, {
            parse_mode: 'HTML',
            reply_markup: aUserProfileKeyboard(userId)
        });

        return context.scene.exit();
    });