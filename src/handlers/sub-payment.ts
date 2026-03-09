import { Composer } from 'gramio';
import * as keyboard from '../keyboards/index.js';
import { getGlobalSale } from '../database/settings.js';
import { calcSale } from '../utils/final-price.js';
import { checkPayment } from '../utils/check-payment.js';
import { addRefBalance } from '../utils/add-ref-balance.js';
import { newProfile } from '../utils/new-profile.js';
import { updateProfile } from '../utils/update-profile.js';
import { createPayment } from '../utils/create-payment.js';
import { getProfiles } from '../database/user_profiles.js';

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
        await context.editText('💳 Выберите способ оплаты', {
            reply_markup: await keyboard.paymentSystemKeyboard(context.queryData.k, context.queryData.m, context.queryData.p)
        });
    })

    .callbackQuery(keyboard.paymentSystemData, async context => {
        const url = await createPayment(context, context.queryData.p);

        if (!url) {
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
                context.queryData.m,
                context.queryData.p,
                url
            )
        });
    })

    .callbackQuery(keyboard.checkPaymentData, async context => {
        const paymentInfo = await checkPayment(context);
        if (!paymentInfo) {
            return;
        }

        try {
            await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${paymentInfo.payment?.service}</code>\n- Срок: <code>${context.queryData.m} мес.</code>\n- Цена: ${context.queryData.p}`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }

        // Бонуска
        try {
            await addRefBalance(context, context.queryData.p);
        } catch (e) {
            console.error('Ошибка выдачи рефки (sub-payment):', e);
        }

        // Продление или создание новой подписки
        if (context.queryData.k == -1) {
            await newProfile(context);
            return;
        }

        await updateProfile(context);
    });