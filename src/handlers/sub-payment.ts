import { type Bot, type CallbackData, type CallbackQueryShorthandContext } from 'gramio';
import { backToMainMenuKeyboard, currentKeysKeyboard, paymentInvoiceKeyboard, paymentSystemKeyboard, priceKeyboard, selectNewExtendKeyboard } from '../keyboards/index.js';
import { addProfile, getProfileByID, getProfiles } from '../database/user_profiles.js';
import { findUser, updateUserRefBalance } from '../database/users.js';
import { remnawave } from '../services/remnawave/index.js';
import { createPayment } from '../utils/create-payment.js';
import { checkPayment } from '../utils/check-payment.js';


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
                await updateUserRefBalance(referrer.id, referrer.ref_balance + context.queryData.p * (referrer.ref_proc / 100));
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
    const squads = await remnawave.getSquadForVPN();

    if (!squads) {
        await context.answerCallbackQuery('❌ Ошибка при добавлении в сквад. Обратитесь в поддержку.');
        return;
    }

    date.setDate(date.getDate() + days);
    const user = await remnawave.createUser({
        username: profile,
        expireAt: date.toISOString(),
        telegramId: context.from.id,
        hwidDeviceLimit: 5,
        activeInternalSquads: [squads.internal],
        externalSquadUuid: squads.external
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