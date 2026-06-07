import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { lockPaymentForProcessing, completePaymentProcessing, revertPaymentProcessing, getPayment } from '../database/payment.js';
import { cryptoBot } from '../services/crypto-bot/index.js';
import { platega } from '../services/platega/index.js';
import { IPayment } from '../database/types.js';


export const checkPayment = async (context: CallbackQueryShorthandContext<Bot, any>): Promise<IPayment | undefined> => {
    const [payment] = await getPayment(context.queryData.p);
    if (!payment) {
        await context.answerCallbackQuery('❌ Счет не найден. Создайте новый');
        return;
    }

    const isLocked = await lockPaymentForProcessing(payment.id);

    if (!isLocked) {
        await context.answerCallbackQuery('❌ Счет уже обрабатывается');
        return;
    }

    try {
        if (payment.service == 'CryptoBot') {
            const invoices = await cryptoBot.getInvoices({ invoice_ids: payment.payment_id });
            const invoice = invoices.result.items[0];
            if (invoice.status != 'paid') {
                await revertPaymentProcessing(payment.id);
                await context.answerCallbackQuery('❌ Счет не оплачен');
                return;
            }
        } else if (payment.service == 'Platega') {
            const transaction = await platega.getTransactionStatus(payment.payment_id);
            if (transaction.status != 'CONFIRMED') {
                await revertPaymentProcessing(payment.id);
                await context.answerCallbackQuery('❌ Счет не оплачен');
                return;
            }
        }

        await completePaymentProcessing(payment.id);
        await context.answerCallbackQuery('✅ Оплата прошла!');
        return payment;
    } catch (error) {
        await revertPaymentProcessing(payment.id);
        throw error;
    }
};