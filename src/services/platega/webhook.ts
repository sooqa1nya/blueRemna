import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { CallbackPayload } from './types.js';
import { completePaymentProcessing, getPaymentId, lockPaymentForProcessing } from '../../database/payment.js';
import { remnawave } from '../remnawave/index.js';
import { bot } from '../../bot.js';
import { copyWebappMenuKeyboard } from '../../keyboards/other.js';
import { findUser } from '../../database/users.js';
import { addRefBalance } from '../../utils/add-ref-balance.js';
import { getLimitExtend } from '../../database/settings.js';
import { backToMainMenuKeyboard } from '../../keyboards/main.js';
import { getUserSub, setLimitExtended } from '../../database/user_sub.js';
import { userSubUpdate } from '../../utils/userSubUpdate.js';


export const plWh: FastifyPluginAsync = async (server: FastifyInstance) => {
    server.post('/platega', async (request: FastifyRequest<{ Body: CallbackPayload; }>, reply: FastifyReply) => {
        const body = request.body;

        if (body.status !== "CONFIRMED") {
            await reply.code(200).send({ status: 'ok' });
            return;
        }

        const [payment] = await getPaymentId(body.id);

        if (payment.status == 'paid') {
            await reply.code(200).send({ status: 'ok' });
            return;
        }

        const isLocked = await lockPaymentForProcessing(payment.id);
        if (!isLocked) {
            await reply.code(200).send({ status: 'ok' });
            return;
        }

        try {
            await bot.api.sendMessage({
                chat_id: process.env.LOG_CHAT_ID!,
                text: `💳 Покупка подписки\n\n- Пользователь: <code>${payment.user_id}</code>\n- Сервис: <code>${payment.service}</code>\n- Срок: <code>${payment.months} мес.</code>\n- Цена: <code>${payment.amount}₽</code>`,
                parse_mode: 'HTML'
            });
        } catch { }

        // Бонуска
        try {
            const refUser = await findUser(payment.user_id);
            await addRefBalance(refUser.payload, Number(payment.amount));
        } catch (e) {
            console.error('Ошибка выдачи рефки (sub-payment):', e);
        }

        if (payment.months == 0) {
            const [userSub] = await getUserSub(payment.user_id);
            const user = await remnawave.getUserByUserId(userSub.rw_user_id);
            const limit = await getLimitExtend();

            try {
                await remnawave.updateUser({
                    id: user!.response.id,
                    trafficLimitStrategy: 'NO_RESET',
                    hwidDeviceLimit: Number(user!.response.hwidDeviceLimit!) + Number(limit.devices)
                });
            } catch (e) {
                console.error('[plWh] Ошибка при расширении лимита устройств:', e);
            }

            try {
                await bot.api.sendMessage({
                    text: `💳 Покупка доп устройств\n\n- Пользователь: <code>${payment.user_id}</code>\n- Сервис: <code>${payment.service}</code>\n- Цена: <code>${limit.price}₽</code>`,
                    chat_id: process.env.LOG_CHAT_ID!,
                    parse_mode: 'HTML'
                });
            } catch { }

            await setLimitExtended(Number(payment.user_id), true);

            await bot.api.sendMessage({
                chat_id: payment.user_id,
                text: `✅ Дополнительные устройства добавлены, приятного пользования!`,
                parse_mode: 'HTML',
                reply_markup: backToMainMenuKeyboard
            });
        } else {
            // Выдача сабки
            try {
                await userSubUpdate(payment.user_id, Number(payment.sub_plan_id));
            } catch (e) {
                console.error('Ошибка sub-payment => userSubUpdate', e);
                await bot.api.sendMessage({
                    text: `❌ Ошибка при обновлении подписки, обратитесь в поддержку @${process.env.SUPPORT_USERNAME}`,
                    chat_id: payment.user_id
                });
            }

            const text = `
✅ Подписка активирована

ℹ️ Подключение
 <i>- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную</i>

<b>❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку</b>
`;
            await bot.api.sendMessage({
                chat_id: payment.user_id,
                text: text,
                parse_mode: 'HTML',
                reply_markup: await copyWebappMenuKeyboard('👤 Профиль', payment.user_id)
            });
        }

        await completePaymentProcessing(payment.id);
        await reply.code(200).send({ status: 'ok' });
    });
};