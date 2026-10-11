import { CallbackData, InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard, sendMainMenuKeyboard } from './main.js';
import { finalPrice } from '../utils/final-price.js';
import { getPriceById, getPricesByPlan } from '../database/sub_prices.js';
import { getSubPlans } from '../database/sub_plans.js';
import { backKeyboard } from './other.js';
import { getUserSub } from '../database/user_sub.js';


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

// Кнопка "Продлить подписку"
export const extendSubKeyboard = async (userId: string | number) => {
    const [userSub] = await getUserSub(userId);
    return new InlineKeyboard()
        .text('🔄 Продлить', allPlansData.pack({ planId: Number(userSub.sub_plan_id) }));
};