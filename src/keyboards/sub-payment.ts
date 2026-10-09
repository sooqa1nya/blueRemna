import { CallbackData, InlineKeyboard } from 'gramio';
import { getProfiles } from '../database/user_profiles.js';
import { backToMainMenuKeyboard, sendMainMenuKeyboard } from './main.js';
import { finalPrice } from '../utils/final-price.js';
import { getPriceById, getPricesByPlan, getSubPrices } from '../database/sub_prices.js';
import { getSubPlans } from '../database/sub_plans.js';
import { backKeyboard } from './other.js';


// Выбор тарифного плана
export const allPlansData = new CallbackData('all_plans')
    .number('planId');
export const allPlansKeyboard = async () => {
    const keyboard = new InlineKeyboard();
    const plans = await getSubPlans();

    plans.forEach((x) => {
        keyboard.text(x.name, allPlansData.pack({ planId: x.id })).row();
    });

    keyboard.combine(backKeyboard('main_menu'));

    return keyboard;
};

// Цены по тарифному плану (отображение со скидкой)
export const pricesData = new CallbackData('plan_prices')
    .number('priceId');
export const pricesKeyboard = async (planId: number, userSale: number) => {
    const keyboard = new InlineKeyboard();
    const prices = await getPricesByPlan(planId);

    const updatedPrices = await Promise.all(
        prices.map(async (x) => ({
            ...x,
            amount: await finalPrice(x.amount, userSale),
        }))
    );

    updatedPrices.forEach(async (x) => {
        keyboard.text(`${x.amount}₽ [${x.months} мес]`, pricesData.pack({ priceId: x.id })).row();
    });


    keyboard.combine(backKeyboard('sub_buy'));

    return keyboard;
};

// Меню выбора платежной системы для оплаты
export const sbpPlategaData = new CallbackData('payment_platega')
    .number('priceId');
export const cryptobotData = new CallbackData('payment_cb')
    .number('priceId');
export const starsData = new CallbackData('payment_stars')
    .number('priceId');
export const paymentRefBalanceData = new CallbackData('payment_bot')
    .number('priceId');
export const paymentServiceKeyboard = async (priceId: number, refBalance: string) => {
    const [price] = await getPriceById(priceId);

    return new InlineKeyboard()
        .columns(1)
        .addIf(Number(refBalance) >= Number(await finalPrice(price.amount, Number(refBalance))), InlineKeyboard.text('Баланс бота', paymentRefBalanceData.pack({ priceId }), { icon_custom_emoji_id: '5357080225463149588' }))
        .text('СБП', sbpPlategaData.pack({ priceId }), { icon_custom_emoji_id: '5447186509029452373' })
        .text('CryptoBot', sbpPlategaData.pack({ priceId }), { icon_custom_emoji_id: '5361914370068613491' })
        .text('Stars', starsData.pack({ priceId }), { icon_custom_emoji_id: '5321485469249198987' })
        .combine(backToMainMenuKeyboard);
};


// Кнопки оплаты и проверки оплаты после создания счета
export const checkPaymentData = new CallbackData('check_payment')
    .number('paymentId'); // payment id
export const paymentInvoiceKeyboard = async (paymentId: number, invoiceUrl: string) => {
    return new InlineKeyboard()
        .url('💳 Оплатить', invoiceUrl, { style: 'primary' })
        .row()
        .text('✅ Проверить оплату', checkPaymentData.pack({ paymentId: paymentId }), { style: 'success' })
        .row()
        .combine(sendMainMenuKeyboard);
};












// Меню выбора ключа для продления
export const currentKeysData = new CallbackData('sub_duration')
    .number('k');
export const currentKeysKeyboard = async (userId: number) => {
    const keyboard = new InlineKeyboard();
    const profiles: any = await getProfiles(userId);

    profiles.forEach((x: any) => {
        keyboard.text('⏺️ ' + x.username, currentKeysData.pack({ k: x.id })).row();
    });

    keyboard.combine(backToMainMenuKeyboard);

    return keyboard;
};

export const extendSubKeyboard = async (key: number) => {
    return new InlineKeyboard()
        .text('🔄 Продлить', currentKeysData.pack({ k: key }));
};

// Меню выбора длительности подписки
export const priceData = new CallbackData('payment_menu')
    .number('k')
    .number('m')
    .number('p');
export const priceKeyboard = async (key: number, sale: number) => {
    let prices = await getSubPrices();
    for (const element of prices) {
        element.amount = await finalPrice(element.amount, sale);
    }
    const getPrice = async (months: number) => {
        return prices.find(x => x.months == months)!.amount;
    };
    const price = {
        m1: await getPrice(1),
        m3: await getPrice(3),
        m6: await getPrice(6),
        m12: await getPrice(12)
    };

    return new InlineKeyboard()
        .text(`▶️ 1 месяц - ${price.m1}₽`, priceData.pack({ k: key, m: 1, p: Number(price.m1) }))
        .row()
        .text(`▶️ 3 месяца - ${price.m3}₽`, priceData.pack({ k: key, m: 3, p: Number(price.m3) }))
        .row()
        .text(`▶️ 6 месяцев - ${price.m6}₽`, priceData.pack({ k: key, m: 6, p: Number(price.m6) }))
        .row()
        .text(`▶️ 12 месяцев - ${price.m12}₽`, priceData.pack({ k: key, m: 12, p: Number(price.m12) }))
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

