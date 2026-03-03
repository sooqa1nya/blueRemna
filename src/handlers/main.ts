import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { acceptPolicy } from '../database/users.js';
import { mainMenuKeyboard } from '../keyboards/index.js';

export const handleAcceptPolicy = async (context: CallbackQueryShorthandContext<Bot, 'accept_policy'>) => {
    if (!context.dbuser) {
        await context.answerCallbackQuery();
        await context.send('❗️ Пожалуйста, сначала отправьте /start');
        return;
    }
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
    await context.editText(`🌐 Главное меню`, { reply_markup: await mainMenuKeyboard(Boolean(context.dbuser?.trial_key), context.from.id) });
};