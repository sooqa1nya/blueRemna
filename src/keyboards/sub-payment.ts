import { CallbackData, InlineKeyboard } from 'gramio';
import { getProfiles } from '../database/user_profiles.js';
import { backToMainMenuKeyboard } from './main.js';


// Меню выбора ключа для продления
export const currentKeysData = new CallbackData('sub_duration').number('k');
export const currentKeysKeyboard = async (userId: number) => {
    const keyboard = new InlineKeyboard();
    const profiles: any = await getProfiles(userId);

    profiles.forEach((x: any) => {
        keyboard.text('🔑 ' + x.username, currentKeysData.pack({ k: x.id })).row();
    });

    keyboard.combine(backToMainMenuKeyboard);

    return keyboard;
};

// Меню выбора длительности подписки
export const priceData = new CallbackData('payment_menu')
    .number('k')
    .number('m');
export const priceKeyboard = async (key: number, sale: number) => {
    const price = (amount: number) => {
        const discountedPrice = amount * (1 - sale / 100);
        return discountedPrice.toFixed(2);
    };

    return new InlineKeyboard()
        .text(`▶️ 1 месяц - ${price(Number(process.env.SUB_PRICE_1_MONTH!))}₽`, priceData.pack({ k: key, m: 1 }))
        .row()
        .text(`▶️ 3 месяца - ${price(Number(process.env.SUB_PRICE_3_MONTHS!))}₽`, priceData.pack({ k: key, m: 3 }))
        .row()
        .text(`▶️ 6 месяцев - ${price(Number(process.env.SUB_PRICE_6_MONTHS!))}₽`, priceData.pack({ k: key, m: 6 }))
        .row()
        .text(`▶️ 12 месяцев - ${price(Number(process.env.SUB_PRICE_12_MONTHS!))}₽`, priceData.pack({ k: key, m: 12 }))
        .row()
        .combine(backToMainMenuKeyboard);
};

// Меню выбора платежной системы для оплаты
export const paymentSystemData = new CallbackData('payment_system')
    .string('p')
    .number('k')
    .number('m');
export const paymentSystemKeyboard = async (key: number, months: number) => {
    return new InlineKeyboard()
        .text('СБП', paymentSystemData.pack({ p: 'pl', k: key, m: months }), { icon_custom_emoji_id: '5447186509029452373' })
        .row()
        .text('CryptoBot', paymentSystemData.pack({ p: 'cb', k: key, m: months }), { icon_custom_emoji_id: '5361914370068613491' })
        .row()
        .combine(backToMainMenuKeyboard);
};

// Меню выбора между новым ключом и продлением существующего
export const selectNewExtendKeyboard = new InlineKeyboard()
    .text('➕ Новый', currentKeysData.pack({ k: -1 }))
    .row()
    .text('🔄 Продлить', 'extend_key')
    .row()
    .combine(backToMainMenuKeyboard);

// Кнопки оплаты и проверки оплаты после создания счета
export const checkPaymentData = new CallbackData('check_payment')
    .number('k')
    .number('m');
export const paymentInvoiceKeyboard = async (paymentId: number, key: number, months: number, invoiceUrl: string) => {
    return new InlineKeyboard()
        .url('💳 Оплатить', invoiceUrl, { style: 'primary' })
        .row()
        .text('✅ Проверить оплату', checkPaymentData.pack({ k: key, m: months }), { style: 'success' })
        .row()
        .combine(backToMainMenuKeyboard);
};