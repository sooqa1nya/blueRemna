import type { Bot, CallbackData, CallbackQueryShorthandContext } from 'gramio';
import { getProfileByID, getProfiles } from '../database/user_profiles.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';
import { extendPaymentInvoiceKeyboard, extendPaymentMethodKeyboard, userKeyKeyboard, userKeysKeyboard } from '../keyboards/active-keys.js';
import { remnawave } from '../services/remnawave/index.js';
import { getLimitExtend } from '../database/settings.js';
import { checkPayment } from '../utils/check-payment.js';
import { findUser, updateUserRefBalance } from '../database/users.js';
import { createPayment } from '../utils/create-payment.js';


export const handleActiveKeys = async (context: CallbackQueryShorthandContext<Bot, 'active_keys'>) => {
    const profiles = await getProfiles(context.from.id);
    if (!profiles.length) {
        return await context.editText('❗️ У вас нет активной подписки.\n\n✅ Чтобы приобрести подписку, вернитесь в главное меню и выберите пункт "Купить или продлить".', { reply_markup: backToMainMenuKeyboard });
    }

    await context.editText('🔑 Доступные подписки:', { reply_markup: await userKeysKeyboard(context.from.id) });
};

export const handleActiveKey = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number; }>>) => {
    const [dbprofile] = (await getProfileByID(context.queryData.k));

    const user = await remnawave.getUserByUUID(dbprofile!.uuid);
    const expire = new Date(user.response.expireAt);
    const daysRemaining = Math.ceil((expire.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    await context.editText(`
🔑 <code>${dbprofile?.username}</code>

📆 Дата истечения: <code>${expire.toLocaleDateString('ru-RU')} (${daysRemaining}д)</code>
${user.response.hwidDeviceLimit ? `📱 Лимит устройств: <code>${user.response.hwidDeviceLimit}</code>\n` : ''}
<code>${user.response.subscriptionUrl}</code>

ℹ️ Примечание:
<i> - Что бы активировать подписку необходимо добавить ссылку в приложение.
 - Список доступных приложений вы можете найти в разделе "Помощь" главного меню.
 - Что бы скопировать ссылку нажмите на зеленую кнопку.</i>
    `, {
        reply_markup: await userKeyKeyboard(context.queryData.k, user.response.subscriptionUrl),
        parse_mode: 'HTML'
    });
};

export const handleExtendDeviceLimit = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number; }>>) => {
    const limit = await getLimitExtend();

    const text = `
<b>🔼 Расширение лимита устройств</b>

📱 Дополнительные устройства: <code>${limit.devices}</code>
💰 Стоимость расширения: <code>${limit.price}₽</code>

ℹ️ Примечание:
<i> - Расширить лимит устройств для подписки можно только один раз
 - Лимит расширяется только для выбранной подписки
 - После окончания подписки лимит <u>не сбрасывается</u></i>
`;

    await context.editText(text, {
        parse_mode: 'HTML',
        reply_markup: await extendPaymentMethodKeyboard(context.queryData.k)
    });
};

export const handleExtendPayment = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ s: string, k: number; }>>) => {
    const limit = await getLimitExtend();
    const price = limit.price;

    const url = await createPayment(context, price);

    if (!url) {
        await context.answerCallbackQuery('❌ Ошибка при создании счета. Попробуйте позже.');
        return;
    }

    await context.editText(`⏳ Для оплаты нажмите кнопку ниже`, {
        reply_markup: await extendPaymentInvoiceKeyboard(
            context.queryData.k,
            url
        )
    });
};

export const handleExtendCheckPayment = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number; }>>) => {
    const paymentInfo = await checkPayment(context);
    if (!paymentInfo) {
        return;
    }

    try {
        await context.send(`💳 Покупка доп устройств\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${paymentInfo.payment?.service}</code>`, {
            chat_id: process.env.LOG_CHAT_ID!,
            parse_mode: 'HTML'
        });
    } catch { }

    const user = await remnawave.getUserByUUID((await getProfileByID(context.queryData.k))[0]!.uuid);
    const limit = await getLimitExtend();

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
                await updateUserRefBalance(referrer.id, referrer.ref_balance + limit.price * (referrer.ref_proc / 100));
            }
        }
    }

    try {
        await remnawave.updateUser({
            uuid: user.response.uuid,
            hwidDeviceLimit: Number(user.response.hwidDeviceLimit!) + Number(limit.devices)
        });
    } catch (e) {
        console.error('Ошибка при расширении лимита устройств:', e);
    }

    await context.editText(`✅ Дополнительные устройства добавлены, приятного пользования!`, { parse_mode: 'HTML', reply_markup: backToMainMenuKeyboard });
};