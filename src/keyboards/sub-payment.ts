import { CallbackData, InlineKeyboard } from 'gramio';
import { getProfiles } from '../database/user_profiles.js';
import { backToMainMenuKeyboard } from './main.js';
import { getSubPlans } from '../database/settings.js';


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
    .number('m')
    .number('p');
export const priceKeyboard = async (key: number, sale: number) => {
    let prices: { months: number, price: number; }[] = await getSubPlans();
    prices.forEach(x => x.price = Math.round(x.price * (1 - sale / 100)));
    const getPrice = (months: number) => {
        return prices.find(x => x.months == months)!.price;
    };
    enum price {
        'm1' = getPrice(1),
        'm3' = getPrice(3),
        'm6' = getPrice(6),
        'm12' = getPrice(12)
    }

    return new InlineKeyboard()
        .text(`▶️ 1 месяц - ${price.m1}₽`, priceData.pack({ k: key, m: 1, p: price.m1 }))
        .row()
        .text(`▶️ 3 месяца - ${price.m3}₽`, priceData.pack({ k: key, m: 3, p: price.m3 }))
        .row()
        .text(`▶️ 6 месяцев - ${price.m6}₽`, priceData.pack({ k: key, m: 6, p: price.m6 }))
        .row()
        .text(`▶️ 12 месяцев - ${price.m12}₽`, priceData.pack({ k: key, m: 12, p: price.m12 }))
        .row()
        .combine(backToMainMenuKeyboard);
};

// Меню выбора платежной системы для оплаты
export const paymentSystemData = new CallbackData('payment_system')
    .string('s')
    .number('k')
    .number('m')
    .number('p');
export const paymentSystemKeyboard = async (key: number, months: number, price: number) => {
    return new InlineKeyboard()
        .text('СБП', paymentSystemData.pack({ s: 'pl', k: key, m: months, p: price }), { icon_custom_emoji_id: '5447186509029452373' })
        .row()
        .text('CryptoBot', paymentSystemData.pack({ s: 'cb', k: key, m: months, p: price }), { icon_custom_emoji_id: '5361914370068613491' })
        .row()
        .combine(backToMainMenuKeyboard);
};

// Меню выбора между новым ключом и продлением существующего
export const selectNewExtendKeyboard = new InlineKeyboard()
    .text('➕ Оформить новую', currentKeysData.pack({ k: -1 }))
    .row()
    .text('🔄 Продлить', 'extend_key')
    .row()
    .combine(backToMainMenuKeyboard);

// Кнопки оплаты и проверки оплаты после создания счета
export const checkPaymentData = new CallbackData('check_payment')
    .number('k')
    .number('m')
    .number('p');
export const paymentInvoiceKeyboard = async (key: number, months: number, price: number, invoiceUrl: string) => {
    return new InlineKeyboard()
        .url('💳 Оплатить', invoiceUrl, { style: 'primary' })
        .row()
        .text('✅ Проверить оплату', checkPaymentData.pack({ k: key, m: months, p: price }), { style: 'success' })
        .row()
        .combine(backToMainMenuKeyboard);
};