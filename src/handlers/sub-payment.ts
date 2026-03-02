import { type Bot, type CallbackData, type CallbackQueryShorthandContext } from 'gramio';
import { currentKeysKeyboard, paymentInvoiceKeyboard, paymentSystemKeyboard, priceKeyboard, selectNewExtendKeyboard } from '../keyboards/index.js';
import { getProfiles } from '../database/user_profiles.js';
import { createPayment, checkPayment, updateProfile, newProfile, addRefBalance } from '../utils/index.js';


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
export const handlePaymentMethod = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number, m: number; p: number; }>>) => {
    await context.editText('💳 Выберите способ оплаты:', {
        reply_markup: await paymentSystemKeyboard(context.queryData.k, context.queryData.m, context.queryData.p)
    });
};

// Оплата выбранным способом
export const handlePaymentNew = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ s: string, k: number, m: number; p: number; }>>) => {
    const url = await createPayment(context, context.queryData.p);

    if (!url) {
        await context.answerCallbackQuery('❌ Ошибка при создании счета. Попробуйте позже.');
        return;
    }

    await context.editText(`⏳ Для оплаты нажмите кнопку ниже`, {
        reply_markup: await paymentInvoiceKeyboard(
            context.queryData.k,
            context.queryData.m,
            context.queryData.p,
            url
        )
    });
};


// Проверка оплаты + редирект на продление или выдачу нового ключа
export const handleCheckPayment = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number, m: number; p: number; }>>) => {
    const paymentInfo = await checkPayment(context);
    if (!paymentInfo) {
        return;
    }

    try {
        await context.send(`💳 Покупка подписки\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${paymentInfo.payment?.service}</code>\n- Срок: <code>${context.queryData.m} мес.</code>`, {
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
    if (context.queryData.k != -1) {
        await newProfile(context);
        return;
    }

    await updateProfile(context);
};