import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { changeStatus, getPayment } from '../database/payment.js';
import { cryptoBot } from '../services/crypto-bot/index.js';
import { platega } from '../services/platega/index.js';
import { IPayment } from '../database/types.js';


export const checkPayment = async (context: CallbackQueryShorthandContext<Bot, any>): Promise<IPayment | undefined> => {
    const [payment] = await getPayment(context.queryData.p);
    if (!payment) {
        await context.answerCallbackQuery('❌ Счет не найден. Создайте новый');
        return;
    }

    if (payment.service == 'CryptoBot') {
        const invoices = await cryptoBot.getInvoices({ invoice_ids: payment.payment_id });
        const invoice = invoices.result.items[0];
        if (invoice.status != 'paid') {
            await context.answerCallbackQuery('❌ Счет не оплачен');
            return;
        }
    } else if (payment.service == 'Platega') {
        const transaction = await platega.getTransactionStatus(payment.payment_id);
        if (transaction.status != 'CONFIRMED') {
            await context.answerCallbackQuery('❌ Счет не оплачен');
            return;
        }
    }

    // Выдача или продление ключа при успешной оплате
    await changeStatus(payment.id, 'paid');
    await context.answerCallbackQuery('✅ Оплата прошла!');

    return payment;
};