import { Composer } from 'gramio';
import * as keyboard from '../keyboards/index.js';
import { finalPrice } from '../utils/final-price.js';
import { addRefBalance } from '../utils/add-ref-balance.js';
import { setRefBalance } from '../database/users.js';
import { getPlanById } from '../database/sub_plans.js';
import { platega } from '../services/platega/index.js';
import { getPriceById } from '../database/sub_prices.js';
import { addPayment, completePaymentProcessing, getPayment, lockPaymentForProcessing, revertPaymentProcessing } from '../database/payment.js';
import { cryptoBot } from '../services/crypto-bot/index.js';
import { userSubUpdate } from '../utils/userSubUpdate.js';
import { getUserSub } from '../database/user_sub.js';

export const subPayment = new Composer({ name: 'subPayment' })
    // Тарифный план [Покупка подписки]
    .callbackQuery('sub_buy', async context => {
        const [userSub] = await getUserSub(context.from.id);
        if (!!userSub) {
            await context.editText('❌ У вас уже есть действующая подписка, вернитесь в главное меню и попробуйте снова', {
                reply_markup: keyboard.backToMainMenuKeyboard
            });
        }

        await context.editText(`📋 Выберите тарифный план`, {
            reply_markup: await keyboard.allPlansKeyboard(),
            parse_mode: 'HTML'
        });

    })

    // Цены на подписку + информация о тарифном плане + ПРОДЛЕНИЕ подписки
    .callbackQuery(keyboard.allPlansData, async context => {
        const [userSub] = await getUserSub(context.from.id);
        if (!userSub) {
            await context.editText('❌ У вас нет действующей подписки, вернитесь в главное меню и попробуйте снова', {
                reply_markup: keyboard.backToMainMenuKeyboard
            });
        }

        const [plan] = await getPlanById(context.queryData.planId);

        const text = `
<b>${plan.name}</b>

<blockquote>${plan.info}</blockquote>
        `;

        await context.editText(text, {
            reply_markup: await keyboard.pricesKeyboard(context.queryData.planId, context.dbuser!.sale),
            parse_mode: 'HTML'
        });
    })

    // Способы оплаты
    .callbackQuery(keyboard.pricesData, async context => {
        await context.editText('💳 Выберите способ оплаты', {
            reply_markup: await keyboard.paymentServiceKeyboard(context.queryData.priceId, context.dbuser!.ref_balance)
        });
    })

    // Платега СБП
    .callbackQuery(keyboard.sbpPlategaData, async context => {
        try {
            const [price] = await getPriceById(context.queryData.priceId);
            const fPrice = Number(await finalPrice(price.amount, context.dbuser!.sale));

            const transaction = await platega.createTransaction({
                paymentMethod: 2,
                paymentDetails: {
                    amount: fPrice,
                    currency: 'RUB',
                },
                description: JSON.stringify({ userId: context.from.id, months: price.months, plan: price.plan_id }),
                payload: context.from.id.toString()
            });

            const [payment] = await addPayment(
                context.from.id,
                'Platega',
                transaction.transactionId,
                fPrice,
                price.months,
                price.plan_id,
                context.dbuser?.payload || null
            );

            const text = `
⏳ Покупка
    
ℹ️ Примечание:
 <i>- Для перехода на страницу оплаты нажмите кнопку "Оплатить"
 - После оплаты нажмите кнопку "Проверить оплату"
 - Если оплата не прошла, попробуйте снова или обратитесь в поддержку</i>
`;

            await context.editText(text, {
                parse_mode: 'HTML',
                reply_markup: await keyboard.paymentInvoiceKeyboard(
                    payment.id,
                    transaction.redirect as string
                )
            });
        } catch (error) {
            console.error('Platega create transaction', error);
            await context.answerCallbackQuery();
            await context.send('❌ Ошибка при создании счёта, попробуйте позже..');
        }
    })

    // Криптобот
    .callbackQuery(keyboard.sbpPlategaData, async context => {
        try {
            const [price] = await getPriceById(context.queryData.priceId);
            const fPrice = Number(await finalPrice(price.amount, context.dbuser!.sale));

            const invoice = await cryptoBot.createInvoice({
                currency_type: 'fiat',
                fiat: 'RUB',
                amount: price.toString(),
                expires_in: 1800
            });

            const [payment] = await addPayment(
                context.from.id,
                'CryptoBot',
                invoice.result.invoice_id.toString(),
                fPrice,
                price.months,
                price.plan_id,
                context.dbuser?.payload || null
            );

            const text = `
⏳ Покупка
    
ℹ️ Примечание:
 <i>- Для перехода на страницу оплаты нажмите кнопку "Оплатить"
 - После оплаты нажмите кнопку "Проверить оплату"
 - Если оплата не прошла, попробуйте снова или обратитесь в поддержку</i>
`;

            await context.editText(text, {
                parse_mode: 'HTML',
                reply_markup: await keyboard.paymentInvoiceKeyboard(
                    payment.id,
                    invoice.result.pay_url
                )
            });
        } catch (error) {
            console.error('CryptoBot create invoice', error);
            await context.answerCallbackQuery();
            await context.send('❌ Ошибка при создании счёта, попробуйте позже..');
        }
    })

    // Telegram Stars
    .callbackQuery(keyboard.starsData, async context => {
        const [price] = await getPriceById(context.queryData.priceId);

        await context.sendInvoice({
            title: `Покупка подписки на ${price.months} мес.`,
            description: `Для оплаты нажмите кнопку ниже`,
            payload: JSON.stringify({ e: false, priceId: context.queryData.priceId }),
            currency: 'XTR',
            prices: [
                {
                    label: 'Подписка', amount: Number(await finalPrice(String(price.amount), context.dbuser!.sale, true))
                }
            ]
        });

        await context.answerCallbackQuery();
    })

    // Реф. баланс бота
    .callbackQuery(keyboard.paymentRefBalanceData, async context => {
        const [price] = await getPriceById(context.queryData.priceId);
        const fPrice = Number(await finalPrice(String(price.amount), context.dbuser!.sale, true));

        if (!context.dbuser || Number(context.dbuser.ref_balance) < fPrice) {
            return context.answerCallbackQuery('❌ Недостаточно средств');
        }

        try {
            await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>Реф. Баланс</code>\n- Срок: <code>${price.months} мес.</code>\n- Цена: <code>${fPrice}₽</code>`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }

        try {
            await userSubUpdate(context.from.id, Number(price.plan_id));
        } catch (e) {
            console.error('Ошибка sub-payment => userSubUpdate', e);
            await context.answerCallbackQuery('❌ Ошибка выдачи подписки');
        }

        await setRefBalance(context.from.id, Number(context.dbuser.ref_balance) - fPrice);
    })

    // Проверка оплаты
    .callbackQuery(keyboard.checkPaymentData, async context => {
        const [payment] = await getPayment(context.queryData.paymentId);

        const isLocked = await lockPaymentForProcessing(payment.id);
        if (!isLocked) {
            await context.answerCallbackQuery('❌ Счет уже обрабатывается');
            return;
        }

        try {
            if (payment.service === 'Platega') {
                const transaction = await platega.getTransactionStatus(payment.payment_id);

                if (transaction.status != 'CONFIRMED') {
                    await revertPaymentProcessing(payment.id);
                    await context.answerCallbackQuery('❌ Счет не оплачен');
                    return;
                }
            } else if (payment.service === 'CryptoBot') {
                const invoices = await cryptoBot.getInvoices({ invoice_ids: payment.payment_id });
                const invoice = invoices.result.items[0];

                if (invoice.status != 'paid') {
                    await revertPaymentProcessing(payment.id);
                    await context.answerCallbackQuery('❌ Счет не оплачен');
                    return;
                }
            } else {
                await revertPaymentProcessing(payment.id);
                console.error(`[Проверка оплаты] payment.service НЕ НАЙДЕН. id: ${payment.id} | service: ${payment.service}`);
                return;
            }
        } catch (error) {
            console.error('[Проверка оплаты]', error);
            return;
        }

        await completePaymentProcessing(payment.id);
        await context.answerCallbackQuery('✅ Оплата прошла!');

        try {
            await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${payment.service}</code>\n- Срок: <code>${payment.months} мес.</code>\n- Цена: <code>${payment.amount}₽</code>`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }

        // Бонуска
        try {
            await addRefBalance(context.dbuser?.payload, Number(payment.amount));
        } catch (e) {
            console.error('Ошибка выдачи рефки (sub-payment):', e);
        }

        // Выдача сабки
        try {
            await userSubUpdate(context.from.id, context.queryData.paymentId);
        } catch (e) {
            console.error('Ошибка sub-payment => userSubUpdate', e);
            await context.answerCallbackQuery('❌ Ошибка выдачи подписки');
        }

        const text = `
✅ Подписка активирована

ℹ️ Подключение
 <i>- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную</i>

<b>❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку</b>
`;

        await context.editText(text, {
            parse_mode: 'HTML',
            reply_markup: await keyboard.copyWebappMenuKeyboard('👤 Профиль', String(context.from.id))
        });
    });