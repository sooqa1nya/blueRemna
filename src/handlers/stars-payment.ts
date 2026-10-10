import { Composer } from 'gramio';
import { addRefBalance } from '../utils/add-ref-balance.js';
import { addPayment } from '../database/payment.js';
import { remnawave } from '../services/remnawave/index.js';
import { getLimitExtend } from '../database/settings.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';
import { getPriceById } from '../database/sub_prices.js';
import { userSubUpdate } from '../utils/userSubUpdate.js';
import { getUserSub, setLimitExtended } from '../database/user_sub.js';
import { copyWebappMenuKeyboard } from '../keyboards/other.js';


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

        const payload: { e: boolean; priceId?: number; price?: number; } = JSON.parse(context.successfulPayment.invoicePayload);

        let priceById, subPrice;

        if (payload.priceId) {
            [priceById] = await getPriceById(payload.priceId);
        } else if (payload.price) {
            subPrice = payload.price;
        } else {
            console.error('stars-payment не найдена цена подписки paymentId', payload);
            return;
        }

        if (!payload.e) {
            try {
                await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>Stars</code>\n- Срок: <code>${priceById!.months} мес.</code>\n- Цена: <code>${context.successfulPayment.totalAmount} Stars</code>}`, {
                    chat_id: process.env.LOG_CHAT_ID!,
                    parse_mode: 'HTML'
                });
            } catch { }

            try {
                await addRefBalance(context.dbuser?.payload, context.successfulPayment.totalAmount * Number(process.env.STARS_COEFFICIENT!));
            } catch (e) {
                console.error('Ошибка выдачи рефки (stars-payment):', e);
            }

            const [payment] = await addPayment(
                context.from.id,
                'Stars',
                context.successfulPayment.telegramPaymentChargeId,
                context.successfulPayment.totalAmount * Number(process.env.STARS_COEFFICIENT!),
                priceById!.months,
                priceById!.plan_id,
                context.dbuser?.payload || null
            );

            try {
                await userSubUpdate(context.from.id, payment.id);
            } catch (e) {
                console.error('Ошибка stars-payment => userSubUpdate', e);
                await context.send('❌ Ошибка выдачи подписки, обратитесь в поддержку');
            }

            const text = `
✅ Подписка активирована

ℹ️ Подключение
 <i>- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную</i>

<b>❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку</b>
            `;

            await context.send(text, {
                parse_mode: 'HTML',
                reply_markup: await copyWebappMenuKeyboard('👤 Профиль', String(context.from.id))
            });
        } else {
            const [userSub] = await getUserSub(context.from.id);
            const user = await remnawave.getUserByUserId(userSub.rw_user_id);
            const limit = await getLimitExtend();

            // Бонуска
            try {
                await addRefBalance(context.dbuser?.payload, Number(limit.price));
            } catch (e) {
                console.error('Ошибка выдачи рефки (active-keys):', e);
            }

            try {
                await remnawave.updateUser({
                    id: user!.response.id,
                    trafficLimitStrategy: 'NO_RESET',
                    hwidDeviceLimit: Number(user!.response.hwidDeviceLimit!) + Number(limit.devices)
                });
            } catch (e) {
                console.error('Ошибка при расширении лимита устройств:', e);
            }

            try {
                await context.send(`💳 Покупка доп устройств\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>Stars</code>\n- Цена: <code>${subPrice} Stars</code>`, {
                    chat_id: process.env.LOG_CHAT_ID!,
                    parse_mode: 'HTML'
                });
            } catch { }

            await setLimitExtended(context.from.id, true);

            await context.send(`✅ Дополнительные устройства добавлены, приятного пользования!`, { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard });
        }
    });