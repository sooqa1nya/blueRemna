import { Composer } from 'gramio';
import { acceptPolicy, findUser, upsertUser } from '../database/users.js';
import { mainMenuKeyboard, policyKeyboard } from '../keyboards/main.js';

export const start = new Composer({ name: 'start' })
    .command('start', async context => {
        if (!context.hasFrom()) {
            return;
        }

        const text = `
<a href="tg://user?id=${context.from.id}">➕ Новый пользователь</a>

- ID: <code>${context.from.id}</code>
- Username: ${context.from.username ? `@${context.from.username}` : '<code>N/A</code>'}
${context.args ? `- Payload: <code>${context.args}</code>` : ''}
    `;

        if (!context.dbuser) {
            try {
                await context.send(text, {
                    chat_id: process.env.LOG_CHAT_ID!,
                    parse_mode: 'HTML'
                });
            } catch { }

            if (context.args) {
                const regex = /id([?<id>0-9]+)/;
                if (regex.test(context.args)) {
                    const match = context.args.match(regex)!;
                    const referrerId = match[1];
                    if (referrerId) {
                        const referrer = await findUser(Number(referrerId));
                        if (referrer) {
                            try {
                                await context.send(`🎉 У вас новый реферал! (@${context.from.username ? '@' + context.from.username : context.from.firstName})`, { chat_id: referrerId });
                            }
                            catch { }
                        }
                    }
                }
            }
        };

        const user = await upsertUser(context.from.id, context.from.username ?? null, context.from.firstName, context.args);
        if (!user?.agreed_policy) {
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
        } else {
            await context.send('🌐 Главное меню', { reply_markup: await mainMenuKeyboard(user.trial_key, context.from.id) });
        }
    })
    .callbackQuery('accept_policy', async context => {
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

        await context.editText(`🌐 Главное меню`, { reply_markup: await mainMenuKeyboard(Boolean(context.dbuser?.trial_key), context.from.id) });
    });