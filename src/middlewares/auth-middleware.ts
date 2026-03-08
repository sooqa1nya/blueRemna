import { Bot, Context } from 'gramio';
import { policyKeyboard } from '../keyboards/index.js';
import { updateUserActivity } from '../database/users.js';

export const authMiddleware = async (context: Context<Bot>, next: () => Promise<unknown>) => {
    if (context.is('message') || context.is('callback_query')) {
        const isStartCommand = context.is('message') && context.text && /^\/start/.test(context.text);
        const isAcceptPolicyCallback = context.is('callback_query') && context.data === 'accept_policy';

        if (isStartCommand || isAcceptPolicyCallback) {
            return await next();
        }

        if (!context.dbuser) {
            if (context.is('callback_query')) await context.answerCallbackQuery();
            await context.send('❗️ Пожалуйста, сначала отправьте /start');
            return;
        }

        await updateUserActivity(context.from.id);

        if (!context.dbuser?.agreed_policy) {
            if (context.is('callback_query')) await context.answerCallbackQuery();
            await context.send('❗️ Перед использованием бота необходимо согласиться с политикой', { reply_markup: policyKeyboard });
            return;
        }
    }

    await next();
};