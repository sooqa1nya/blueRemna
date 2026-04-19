import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { cryptoBot } from '../services/crypto-bot/index.js';
import { addPayment } from '../database/payment.js';
import { platega } from '../services/platega/index.js';

export const createPayment = async (context: CallbackQueryShorthandContext<Bot, any>, price: number, months: number) => {
    let url: string | null = null;
    if (context.queryData.s === 'cb') {
        const invoice = await cryptoBot.createInvoice({
            currency_type: 'fiat',
            fiat: 'RUB',
            amount: price.toString(),
            expires_in: 1800
        });

        if (!invoice || !invoice.ok) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета (#1). Попробуйте позже.');
            return;
        }

        const [payment] = await addPayment(
            context.from.id,
            'CryptoBot',
            invoice.result.invoice_id.toString(),
            price,
            months,
            context.dbuser?.payload || null
        );

        if (!payment) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета (#2). Попробуйте позже.');
            return;
        }

        url = invoice.result.pay_url;
    } else if (context.queryData.s === 'pl') {
        const transaction = await platega.createTransaction({
            paymentMethod: 2,
            paymentDetails: {
                amount: price,
                currency: 'RUB',
            },
            description: `Покупка подписки на ${context.queryData.m} мес.\nПользователь: ${context.from.id}`,
            payload: context.from.id.toString()
        });

        if (!transaction) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета (#1). Попробуйте позже.');
            return;
        }

        const [payment] = await addPayment(
            context.from.id,
            'Platega',
            transaction.transactionId,
            price,
            months,
            context.dbuser?.payload || null
        );

        if (!payment) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета (#2). Попробуйте позже.');
            return;
        }

        url = transaction.redirect!;
    }

    return url;
};
