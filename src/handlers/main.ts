import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { acceptPolicy, findUser } from '../database/users.js';
import { mainMenuKeyboard } from '../keyboards/index.js';

export const handleAcceptPolicy = async (context: CallbackQueryShorthandContext<Bot, 'accept_policy'>) => {
    try {
        await acceptPolicy(context.from.id);
    } catch (error) {
        await context.answerCallbackQuery('❌ Ошибка. Пожалуйста, обратитесь в поддержку.');
        console.error(error);
        return;
    }
    await context.answerCallbackQuery('✅ Политика принята!');
    await handleMainMenu(context);
};

export const handleMainMenu = async (context: CallbackQueryShorthandContext<Bot, 'main_menu'>) => {
    const user = await findUser(context.from.id);
    await context.editText('💮 Навигация', { reply_markup: await mainMenuKeyboard(Boolean(user?.trial_key)) });
};