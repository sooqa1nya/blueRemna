import { Composer } from 'gramio';
import * as keyboard from '../keyboards/index.js';
import { getProfileByID, getProfiles, setLimitExtended } from '../database/user_profiles.js';
import { remnawave } from '../services/remnawave/index.js';
import { getLimitExtend } from '../database/settings.js';
import { createPayment } from '../utils/create-payment.js';
import { checkPayment } from '../utils/check-payment.js';
import { addRefBalance } from '../utils/add-ref-balance.js';
import { updateRefBalance } from '../database/users.js';

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
👤 Подписка: <code>${dbprofile?.username}</code>
    
📆 Действует до: <code>${expire.toLocaleDateString('ru-RU')}</code>
⏳ Осталось: <code>${!!daysRemaining ? daysRemaining : 0}д</code>
${user.response.hwidDeviceLimit ? `\n📱 Лимит устройств: <code>${user.response.hwidDeviceLimit}</code>\n` : ''}
ℹ️ Подключение:
 • Нажмите зеленую кнопку чтобы скопировать ключ доступа
 • Добавьте его в любое поддерживаемое приложение
 • Список рекомендуемых приложений находится в разделе главного меню "Помощь"
    `, {
            reply_markup: await keyboard.userKeyKeyboard(context.queryData.k, user.response.subscriptionUrl, !!dbprofile?.is_limit_extended, user.response.uuid),
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
            reply_markup: await keyboard.extendPaymentMethodKeyboard(context.queryData.k, context.dbuser!.ref_balance)
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
            await context.send(`💳 Покупка доп устройств\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${paymentInfo.payment?.service}</code>\n- Цена: <code>${limit.price}₽</code>`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }

        await setLimitExtended(context.queryData.k, true);

        await context.editText(`✅ Дополнительные устройства добавлены, приятного пользования!`, { parse_mode: 'HTML', reply_markup: keyboard.backToMainMenuKeyboard });
    })

    .callbackQuery(keyboard.refExtendPaymentData, async context => {
        if (!context.dbuser) {
            return;
        }

        const [userProfile] = await getProfileByID(context.queryData.k);
        if (userProfile.is_limit_extended) {
            await context.editText('🚫 Максимальный лимит устройств для этой подписки уже достигнут', { reply_markup: keyboard.backToMainMenuKeyboard });
            return;
        }

        const limit = await getLimitExtend();
        const price = Number(limit.price);

        if (context.dbuser.ref_balance < price) {
            await context.editText('🚫 Недостаточно реферального баланса для оплаты', { reply_markup: keyboard.backToMainMenuKeyboard });
            return;
        }

        const user = await remnawave.getUserByUUID((await getProfileByID(context.queryData.k))[0]!.uuid);

        try {
            await remnawave.updateUser({
                uuid: user.response.uuid,
                hwidDeviceLimit: Number(user.response.hwidDeviceLimit!) + Number(limit.devices)
            });
        } catch (e) {
            console.error('Ошибка при расширении лимита устройств:', e);
        }

        try {
            await context.send(`💰 Покупка доп устройств с реферального баланса\n\n- Пользователь: <code>${context.from.id}</code>\n- Списано: <code>${limit.price}₽</code>`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }

        await updateRefBalance(context.from.id, context.dbuser.ref_balance - price);
        await setLimitExtended(context.queryData.k, true);

        await context.editText(`✅ Дополнительные устройства добавлены, приятного пользования!`, { parse_mode: 'HTML', reply_markup: keyboard.backToMainMenuKeyboard });
    })

    .callbackQuery(keyboard.userHwidDevicesData, async context => {
        const userHwid = (await remnawave.getUserHwidDevices(context.queryData.uuid)).response;

        if (!userHwid.total) {
            return context.answerCallbackQuery('⚠️ У вас нет подключенных устройств');
        }

        await context.editText(`📱 Подключенные устройства: <code>${userHwid.total}</code>`, {
            parse_mode: 'HTML',
            reply_markup: await keyboard.userHwidDevicesKeyboard(context.queryData.uuid, context.queryData.k)
        });
    })

    .callbackQuery(keyboard.deviceInfoData, async context => {
        const [profile] = await getProfileByID(context.queryData.u);
        const uuid = profile.uuid;

        const devices = (await remnawave.getUserHwidDevices(uuid)).response.devices;
        const device = devices.find(x => x.hwid == context.queryData.h);

        if (!device) {
            return await context.answerCallbackQuery('❌ Ошибка: устройство не найдено');
        }

        const created = new Date(device.createdAt);
        const updated = new Date(device.updatedAt);

        const text = `
📱 Информация об устройстве
       <code>${device.deviceModel}</code>

🗓 Создано: <code>${created.toLocaleDateString('ru-RU')} в ${created.toLocaleTimeString('ru-RU')}</code>
🔄 Обновлено: <code>${updated.toLocaleDateString('ru-RU')} в ${updated.toLocaleTimeString('ru-RU')}</code>


💻 Платформа: <code>${device.platform} ${device.osVersion}</code>
🆔 HWID: <code>${device.hwid}</code>
🌐 User-Agent: <code>${device.userAgent}</code>
        `;

        await context.editText(text, {
            parse_mode: 'HTML',
            reply_markup: await keyboard.userDeviceKeyboard(uuid, device.hwid, context.queryData.u)
        });
    })

    .callbackQuery(keyboard.removeHwidDeviceData, async context => {
        const [profile] = await getProfileByID(context.queryData.u);
        const uuid = profile.uuid;
        const isRemove = await remnawave.deleteUserHwidDevice({ userUuid: uuid, hwid: context.queryData.h });

        const userHwid = (await remnawave.getUserHwidDevices(uuid)).response;
        await context.editText(`📱 Подключенные устройства: <code>${userHwid.total}</code>`, {
            parse_mode: 'HTML',
            reply_markup: await keyboard.userHwidDevicesKeyboard(uuid, context.queryData.u)
        });

        if (isRemove) {
            await context.answerCallbackQuery('✅ Устройство удалено');
        } else {
            await context.answerCallbackQuery('❌ Устройства не существует');
        }
    });
