import { Composer } from 'gramio';
import * as keyboard from '../keyboards/index.js';
import { remnawave } from '../services/remnawave/index.js';
import { getLimitExtend } from '../database/settings.js';
import { addRefBalance } from '../utils/add-ref-balance.js';
import { setRefBalance } from '../database/users.js';
import { getUserSub, setLimitExtended } from '../database/user_sub.js';
import { platega } from '../services/platega/index.js';
import { addPayment, completePaymentProcessing, getPayment, lockPaymentForProcessing, revertPaymentProcessing } from '../database/payment.js';
import { cryptoBot } from '../services/crypto-bot/index.js';
import { getPlanById } from '../database/sub_plans.js';


export const activeKeys = new Composer({ name: 'activeKeys' })
    // Профиль пользователя
    .callbackQuery('user_sub', async context => {
        const [userSub] = await getUserSub(context.from.id);
        if (!userSub) {
            return await context.editText('❗️ У вас нет активной подписки.\n\n✅ Чтобы приобрести подписку, вернитесь в главное меню и выберите пункт "Купить подписку".', { reply_markup: keyboard.backToMainMenuKeyboard });
        }

        const user = await remnawave.getUserByUserId(userSub.rw_user_id);
        if (!user) {
            return await context.answerCallbackQuery('❌ Ошибка при получении данных о подписке. Попробуйте позже.');
        }

        const expire = new Date(user.response.expireAt);
        const daysRemaining = Math.ceil((expire.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        const text = `
👤 Подписка: <code>${userSub.username}</code>
    
📆 Действует до: <code>${expire.toLocaleDateString('ru-RU')}</code>
⏳ Осталось: <code>${daysRemaining > 0 ? daysRemaining : '0'}д</code>
${user.response.hwidDeviceLimit ? `\n📱 Лимит устройств: <code>${user.response.hwidDeviceLimit}</code>\n` : ''}
ℹ️ Подключение:
 • Нажмите зеленую кнопку чтобы скопировать ключ доступа
 • Добавьте его в любое поддерживаемое приложение
 • Список рекомендуемых приложений находится в разделе главного меню "Помощь"
`;

        await context.editText(text, {
            reply_markup: await keyboard.userKeyKeyboard(userSub.id, user.response.subscriptionUrl, userSub.is_limit_extended),
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true }
        });
    })

    // Расширение лимита устройств
    .callbackQuery('extend_limit', async context => {
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
            reply_markup: await keyboard.extendPaymentMethodKeyboard(Number(context.dbuser!.ref_balance))
        });
    })

    // Создание счета СБП платега
    .callbackQuery('sbp_extend_payment', async context => {
        const limit = await getLimitExtend();
        const price = (Number(limit.price));

        const transaction = await platega.createTransaction({
            paymentMethod: 2,
            paymentDetails: {
                amount: price,
                currency: 'RUB',
            },
            description: JSON.stringify({ userId: context.from.id, months: 0 }),
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
            0,
            null,
            context.dbuser?.payload || null
        );

        if (!payment) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета (#2). Попробуйте позже.');
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
                payment.id,
                transaction.redirect as string
            )
        });
    })

    // Создание счета CryptoBot
    .callbackQuery('cb_extend_payment', async context => {
        const limit = await getLimitExtend();
        const price = (Number(limit.price));

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
            'Platega',
            invoice.result.invoice_id.toString(),
            price,
            0,
            null,
            context.dbuser?.payload || null
        );

        if (!payment) {
            await context.answerCallbackQuery('❌ Ошибка при создании счета (#2). Попробуйте позже.');
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
                payment.id,
                invoice.result.pay_url
            )
        });
    })

    // Чек на оплату Telegram Stars
    .callbackQuery('stars_extend_payment', async context => {
        const limit = await getLimitExtend();
        const price = Number(limit.price) / Number(process.env.STARS_COEFFICIENT);

        await context.sendInvoice({
            title: `Расширение лимита устройств`,
            description: `Для оплаты нажмите кнопку ниже`,
            payload: JSON.stringify({
                e: true
            }),
            currency: 'XTR',
            prices: [
                {
                    label: 'Подписка', amount: Math.round(price)
                }
            ]
        });
        await context.answerCallbackQuery();
    })

    // Оплата реф. балансом
    .callbackQuery('ref_balance_lim_extend', async context => {
        if (!context.dbuser) {
            return;
        }

        const [subUser] = await getUserSub(context.from.id);
        if (subUser.is_limit_extended) {
            await context.editText('🚫 Максимальный лимит устройств для этой подписки уже достигнут', { reply_markup: keyboard.backToMainMenuKeyboard });
            return;
        }

        const limit = await getLimitExtend();
        const price = Number(limit.price);

        if (Number(context.dbuser.ref_balance) < price) {
            await context.editText('🚫 Недостаточно реферального баланса для оплаты', { reply_markup: keyboard.backToMainMenuKeyboard });
            return;
        }

        const user = await remnawave.getUserByUserId(subUser.rw_user_id);

        try {
            await remnawave.updateUser({
                id: user!.response.id,
                trafficLimitStrategy: 'NO_RESET',
                hwidDeviceLimit: Number(user!.response.hwidDeviceLimit!) + Number(limit.devices)
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

        await setRefBalance(context.from.id, Number(context.dbuser.ref_balance) - price);
        await setLimitExtended(context.from.id, true);

        await context.editText(`✅ Дополнительные устройства добавлены, приятного пользования!`, { parse_mode: 'HTML', reply_markup: keyboard.backToMainMenuKeyboard });
    })

    // Проверка оплаты СБП Platega и CryptoBot 
    .callbackQuery(keyboard.extendCheckPaymentData, async context => {
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

        const [userSub] = await getUserSub(context.from.id);
        const user = await remnawave.getUserByUserId(userSub.rw_user_id);
        const limit = await getLimitExtend();

        // Бонуска
        try {
            await addRefBalance(context.dbuser?.payload, Number(limit.price));
        } catch (e) {
            console.error('Ошибка выдачи рефки (active-keys):', e);
        }

        try {
            await remnawave.updateUser({
                id: user!.response.id,
                trafficLimitStrategy: 'NO_RESET',
                hwidDeviceLimit: Number(user!.response.hwidDeviceLimit!) + Number(limit.devices)
            });
        } catch (e) {
            console.error('Ошибка при расширении лимита устройств:', e);
        }

        try {
            await context.send(`💳 Покупка доп устройств\n\n- Пользователь: <code>${context.from.id}</code>\n- Сервис: <code>${payment.service}</code>\n- Цена: <code>${limit.price}₽</code>`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }

        await setLimitExtended(context.from.id, true);

        await context.editText(`✅ Дополнительные устройства добавлены, приятного пользования!`, { parse_mode: 'HTML', reply_markup: keyboard.backToMainMenuKeyboard });
    })

    // Список подключенных устройств
    .callbackQuery('user_hwid_devices', async context => {
        const [userSub] = await getUserSub(context.from.id);
        const userHwid = (await remnawave.getUserHwidDevices(userSub.rw_user_id))!.response;

        if (!userHwid.total) {
            return context.answerCallbackQuery('⚠️ У вас нет подключенных устройств');
        }

        await context.editText(`📱 Подключенные устройства: <code>${userHwid.total}</code>`, {
            parse_mode: 'HTML',
            reply_markup: await keyboard.userHwidDevicesKeyboard(userSub.rw_user_id)
        });
    })

    // Информация о подключенном устройстве
    .callbackQuery(keyboard.deviceInfoData, async context => {
        const [userSub] = await getUserSub(context.from.id);
        const profileId = userSub.rw_user_id;

        const devices = (await remnawave.getUserHwidDevices(profileId))!.response.devices;
        const device = devices.find(x => x.hwid == context.queryData.hwid);

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
            reply_markup: await keyboard.userDeviceKeyboard(device.hwid)
        });
    })

    // Удаление подключенного устройства
    .callbackQuery(keyboard.removeHwidDeviceData, async context => {
        const [userSub] = await getUserSub(context.from.id);
        const profileId = userSub.rw_user_id;
        const isRemove = await remnawave.deleteUserHwidDevice({ userId: profileId, hwid: context.queryData.hwid });

        const userHwid = (await remnawave.getUserHwidDevices(profileId))!.response;
        await context.editText(`📱 Подключенные устройства: <code>${userHwid.total}</code>`, {
            parse_mode: 'HTML',
            reply_markup: await keyboard.userHwidDevicesKeyboard(profileId)
        });

        if (isRemove) {
            await context.answerCallbackQuery('✅ Устройство удалено');
        } else {
            await context.answerCallbackQuery('❌ Устройства не существует');
        }
    })

    // Смена тарифного плана
    .callbackQuery('change_plan', async context => {
        await context.answerCallbackQuery();

        await context.editText('📋 Выберите тарифный план', {
            parse_mode: 'HTML',
            reply_markup: await keyboard.selectChangePlanKeyboard()
        });
    })

    .callbackQuery(keyboard.selectChangePlanData, async context => {
        await context.answerCallbackQuery();
        const [plan] = await getPlanById(context.queryData.planId);

        const text = `
<b>${plan.name}</b>

<blockquote>${plan.info}</blockquote>
`;
        await context.editText(text, {
            parse_mode: 'HTML',
            reply_markup: await keyboard.changePricesKeyboard(context.queryData.planId, context.dbuser!.sale)
        });
    })


    .callbackQuery(keyboard.changePricesData, async context => {
        await context.answerCallbackQuery();
        await context.send('⏳ В разработке.. Для смены тарифного плана обратитесь в поддержку.\n ');
    });