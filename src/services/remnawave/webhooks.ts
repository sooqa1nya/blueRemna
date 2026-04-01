import fastify from 'fastify';
import { RemnawaveWebhookCrmEventsDto, RemnawaveWebhookNodeEventsDto, RemnawaveWebhookUserEventsDto } from './types.js';
import { bot } from '../../bot.js';
import { extendSubKeyboard } from '../../keyboards/sub-payment.js';
import { getProfile } from '../../database/user_profiles.js';
import { urlKeyboard } from '../../keyboards/other.js';
import { supportKeyboard } from '../../keyboards/main.js';
import { findUser, setActive } from '../../database/users.js';


type WebhookBody = RemnawaveWebhookUserEventsDto | RemnawaveWebhookCrmEventsDto | RemnawaveWebhookNodeEventsDto;
type EventHandler = (body: any) => Promise<void>;

const handleUserExpired = async (body: RemnawaveWebhookUserEventsDto) => {
    if (!body.data.telegramId) return;

    const [sub] = await getProfile(body.data.uuid);
    await bot.api.sendMessage({
        chat_id: body.data.telegramId,
        text: `🛑 Доступ ограничен!\n\nСрок вашей подписки <code>${body.data.username}</code> истек. Продлите её сейчас, чтобы оставаться в безопасности и сохранить анонимность. 🔐⚡️`,
        parse_mode: 'HTML',
        reply_markup: await extendSubKeyboard(sub.id)
    });
};

const handleUserExpires24h = async (body: RemnawaveWebhookUserEventsDto) => {
    if (!body.data.telegramId) return;

    const [sub] = await getProfile(body.data.uuid);
    await bot.api.sendMessage({
        chat_id: body.data.telegramId,
        text: `⏳ Внимание!\n\nВаша подписка <code>${body.data.username}</code> истекает через 1 день. Продлите её заранее, чтобы не потерять защиту и сохранить анонимность. 🔐⚡️`,
        parse_mode: 'HTML',
        reply_markup: await extendSubKeyboard(sub.id)
    });
};

const handleUserNotConnected = async (body: RemnawaveWebhookUserEventsDto) => {
    if (!body.data.telegramId) return;

    const text = `
🚀 <b>Ваш VPN готов к работе!</b>

Мы заметили, что после оформления подписки вы ещё ни разу не подключались.

✅ Ваша подписка <b>активна</b> и ждёт вас!

🤔 Не получается настроить? Не знаете с чего начать? Мы с радостью поможем разобраться!
    `;
    await bot.api.sendMessage({
        chat_id: body.data.telegramId,
        text,
        parse_mode: 'HTML',
        reply_markup: supportKeyboard
    });
};

const handleCrmBilling = async (body: RemnawaveWebhookCrmEventsDto) => {
    await bot.api.sendMessage({
        chat_id: process.env.LOG_SYSTEM_CHAT_ID!,
        text: `⏳ Срок действия ноды истекает\n\nПровайдер: <code>${body.data.providerName}</code>\nНода: <code>${body.data.nodeName}</code>`,
        parse_mode: 'HTML',
        reply_markup: urlKeyboard('💳 Оплатить', body.data.loginUrl)
    });
};

const handleNodeConnectionLost = async (body: RemnawaveWebhookNodeEventsDto) => {
    await bot.api.sendMessage({
        chat_id: process.env.LOG_SYSTEM_CHAT_ID!,
        text: `📶 Соединение потеряно\n\nПровайдер: <code>${body.data.provider?.name}</code>\nНода: <code>${body.data.countryCode} ${body.data.name}</code>${body.data.lastStatusMessage ? `\nПоследний статус: <code>${body.data.lastStatusMessage}</code>` : ''}`,
        parse_mode: 'HTML'
    });
};

const handleNodeConnectionRestored = async (body: RemnawaveWebhookNodeEventsDto) => {
    await bot.api.sendMessage({
        chat_id: process.env.LOG_SYSTEM_CHAT_ID!,
        text: `✅ Соединение восстановлено\n\nПровайдер: <code>${body.data.provider?.name}</code>\nНода: <code>${body.data.countryCode} ${body.data.name}</code>${body.data.lastStatusMessage ? `\nПоследний статус: <code>${body.data.lastStatusMessage}</code>` : ''}`,
        parse_mode: 'HTML'
    });
};

const handleNodeDisabled = async (body: RemnawaveWebhookNodeEventsDto) => {
    await bot.api.sendMessage({
        chat_id: process.env.LOG_SYSTEM_CHAT_ID!,
        text: `🚫 Нода отключена\n\nПровайдер: <code>${body.data.provider?.name}</code>\nНода: <code>${body.data.countryCode} ${body.data.name}</code>${body.data.lastStatusMessage ? `\nПоследний статус: <code>${body.data.lastStatusMessage}</code>` : ''}`,
        parse_mode: 'HTML'
    });
};

const webhookHandlers: Record<string, Record<string, EventHandler>> = {
    user: {
        'user.not_connected': handleUserNotConnected,
        'user.expired': handleUserExpired,
        'user.expires_in_24_hours': handleUserExpires24h
    },
    crm: {
        'crm.infra_billing_node_payment_in_48hrs': handleCrmBilling
    },
    node: {
        'node.connection_lost': handleNodeConnectionLost,
        'node.connection_restored': handleNodeConnectionRestored,
        'node.disabled': handleNodeDisabled
    }
};

export const serverFastify = () => {
    const server = fastify();

    server.post('/rwwebhook', async (request, reply) => {
        const body = request.body as WebhookBody;

        if (!body?.scope) {
            return reply.code(200).send({ status: 'ok' });
        }

        try {
            const handlers = webhookHandlers[body.scope];
            const handler = handlers?.[body.event];

            if (handler) {
                await handler(body as any);
            } else {
                console.warn(`Unhandled webhook event: ${body.scope}.${body.event}`);
            }
        } catch (error) {
            if (!(body.scope == 'user')) return;
            if (!body.data.telegramId) return;

            const user = await findUser(body.data.telegramId);
            if (user) {
                await setActive(user.id, false);
            }
        } finally {
            return reply.code(200).send({ status: 'ok' });
        }
    });

    server.listen({ host: '0.0.0.0', port: 6663 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
};
