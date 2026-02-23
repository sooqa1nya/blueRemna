import { type Bot, type CallbackData, type CallbackQueryShorthandContext } from 'gramio';
import { backToMainMenuKeyboard, currentKeysKeyboard, paymentInvoiceKeyboard, paymentSystemKeyboard, priceKeyboard, selectNewExtendKeyboard } from '../keyboards/index.js';
import { addProfile, getProfileByID, getProfiles } from '../database/user_profiles.js';
import { cryptoBot } from '../services/crypto-bot/index.js';
import { addPayment, changeStatus, getPayment, getPayments } from '../database/payment.js';
import { findUser, updateUserRefBalance } from '../database/users.js';
import { platega } from '../services/platega/index.js';
import type { IPayment } from '../types/database.js';
import { remnawave } from '../services/remnawave/index.js';


// Кнопка купить или продлить ключ
export const handleBuyExtend = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number; }>>) => {

    const hasProfiles = await getProfiles(context.from.id);

    if (hasProfiles.length) {
        await context.editText('🛒 Управление подпиской', { reply_markup: selectNewExtendKeyboard });
        return;
    }

    await handleSelectDuration(context);
};

// Кнопка продлить ключ
export const handleExtendKey = async (context: CallbackQueryShorthandContext<Bot, 'extend_key'>) => {
    await context.editText('📋 Выберите подписку для продления', {
        reply_markup: await currentKeysKeyboard(context.from.id)
    });
};

// Кнопка выбора длительности подписки
export const handleSelectDuration = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number; }>>) => {
    await context.editText(`⏳ Выберите срок действия подписки${context.dbuser!.sale > 0 ? `\n💸 Скидка: <code>${context.dbuser?.sale}%</code>` : ''}`, {
        reply_markup: await priceKeyboard(context.queryData.k, context.dbuser?.sale || 0),
        parse_mode: 'HTML'
    });
};

// Кнопка выбора способа оплаты
export const handlePaymentMethod = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number, m: number; }>>) => {
    await context.editText('💳 Выберите способ оплаты:', {
        reply_markup: await paymentSystemKeyboard(context.queryData.k, context.queryData.m)
    });
};

// Оплата выбранным способом
export const handlePaymentNew = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ p: string, k: number, m: number; }>>) => {
    const amount = (() => {
        switch (context.queryData.m) {
            case 1:
                return process.env.SUB_PRICE_1_MONTH!;
            case 3:
                return process.env.SUB_PRICE_3_MONTHS!;
            case 6:
                return process.env.SUB_PRICE_6_MONTHS!;
            case 12:
                return process.env.SUB_PRICE_12_MONTHS!;
            default:
                return '0';
        }
    });

    const price = Math.round(Number(amount()) * (1 - context.dbuser!.sale / 100));

    if (context.queryData.p === 'cb') {
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
            Number(price),
            context.dbuser?.payload || null
        );

        if (!payment) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета (#2). Попробуйте позже.');
            return;
        }

        await context.editText(`⏳ Для оплаты нажмите кнопку ниже`, {
            reply_markup: await paymentInvoiceKeyboard(
                payment.id,
                context.queryData.k,
                context.queryData.m,
                invoice.result.pay_url
            )
        });

    } else if (context.queryData.p === 'pl') {
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
            context.dbuser?.payload || null
        );

        if (!payment) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета (#2). Попробуйте позже.');
            return;
        }

        await context.editText(`⏳ Для оплаты нажмите кнопку ниже`, {
            reply_markup: await paymentInvoiceKeyboard(
                payment.id,
                context.queryData.k,
                context.queryData.m,
                transaction.redirect!
            )
        });
    }
};


// Проверка оплаты + редирект на продление или выдачу нового ключа
export const handleCheckPayment = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number, m: number; }>>) => {
    // Проверка оплаты
    const payments = await getPayments(context.from.id);
    if (!payments.length) {
        await context.answerCallbackQuery('❌ Время оплаты истекло или счет не найден. Пожалуйста, создайте новый счет и оплатите его.');
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

    if (!paymentInfo.found) {
        await context.answerCallbackQuery('❌ Счет не оплачен. Пожалуйста, оплатите счет и попробуйте снова.');
        return;
    }

    // Выдача или продление ключа при успешной оплате
    await changeStatus(paymentInfo.payment!.id, 'paid');
    await context.answerCallbackQuery('✅ Оплата прошла!');
    try {
        await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${paymentInfo.payment?.service}</code>\n- Срок: <code>${context.queryData.m} мес.</code>`, {
            chat_id: process.env.LOG_CHAT_ID!,
            parse_mode: 'HTML'
        });
    } catch { }


    if (context.dbuser?.payload) {
        const regex = /id([?<id>0-9]+)/;
        if (regex.test(context.dbuser.payload)) {
            const match = context.dbuser.payload.match(regex)!;
            const referrerId = match[1];
            if (!referrerId) {
                return;
            }

            const referrer = await findUser(Number(referrerId));
            if (referrer) {
                const amount = (() => {
                    switch (context.queryData.m) {
                        case 1:
                            return process.env.SUB_PRICE_1_MONTH!;
                        case 3:
                            return process.env.SUB_PRICE_3_MONTHS!;
                        case 6:
                            return process.env.SUB_PRICE_6_MONTHS!;
                        case 12:
                            return process.env.SUB_PRICE_12_MONTHS!;
                        default:
                            return '0';
                    }
                });
                const price = Math.round(Number(amount()) * (1 - context.dbuser!.sale / 100));
                await updateUserRefBalance(referrer.id, referrer.ref_balance + price * (referrer.ref_proc / 100));
            }
        }
    }


    const days = context.queryData.m * 30;
    const date = new Date();

    if (context.queryData.k != -1) {
        const [profile] = await getProfileByID(context.queryData.k);
        if (!profile) {
            await context.answerCallbackQuery('❌ Ошибка #1 при продлении подписки. Обратитесь в поддержку.');
            return;
        }

        const sub = await remnawave.getUserByUUID(profile.uuid);
        if (!sub) {
            await context.answerCallbackQuery('❌ Ошибка #2 при продлении подписки. Обратитесь в поддержку.');
            return;
        }

        const user = await remnawave.getUserByUUID(profile.uuid);
        if (!user) {
            await context.answerCallbackQuery('❌ Ошибка #3 при продлении подписки. Обратитесь в поддержку.');
            return;
        }
        const expiteDate = new Date(user.response.expireAt);

        expiteDate < date ? date.setDate(date.getDate() + days) : date.setDate(expiteDate.getDate() + days);

        await remnawave.updateUser({
            uuid: profile.uuid,
            expireAt: date.toISOString()
        });

        await context.editText('✅ Подписка продлена!', { reply_markup: backToMainMenuKeyboard });
        return;
    }


    const profile = `id${String(context.from.id).slice(0, 2)}${date.getTime()}`; // Создаем уникальный ID для профиля
    const squadId = await remnawave.getSquadForVPN();

    if (!squadId) {
        await context.answerCallbackQuery('❌ Ошибка при добавлении в сквад. Обратитесь в поддержку.');
        return;
    }

    date.setDate(date.getDate() + days);
    const user = await remnawave.createUser({
        username: profile,
        expireAt: date.toISOString(),
        telegramId: context.from.id,
        hwidDeviceLimit: 5,
        activeInternalSquads: [squadId]
    });

    if (!user) {
        await context.answerCallbackQuery('❌ Ошибка при создании пользователя. Обратитесь в поддержку.');
        return;
    }

    try {
        await addProfile(
            context.from.id,
            user.response.uuid,
            profile
        );
    } catch (error) {
        await context.answerCallbackQuery('❌ Ошибка при добавлении профиля в БД. Обратитесь в поддержку.');
        await remnawave.deleteUser(user.response.uuid);
        return;
    }

    await context.editText(`✅ Ваша подписка:\n<code>${user.response.subscriptionUrl}</code>`, { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard });
};