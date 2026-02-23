import { Bot, Context } from 'gramio';
import { upsertUser } from '../database/users.js';
import { policyKeyboard } from '../keyboards/index.js';

export const authMiddleware = async (context: Context<Bot>, next: () => Promise<unknown>) => {
    if (context.is('message') || context.is('inline_query') || context.is('callback_query')) {
        const isStartCommand = context.is('message') && context.text && /^\/start/.test(context.text);
        const isAcceptPolicyCallback = context.is('callback_query') && context.data === 'accept_policy';

        if (isStartCommand || isAcceptPolicyCallback) {
            return await next();
        }

        const user = await upsertUser(context.from.id, context.from.username ?? null, context.from.firstName, null);

        if (!user) {
            if (!context.is('inline_query')) await context.send('Ошибка');
            return;
        }

        context.dbuser = user;

        if (!user?.agreed_policy) {
            if (!context.is('inline_query')) await context.send('❗️ Перед использованием бота необходимо согласиться с политикой', { reply_markup: policyKeyboard });
            return;
        }
    }

    await next();
};