import { Composer } from 'gramio';
import * as keyboard from '../keyboards/index.js';
import { getProfileByID, getProfiles } from '../database/user_profiles.js';
import { remnawave } from '../services/remnawave/index.js';
import { getLimitExtend } from '../database/settings.js';
import { createPayment } from '../utils/create-payment.js';
import { checkPayment } from '../utils/check-payment.js';
import { addRefBalance } from '../utils/add-ref-balance.js';

export const activeKeys = new Composer({ name: 'activeKeys' })
    .callbackQuery('active_keys', async context => {
        const profiles = await getProfiles(context.from.id);
        if (!profiles.length) {
            return await context.editText('❗️ У вас нет активной подписки.\n\n✅ Чтобы приобрести подписку, вернитесь в главное меню и выберите пункт "Купить или продлить".', { reply_markup: keyboard.backToMainMenuKeyboard });
        }

        await context.editText('🔑 Доступные подписки', { reply_markup: await keyboard.userKeysKeyboard(context.from.id) });
    })

    .callbackQuery(keyboard.userKeyData, async context => {
        const [dbprofile] = (await getProfileByID(context.queryData.k));

        const user = await remnawave.getUserByUUID(dbprofile!.uuid);
        const expire = new Date(user.response.expireAt);
        const daysRemaining = Math.ceil((expire.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        await context.editText(`
🔑 <code>${dbprofile?.username}</code>

📆 Дата истечения: <code>${expire.toLocaleDateString('ru-RU')} (${daysRemaining}д)</code>
${user.response.hwidDeviceLimit ? `📱 Лимит устройств: <code>${user.response.hwidDeviceLimit}</code>\n` : ''}
ℹ️ Примечание:
<i> - Что бы активировать подписку необходимо добавить ссылку в приложение.
- Список доступных приложений вы можете найти в разделе "Помощь" главного меню или перейдя по кнопке "Профиль".
- Что бы скопировать ссылку нажмите на зеленую кнопку.</i>
    `, {
            reply_markup: await keyboard.userKeyKeyboard(context.queryData.k, user.response.subscriptionUrl, !!dbprofile?.is_limit_extended),
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true }
        });
    })

    .callbackQuery(keyboard.extendDeviceLimitData, async context => {
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
            reply_markup: await keyboard.extendPaymentMethodKeyboard(context.queryData.k)
        });
    })

    .callbackQuery(keyboard.extendPaymentData, async context => {
        const limit = await getLimitExtend();
        const price = (Number(limit.price));

        const url = await createPayment(context, price);

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
            reply_markup: await keyboard.extendPaymentInvoiceKeyboard(
                context.queryData.k,
                url
            )
        });
    })

    .callbackQuery(keyboard.extendCheckPaymentData, async context => {
        const paymentInfo = await checkPayment(context);
        if (!paymentInfo) {
            return;
        }

        const user = await remnawave.getUserByUUID((await getProfileByID(context.queryData.k))[0]!.uuid);
        const limit = await getLimitExtend();

        // Бонуска
        try {
            await addRefBalance(context, Number(limit.price));
        } catch (e) {
            console.error('Ошибка выдачи рефки (active-keys):', e);
        }

        try {
            await remnawave.updateUser({
                uuid: user.response.uuid,
                hwidDeviceLimit: Number(user.response.hwidDeviceLimit!) + Number(limit.devices)
            });
        } catch (e) {
            console.error('Ошибка при расширении лимита устройств:', e);
        }

        try {
            await context.send(`💳 Покупка доп устройств\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${paymentInfo.payment?.service}</code>\n - Цена: ${limit.price}`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }

        await context.editText(`✅ Дополнительные устройства добавлены, приятного пользования!`, { parse_mode: 'HTML', reply_markup: keyboard.backToMainMenuKeyboard });
    });