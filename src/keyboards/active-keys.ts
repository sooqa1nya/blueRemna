import { CallbackData, InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard, sendMainMenuKeyboard } from './main.js';
import { copyLinkKeyboard, importHappKeyboard } from './other.js';
import { getLimitExtend } from '../database/settings.js';
import { remnawave } from '../services/remnawave/index.js';
import { connectHelpKeyboard } from './help.js';
import { allPlansData } from './sub-payment.js';
import { getUserSub } from '../database/user_sub.js';


// Клавиатура подписки
export const userKeyKeyboard = async (userId: string, subUrl: string, isDeviceLimit: boolean) => {
    const [userSub1] = await getUserSub(userId);
    return new InlineKeyboard()
        .combine(importHappKeyboard(subUrl))
        .row()
        .combine(copyLinkKeyboard(subUrl))
        .row()
        .webApp('👤 Профиль', subUrl, { style: 'primary' })
        .row()
        .combine(connectHelpKeyboard)
        .row()
        .addIf(!isDeviceLimit, InlineKeyboard.text('🔼 Расширить лимит', 'extend_limit'))
        .text('📱 Мои устройства', 'user_hwid_devices')
        .row()
        .text('🔄 Продлить', allPlansData.pack({ planId: Number(userSub1.sub_plan_id) }))
        .row()
        .combine(backToMainMenuKeyboard);
};

// Выбор платежной системы
export const extendPaymentMethodKeyboard = async (refBalance: number) => {
    const limit = await getLimitExtend();
    const price = Number(limit.price);

    return new InlineKeyboard()
        .columns(1)
        .addIf(refBalance >= price, InlineKeyboard.text('Баланс бота', 'ref_balance_lim_extend', { icon_custom_emoji_id: '5357080225463149588' }))
        .text('СБП', 'sbp_extend_payment', { icon_custom_emoji_id: '5447186509029452373' })
        .text('CryptoBot', 'cb_extend_payment', { icon_custom_emoji_id: '5361914370068613491' })
        .text('Stars', 'stars_extend_payment', { icon_custom_emoji_id: '5321485469249198987' })
        .combine(backToMainMenuKeyboard);
};

// Проверка оплаты
export const extendCheckPaymentData = new CallbackData('extend_cp')
    .number('paymentId'); // payment id
export const extendPaymentInvoiceKeyboard = async (paymentId: number, invoiceUrl: string) => {
    return new InlineKeyboard()
        .url('💳 Оплатить', invoiceUrl, { style: 'primary' })
        .row()
        .text('✅ Проверить оплату', extendCheckPaymentData.pack({ paymentId }), { style: 'success' })
        .row()
        .combine(sendMainMenuKeyboard);
};

// Список всех подключенных устройств
export const deviceInfoData = new CallbackData('di')
    .string('hwid');
export const userHwidDevicesKeyboard = async (rwUserId: number) => {
    const devices = (await remnawave.getUserHwidDevices(Number(rwUserId)))!.response.devices;

    const keyboard = new InlineKeyboard();

    devices.forEach((x, index) => {
        keyboard.text(
            `⏺️ ${x.deviceModel}`,
            deviceInfoData.pack({ hwid: x.hwid, })
        );
        // если устройств в ряду == 2 переносим строку
        if ((index + 1) % 2 === 0) {
            keyboard.row();
        }
    });

    keyboard
        .row()
        .text('◀️ Назад', 'user_sub');

    return keyboard;
};

// Подключенное устройство
export const removeHwidDeviceData = new CallbackData('rd')
    .string('hwid');
export const userDeviceKeyboard = async (hwid: string,) => {
    return new InlineKeyboard()
        .columns(1)
        .text('Удалить', removeHwidDeviceData.pack({ hwid }), { style: 'danger' })
        .text('◀️ Назад', 'user_hwid_devices');
};