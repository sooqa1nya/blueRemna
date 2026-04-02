import { Composer } from 'gramio';
import { addRefBalance } from '../utils/add-ref-balance.js';
import { addPayment } from '../database/payment.js';
import { newProfileStars } from '../utils/new-profile.js';
import { updateProfileStars } from '../utils/update-profile.js';


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

        const payload: { k: number; m: number; } = JSON.parse(context.successfulPayment.invoicePayload);

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
            context.dbuser?.payload || null
        );

        // Продление или создание новой подписки
        if (payload.k == -1) {
            await newProfileStars(context);
            return;
        }

        await updateProfileStars(context);
    });