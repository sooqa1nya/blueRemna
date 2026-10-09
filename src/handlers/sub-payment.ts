import { Composer } from 'gramio';
import * as keyboard from '../keyboards/index.js';
import { getGlobalSale } from '../database/settings.js';
import { calcSale, finalPrice } from '../utils/final-price.js';
import { checkPayment } from '../utils/check-payment.js';
import { addRefBalance } from '../utils/add-ref-balance.js';
import { newProfile } from '../utils/new-profile.js';
import { updateProfile } from '../utils/update-profile.js';
import { createPayment } from '../utils/create-payment.js';
import { getProfiles } from '../database/user_profiles.js';
import { setRefBalance } from '../database/users.js';
import { getPlanById } from '../database/sub_plans.js';
import { backKeyboard } from '../keyboards/other.js';
import { platega } from '../services/platega/index.js';
import { getPriceById } from '../database/sub_prices.js';
import { addPayment } from '../database/payment.js';
import { cryptoBot } from '../services/crypto-bot/index.js';

export const subPayment = new Composer({ name: 'subPayment' })
    // Тарифный план
    .callbackQuery('sub_buy', async context => {
        await context.editText(`📋 Выберите тарифный план`, {
            reply_markup: await keyboard.allPlansKeyboard(),
            parse_mode: 'HTML'
        });

    })
    // Цены на подписку + информация о тарифном плане
    .callbackQuery(keyboard.allPlansData, async context => {
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
                'Platega',
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

        // Продление или создание новой подписки
        //    ЛОГИКА ПРОДЛЕНИЯ ИЛИ ПОКУПКИ ПОДПИСКИ

        await setRefBalance(context.from.id, Number(context.dbuser.ref_balance) - fPrice);
    })


























    // СДЕЛАТЬ ИЗ ЭТОГО ПРОДЛЕНИЕ ПОДПИСКИ
    // .callbackQuery(keyboard.subBuyData, async context => {
    //     const hasProfiles = await getProfiles(context.from.id);

    //     if (hasProfiles.length) {
    //         // выбор кол-ва дней для продления подписки по текущему плану + инфа о плане
    //         // await context.editText('🛒 Управление подпиской', { reply_markup: keyboard.selectNewExtendKeyboard });
    //         return;
    //     }

    //     // const globalSale = await getGlobalSale();
    //     // const userSale = context.dbuser?.sale || 0;
    //     // const finalSale = await calcSale(globalSale, userSale);

    //     // await context.editText(`⏳ Выберите срок действия подписки${finalSale > 0 ? `\n💸 Скидка: <code>${finalSale}%</code>` : ''}`, {
    //     //     reply_markup: await keyboard.priceKeyboard(context.queryData.k, context.dbuser?.sale || 0),
    //     //     parse_mode: 'HTML'
    //     // });

    //     await context.editText(`📋 Выберите интересующий Вас тарифный план`, {
    //         reply_markup: await keyboard.allPlansKeyboard(),
    //         parse_mode: 'HTML'
    //     });

    // })









    .callbackQuery('extend_key', async context => {
        await context.editText('📋 Выберите подписку для продления', {
            reply_markup: await keyboard.currentKeysKeyboard(context.from.id)
        });
    })

    .callbackQuery(keyboard.currentKeysData, async context => {
        const globalSale = await getGlobalSale();
        const userSale = context.dbuser?.sale || 0;
        const finalSale = await calcSale(globalSale, userSale);

        await context.editText(`⏳ Выберите срок действия подписки${finalSale > 0 ? `\n💸 Скидка: <code>${finalSale}%</code>` : ''}`, {
            reply_markup: await keyboard.priceKeyboard(context.queryData.k, context.dbuser?.sale || 0),
            parse_mode: 'HTML'
        });
    })

    .callbackQuery(keyboard.checkPaymentData, async context => {
        const payment = await checkPayment(context);
        if (!payment) {
            return;
        }

        try {
            await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${payment.service}</code>\n- Срок: <code>${payment.months} мес.</code>\n- Цена: <code>${payment.amount}₽</code>\n- Тип: <code>${context.queryData.k == -1 ? 'Новая' : 'Продление'}</code>`, {
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

        // Продление или создание новой подписки
        if (context.queryData.k == -1) {
            await newProfile(context, payment.months);
            return;
        }

        await updateProfile(context, payment.months);
    });