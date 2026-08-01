import { Composer } from 'gramio';
import { addRefBalance } from '../utils/add-ref-balance.js';
import { addPayment } from '../database/payment.js';
import { newProfileStars } from '../utils/new-profile.js';
import { updateProfileStars } from '../utils/update-profile.js';
import { remnawave } from '../services/remnawave/index.js';
import { getProfileByID, setLimitExtended } from '../database/user_profiles.js';
import { getLimitExtend } from '../database/settings.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';


export const starsPayment = new Composer({ name: 'starsPayment' })
    .on('pre_checkout_query', async context => {
        await context.answerPreCheckoutQuery({
            ok: true
        });
    })
    .on('successful_payment', async context => {
        if (!context.hasFrom() || !context.successfulPayment) {
            return;
        }

        const payload: { e: boolean; k: number; m?: number; p?: number; } = JSON.parse(context.successfulPayment.invoicePayload);

        if (!payload.e) {
            try {
                await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>Stars</code>\n- Срок: <code>${payload.m} мес.</code>\n- Цена: <code>${context.successfulPayment.totalAmount} Stars</code>\n- Тип: <code>${payload.k == -1 ? 'Новая' : 'Продление'}</code>`, {
                    chat_id: process.env.LOG_CHAT_ID!,
                    parse_mode: 'HTML'
                });
            } catch { }

            try {
                await addRefBalance(context.dbuser?.payload, context.successfulPayment.totalAmount * Number(process.env.STARS_COEFFICIENT!));
            } catch (e) {
                console.error('Ошибка выдачи рефки (stars-payment):', e);
            }

            await addPayment(
                context.from.id,
                'Stars',
                context.successfulPayment.telegramPaymentChargeId,
                context.successfulPayment.totalAmount * Number(process.env.STARS_COEFFICIENT!),
                payload.m || 0,
                context.dbuser?.payload || null
            );

            // Продление или создание новой подписки
            if (payload.k == -1) {
                await newProfileStars(context);
                return;
            }

            await updateProfileStars(context);
        } else {
            const user = await remnawave.getUserByUserId((await getProfileByID(payload.k))[0]!.uuid);
            const limit = await getLimitExtend();

            // Бонуска
            try {
                await addRefBalance(context.dbuser?.payload, Number(limit.price));
            } catch (e) {
                console.error('Ошибка выдачи рефки (active-keys):', e);
            }

            try {
                await remnawave.updateUser({
                    uuid: user!.response.uuid,
                    trafficLimitStrategy: 'NO_RESET',
                    hwidDeviceLimit: Number(user!.response.hwidDeviceLimit!) + Number(limit.devices)
                });
            } catch (e) {
                console.error('Ошибка при расширении лимита устройств:', e);
            }

            try {
                await context.send(`💳 Покупка доп устройств\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>Stars</code>\n- Цена: <code>${payload.p} Stars</code>`, {
                    chat_id: process.env.LOG_CHAT_ID!,
                    parse_mode: 'HTML'
                });
            } catch { }

            await setLimitExtended(payload.k, true);

            await context.send(`✅ Дополнительные устройства добавлены, приятного пользования!`, { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard });
        }
    });