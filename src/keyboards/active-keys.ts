import { CallbackData, InlineKeyboard } from 'gramio';
import { getProfiles } from '../database/user_profiles.js';
import { backToMainMenuKeyboard } from './main.js';
import { copyLinkKeyboard, importHappKeyboard } from './other.js';
import { currentKeysData } from './sub-payment.js';
import { getLimitExtend } from '../database/settings.js';
import { remnawave } from '../services/remnawave/index.js';
import { connectHelpKeyboard } from './help.js';

// Список всех подписок
export const userKeyData = new CallbackData('active_key')
    .number('k');
export const userKeysKeyboard = async (userId: number) => {
    const userProfiles = await getProfiles(userId);

    const userWithStatus = await Promise.all(userProfiles.map(async x => {
        const remoteUser = await remnawave.getUserByUUID(x.uuid);
        return {
            profile: x,
            status: remoteUser?.response?.status ?? 'UNKNOWN'
        };
    }));

    const buttons = userWithStatus.map(({ profile, status }) => {
        let statusPrefix = '';
        switch (status) {
            case 'ACTIVE':
                statusPrefix = '🟢';
                break;
            case 'DISABLED':
                statusPrefix = '🔴';
                break;
            case 'EXPIRED':
                statusPrefix = '🟡';
                break;
            case 'LIMITED':
                statusPrefix = '⚠️';
                break;
            default:
                statusPrefix = '❔';
        }

        return InlineKeyboard.text(`${statusPrefix} ${profile.username}`, userKeyData.pack({ k: profile.id }));
    });

    return new InlineKeyboard()
        .add(...buttons)
        .combine(backToMainMenuKeyboard)
        .columns(1);
};

// Отдельная подписка
export const extendDeviceLimitData = new CallbackData('extend_limit')
    .number('k');
export const userHwidDevicesData = new CallbackData('user_hwid_devices')
    .number('k')
    .string('uuid'); // uuid
export const userKeyKeyboard = async (key: number, subUrl: string, isDeviceLimit: boolean, uuid: string) => {
    return new InlineKeyboard()
        .combine(importHappKeyboard(subUrl))
        .row()
        .combine(copyLinkKeyboard(subUrl))
        .row()
        .webApp('👤 Профиль', subUrl, { style: 'primary' })
        .row()
        .combine(connectHelpKeyboard)
        .row()
        .addIf(!isDeviceLimit, InlineKeyboard.text('🔼 Расширить лимит', extendDeviceLimitData.pack({ k: key })))
        .text('📱 Мои устройства', userHwidDevicesData.pack({ k: key, uuid }))
        .row()
        .text('🔄 Продлить', currentKeysData.pack({ k: key }))
        .row()
        .combine(backToMainMenuKeyboard);
};

export const refExtendPaymentData = new CallbackData('ref_balance_lim_extend')
    .number('k');
export const extendPaymentData = new CallbackData('extend_payment')
    .string('s')
    .number('k');
export const starsExtendPaymentData = new CallbackData('stars_extend_payment')
    .string('s')
    .number('k');
export const extendPaymentMethodKeyboard = async (key: number, refBalance: number) => {
    const limit = await getLimitExtend();
    const price = Number(limit.price);

    return new InlineKeyboard()
        .columns(1)
        .addIf(refBalance >= price, InlineKeyboard.text('💰 Списать с баланса', refExtendPaymentData.pack({ k: key })))
        .text('СБП', extendPaymentData.pack({ s: 'pl', k: key }), { icon_custom_emoji_id: '5447186509029452373' })
        .text('CryptoBot', extendPaymentData.pack({ s: 'cb', k: key }), { icon_custom_emoji_id: '5361914370068613491' })
        .text('Stars', starsExtendPaymentData.pack({ s: 'cb', k: key }), { icon_custom_emoji_id: '5321485469249198987' })
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

export const deviceInfoData = new CallbackData('di')
    .string('h') // hwid
    .number('u'); // user profile id
export const userHwidDevicesKeyboard = async (uuid: string, userProfileId: number) => {
    const devices = (await remnawave.getUserHwidDevices(uuid))!.response.devices;

    const keyboard = new InlineKeyboard();

    devices.forEach((x, index) => {
        keyboard.text(
            `⏺️ ${x.deviceModel}`,
            deviceInfoData.pack({ h: x.hwid, u: userProfileId })
        );
        // если устройств в ряду == 2 переносим строку
        if ((index + 1) % 2 === 0) {
            keyboard.row();
        }
    });

    keyboard
        .row()
        .text('◀️ Назад', userKeyData.pack({ k: userProfileId }));

    return keyboard;
};

export const removeHwidDeviceData = new CallbackData('rd')
    .string('h') // hwid
    .number('u'); // user profile id
export const userDeviceKeyboard = async (uuid: string, hwid: string, userProfileId: number) => {
    return new InlineKeyboard()
        .columns(1)
        .text('Удалить', removeHwidDeviceData.pack({ h: hwid, u: userProfileId }), { style: 'danger' })
        .text('◀️ Назад', userHwidDevicesData.pack({ k: userProfileId, uuid }));
};