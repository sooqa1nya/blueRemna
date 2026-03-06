import { CallbackData, InlineKeyboard } from 'gramio';
import { getProfiles } from '../database/user_profiles.js';
import { backToMainMenuKeyboard } from './main.js';
import { copyLinkKeyboard } from './other.js';
import { currentKeysData } from './sub-payment.js';

// Список всех подписок
export const userKeyData = new CallbackData('active_key')
    .number('k');
export const userKeysKeyboard = async (userId: number) => {
    return new InlineKeyboard()
        .add(...(await getProfiles(userId)).map(x => InlineKeyboard.text(`⏺️ ${x.username}`, userKeyData.pack({ k: x.id }))))
        .combine(backToMainMenuKeyboard)
        .columns(1);
};

// Отдельная подписка
export const extendDeviceLimitData = new CallbackData('extend_limit')
    .number('k');
export const userKeyKeyboard = async (key: number, subUrl: string, isDeviceLimit: boolean) => {
    return new InlineKeyboard()
        .combine(copyLinkKeyboard(subUrl))
        .row()
        .webApp('👤 Профиль', subUrl, { style: 'primary' })
        .row()
        .addIf(!isDeviceLimit, InlineKeyboard.text('🔼 Расширить лимит', extendDeviceLimitData.pack({ k: key })))
        .row()
        .text('🔄 Продлить', currentKeysData.pack({ k: key }))
        .row()
        .combine(backToMainMenuKeyboard);
};

export const extendPaymentData = new CallbackData('extend_payment')
    .string('s')
    .number('k');
export const extendPaymentMethodKeyboard = async (key: number) => {
    return new InlineKeyboard()
        .text('СБП', extendPaymentData.pack({ s: 'pl', k: key }), { icon_custom_emoji_id: '5447186509029452373' })
        .row()
        .text('CryptoBot', extendPaymentData.pack({ s: 'cb', k: key }), { icon_custom_emoji_id: '5361914370068613491' })
        .row()
        .combine(backToMainMenuKeyboard);
};

export const extendCheckPaymentData = new CallbackData('extend_cp')
    .number('k');
export const extendPaymentInvoiceKeyboard = async (key: number, invoiceUrl: string) => {
    return new InlineKeyboard()
        .url('💳 Оплатить', invoiceUrl, { style: 'primary' })
        .row()
        .text('✅ Проверить оплату', extendCheckPaymentData.pack({ k: key }), { style: 'success' })
        .row()
        .combine(backToMainMenuKeyboard);
};