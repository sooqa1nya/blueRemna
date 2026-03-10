import fastify from 'fastify';
import { RemnawaveWebhookUserEventsDto } from './types.js';
import { bot } from '../../index.js';
import { extendSubKeyboard } from '../../keyboards/sub-payment.js';
import { getProfile } from '../../database/user_profiles.js';

export const serverFastify = () => {
    const server = fastify();

    server.post('/rwwebhook', async (request, reply) => {
        const body = request.body as RemnawaveWebhookUserEventsDto;
        if (!body.scope) {
            return 'ok';
        }

        if (body.scope == 'user') {
            if (!body.data.telegramId) {
                return 'ok';
            }

            const [sub] = await getProfile(body.data.uuid);

            if (body.event == 'user.expired') {
                await bot.api.sendMessage({
                    chat_id: body.data.telegramId,
                    text: `🛑 Доступ ограничен! Срок вашей подписки <code>${body.data.username}</code> истек. Продлите её сейчас, чтобы оставаться в безопасности и сохранить анонимность. 🔐⚡️`,
                    parse_mode: 'HTML',
                    reply_markup: await extendSubKeyboard(sub.id)
                });
            } else if (body.event == 'user.expires_in_24_hours') {
                await bot.api.sendMessage({
                    chat_id: body.data.telegramId,
                    text: `⏳ Внимание! Ваша подписка <code>${body.data.username}</code> истекает через 1 день. Продлите её заранее, чтобы не потерять защиту и сохранить анонимность. 🔐⚡️`,
                    parse_mode: 'HTML',
                    reply_markup: await extendSubKeyboard(sub.id)
                });
            }
        }

        return 'ok';
    });

    server.listen({ host: '0.0.0.0', port: 6663 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
};