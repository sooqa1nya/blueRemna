import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { CallbackPayload } from './types.js';
import { completePaymentProcessing, getPaymentId, lockPaymentForProcessing } from '../../database/payment.js';
import { remnawave } from '../remnawave/index.js';
import { addProfile, getProfileByID, setLimitExtended } from '../../database/user_profiles.js';
import { bot } from '../../bot.js';
import { copyWebappMenuKeyboard } from '../../keyboards/other.js';
import { findUser } from '../../database/users.js';
import { addRefBalance } from '../../utils/add-ref-balance.js';
import { getLimitExtend } from '../../database/settings.js';
import { backToMainMenuKeyboard } from '../../keyboards/main.js';


export const plWh: FastifyPluginAsync = async (server: FastifyInstance) => {
    server.post('/platega', async (request: FastifyRequest<{ Body: CallbackPayload; }>, reply: FastifyReply) => {
        const body = request.body;

        if (body.status !== "CONFIRMED") {
            await reply.code(200).send({ status: 'ok' });
            return;
        }

        const [payment] = await getPaymentId(body.id);

        const isLocked = await lockPaymentForProcessing(payment.id);
        if (!isLocked) {
            return;
        }

        try {
            await bot.api.sendMessage({
                chat_id: process.env.LOG_CHAT_ID!,
                text: `💳 Покупка подписки\n\n- Пользователь: <code>${payment.user_id}</code>\n- Сервис: <code>${payment.service}</code>\n- Срок: <code>${payment.months} мес.</code>\n- Цена: <code>${payment.amount}₽</code>\n- Тип: <code>${payment.sub_id == -1 ? 'Новая' : 'Продление'}</code>`,
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
            const user = await remnawave.getUserByUserId((await getProfileByID(payment.sub_id))[0]!.rw_user_id);
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

            await setLimitExtended(payment.sub_id, true);

            await bot.api.sendMessage({
                chat_id: payment.user_id,
                text: `✅ Дополнительные устройства добавлены, приятного пользования!`,
                parse_mode: 'HTML',
                reply_markup: backToMainMenuKeyboard
            });
        } else if (payment.sub_id == -1) {
            const days = payment.months * 30;
            const date = new Date();

            const profile = `id${String(payment.user_id).slice(0, 2)}${date.getTime()}`; // Создаем уникальный ID для профиля
            const squads = await remnawave.getSquadForVPN();

            if (!squads) {
                console.error('[plWh] Ошибка при получении сквада для VPN', squads);
                return;
            }

            date.setDate(date.getDate() + Number(days));
            const user = await remnawave.createUser({
                username: profile,
                status: 'ACTIVE',
                trafficLimitStrategy: 'NO_RESET',
                expireAt: date.toISOString(),
                telegramId: payment.user_id,
                hwidDeviceLimit: 5,
                activeInternalSquads: [squads.internal],
                externalSquadUuid: squads.external
            });

            if (!user) {
                console.error('[plWh] Ошибка при создании пользователя', user);
                return;
            }

            try {
                await addProfile(
                    payment.user_id,
                    user.response.id,
                    profile
                );
            } catch (error) {
                console.error('[plWh] Ошибка при добавлении профиля в БД', error);
                await remnawave.deleteUser(user.response.id);
                return;
            }

            const text = `
✅ Подписка активирована

⏳ Дата окончания: <code>${date.toLocaleDateString('ru-RU')}</code>

ℹ️ Подключение
 <i>- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную</i>

<b>❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку</b>
`;
            await bot.api.sendMessage({
                chat_id: payment.user_id,
                text: text,
                parse_mode: 'HTML',
                reply_markup: copyWebappMenuKeyboard('👤 Профиль', user.response.subscriptionUrl)
            });
        } else {
            const days = payment.months * 30;
            const currentDate = new Date();

            const [profile] = await getProfileByID(payment.sub_id);
            if (!profile) {
                console.error('[plWh] Ошибка #1 при продлении подписки', profile);
                return;
            }

            const user = await remnawave.getUserByUserId(profile.rw_user_id);
            if (!user) {
                console.error('[plWh] Ошибка #2 при продлении подписки', user);
                return;
            }

            const expireDate = new Date(user.response.expireAt);

            // Выбираем источник: если подписка не истекла, добавляем к её дате, иначе к текущей
            const date = expireDate > currentDate ? expireDate : currentDate;
            date.setDate(date.getDate() + days);

            await remnawave.updateUser({
                id: profile.rw_user_id,
                trafficLimitStrategy: 'NO_RESET',
                expireAt: date.toISOString()
            });

            const text = `
✅ Подписка продлена

⏳ Дата окончания: <code>${date.toLocaleDateString('ru-RU')}</code>

ℹ️ Подключение
 <i>- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную</i>

<b>❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку</b>
                `;

            await bot.api.sendMessage({
                chat_id: payment.user_id,
                text: text,
                parse_mode: 'HTML',
                reply_markup: copyWebappMenuKeyboard('👤 Профиль', user.response.subscriptionUrl)
            });
        }

        await completePaymentProcessing(payment.id);
        await reply.code(200).send({ status: 'ok' });
    });
};