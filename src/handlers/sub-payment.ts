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

export const subPayment = new Composer({ name: 'subPayment' })
    .callbackQuery(keyboard.mainMenuData, async context => {
        const hasProfiles = await getProfiles(context.from.id);

        if (hasProfiles.length) {
            await context.editText('🛒 Управление подпиской', { reply_markup: keyboard.selectNewExtendKeyboard });
            return;
        }

        const globalSale = await getGlobalSale();
        const userSale = context.dbuser?.sale || 0;
        const finalSale = await calcSale(globalSale, userSale);

        await context.editText(`⏳ Выберите срок действия подписки${finalSale > 0 ? `\n💸 Скидка: <code>${finalSale}%</code>` : ''}`, {
            reply_markup: await keyboard.priceKeyboard(context.queryData.k, context.dbuser?.sale || 0),
            parse_mode: 'HTML'
        });
    })

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

    .callbackQuery(keyboard.priceData, async context => {
        // Если хватает реф. баланса, то используем его
        // if (context.dbuser && Number(context.dbuser.ref_balance) >= context.queryData.p) {
        //     try {
        //         await context.send(`💰 Покупка подписки с реферального баланса\n\n- Пользователь: <code>${context.from.id}</code>\n- Срок: <code>${context.queryData.m} мес.</code>\n- Списано: <code>${context.queryData.p}₽</code>`, {
        //             chat_id: process.env.LOG_CHAT_ID!,
        //             parse_mode: 'HTML'
        //         });
        //     } catch { }

        //     // Продление или создание новой подписки
        //     if (context.queryData.k == -1) {
        //         await newProfile(context, context.queryData.m);
        //         return;
        //     }
        //     await updateProfile(context, context.queryData.m);

        //     await setRefBalance(context.from.id, Number(context.dbuser.ref_balance) - context.queryData.p);
        //     return;
        // }

        await context.editText('💳 Выберите способ оплаты', {
            reply_markup: await keyboard.paymentSystemKeyboard(context.queryData.k, context.queryData.m, context.queryData.p, Number(context.dbuser?.ref_balance))
        });
    })

    .callbackQuery(keyboard.paymentSystemData, async context => {
        const payment = await createPayment(context, context.queryData.p, context.queryData.m);

        if (!payment) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета. Попробуйте позже.');
            return;
        }
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
                context.queryData.k,
                payment.payment_id,
                payment.url
            )
        });
    })

    .callbackQuery(keyboard.paymentRefBalanceData, async context => {
        if (!context.dbuser || Number(context.dbuser.ref_balance) < context.queryData.p) {
            return context.answerCallbackQuery('❌ Недостаточно средств');
        }

        try {
            await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>Реф. Баланс</code>\n- Срок: <code>${context.queryData.m} мес.</code>\n- Цена: <code>${context.queryData.p}₽</code>\n- Тип: <code>${context.queryData.k == -1 ? 'Новая' : 'Продление'}</code>`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }

        // Продление или создание новой подписки
        if (context.queryData.k == -1) {
            await newProfile(context, context.queryData.m);
            return;
        }

        await updateProfile(context, context.queryData.m);

        await setRefBalance(context.from.id, Number(context.dbuser.ref_balance) - context.queryData.p);
    })

    .callbackQuery(keyboard.starsSystemData, async context => {
        await context.sendInvoice({
            title: `Покупка подписки на ${context.queryData.m} мес.`,
            description: `Для оплаты нажмите кнопку ниже`,
            payload: JSON.stringify({ e: false, k: context.queryData.k, m: context.queryData.m }),
            currency: 'XTR',
            prices: [
                {
                    label: 'Подписка', amount: Number(await finalPrice(String(context.queryData.p), context.dbuser!.sale, true))
                }
            ]
        });
        await context.answerCallbackQuery();
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