import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { changeStatus, getPayments } from '../database/payment.js';
import { cryptoBot } from '../services/crypto-bot/index.js';
import { platega } from '../services/platega/index.js';
import type { IPayment } from '../database/types.js';

export const checkPayment = async (context: CallbackQueryShorthandContext<Bot, any>) => {
    const payments = await getPayments(context.from.id);
    if (!payments.length) {
        await context.answerCallbackQuery('❌ Время оплаты истекло. Создайте новый счет');
        return;
    }

    type PaymentInfo =
        | { found: false; payment: null; }
        | { found: true; payment: IPayment; };

    let paymentInfo: PaymentInfo = {
        payment: null,
        found: false
    };

    for (const payment of payments) {
        if (payment.service == 'CryptoBot') {
            const invoices = await cryptoBot.getInvoices({ invoice_ids: payment.payment_id });
            const invoice = invoices.result.items[0];
            if (!invoice) {
                continue;
            }

            if (invoice.status == 'paid') {
                paymentInfo = {
                    payment: payment,
                    found: true
                };
                break;
            }
        } else if (payment.service == 'Platega') {
            const transaction = await platega.getTransactionStatus(payment.payment_id);
            if (!transaction) {
                continue;
            }

            if (transaction.status == 'CONFIRMED') {
                paymentInfo = {
                    payment: payment,
                    found: true
                };
                break;
            }
        }
    }

    if (!paymentInfo?.found) {
        await context.answerCallbackQuery('❌ Счет не оплачен');
        return null;
    }

    // Выдача или продление ключа при успешной оплате
    await changeStatus(paymentInfo.payment!.id, 'paid');
    await context.answerCallbackQuery('✅ Оплата прошла!');

    return paymentInfo;
};