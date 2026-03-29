import { Bot, Context } from 'gramio';
import { policyKeyboard } from '../keyboards/index.js';
import { updateUserActivity, upsertUser } from '../database/users.js';

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

        await upsertUser(
            context.from.id,
            context.from.username || null,
            context.from.firstName,
            null
        );

        if (!context.dbuser?.agreed_policy) {
            if (context.is('callback_query')) await context.answerCallbackQuery();
            const text = `
❗️ Привет, перед использованием бота необходимо ознакомиться и согласиться с информацией:

[📜 Пользовательское соглашение (кликабельно)](${process.env.USER_AGREEMENT_URL!})
[🔒 Политика конфиденциальности (кликабельно)](${process.env.PRIVACY_POLICY_URL!})
            `;

            await context.send(text, {
                reply_markup: policyKeyboard,
                link_preview_options: { is_disabled: true },
                parse_mode: 'Markdown'
            });
            return;
        }
    }

    await next();
};