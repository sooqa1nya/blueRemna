import fastify from 'fastify';
import { RemnawaveWebhookCrmEventsDto, RemnawaveWebhookUserEventsDto } from './types.js';
import { bot } from '../../index.js';
import { extendSubKeyboard } from '../../keyboards/sub-payment.js';
import { getProfile } from '../../database/user_profiles.js';
import { urlKeyboard } from '../../keyboards/other.js';

export const serverFastify = () => {
    const server = fastify();

    server.post('/rwwebhook', async (request, reply) => {
        const body = request.body as RemnawaveWebhookUserEventsDto | RemnawaveWebhookCrmEventsDto;
        if (!body.scope) {
            return 'ok';
        }

        if (body.scope == 'user') {
            if (!body.data.telegramId) {
                return 'ok';
            }

            const [sub] = await getProfile(body.data.uuid);

            try {
                if (body.event == 'user.expired') {
                    await bot.api.sendMessage({
                        chat_id: body.data.telegramId,
                        text: `🛑 Доступ ограничен!\n\nСрок вашей подписки <code>${body.data.username}</code> истек. Продлите её сейчас, чтобы оставаться в безопасности и сохранить анонимность. 🔐⚡️`,
                        parse_mode: 'HTML',
                        reply_markup: await extendSubKeyboard(sub.id)
                    });
                } else if (body.event == 'user.expires_in_24_hours') {
                    await bot.api.sendMessage({
                        chat_id: body.data.telegramId,
                        text: `⏳ Внимание!\n\nВаша подписка <code>${body.data.username}</code> истекает через 1 день. Продлите её заранее, чтобы не потерять защиту и сохранить анонимность. 🔐⚡️`,
                        parse_mode: 'HTML',
                        reply_markup: await extendSubKeyboard(sub.id)
                    });
                }
            } catch { }
        } else if (body.scope == 'crm') {
            try {
                if (body.event == 'crm.infra_billing_node_payment_in_48hrs') {
                    await bot.api.sendMessage({
                        chat_id: process.env.LOG_NODE_CRM_ID!,
                        text: `⏳ Срок действия ноды истекает\n\nНода: ${body.data.nodeName}\n\nПровайдер: ${body.data.providerName}`,
                        parse_mode: 'HTML',
                        reply_markup: urlKeyboard('💳 Оплатить', body.data.loginUrl)
                    });
                }
            } catch { }
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