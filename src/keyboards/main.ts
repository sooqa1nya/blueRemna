import { InlineKeyboard } from 'gramio';
import { getUserSub } from '../database/user_sub.js';
import { allPlansData } from './sub-payment.js';


export const policyKeyboard = new InlineKeyboard()
    .text('✅ Ознакомлен', 'accept_policy', { style: 'success' });

export const mainMenuKeyboard = async (free_trial: boolean, userId: number) => {
    const [userSub] = await getUserSub(userId);
    return new InlineKeyboard()
        .addIf(!free_trial, InlineKeyboard.text('🎁 Пробный период', 'free_trial_info', { style: 'success' }))
        .row()
        .addIf(!userSub, InlineKeyboard.text('🛒 Купить подписку', 'sub_buy'))
        .addIf(!!userSub, InlineKeyboard.text('🛒 Продлить подписку', allPlansData.pack({ planId: Number(userSub.sub_plan_id) })))
        .row()
        .addIf(!!userSub, InlineKeyboard.text('💮 Моя подписка', 'user_sub'))
        .row()
        .text('ℹ️ Информация', 'about_us')
        .text('💬 Помощь', 'help')
        .row()
        .text('💰 Партнерская программа', 'affiliate_program');
};

export const backToMainMenuKeyboard = new InlineKeyboard()
    .text('◀️ Главное меню', 'main_menu');

export const sendMainMenuKeyboard = new InlineKeyboard()
    .text('◀️ Главное меню', 'main_menu_send');

export const supportKeyboard = new InlineKeyboard()
    .url('👤 Поддержка', `https://t.me/${process.env.SUPPORT_USERNAME as string}`, { style: 'primary' });

export const supportMenuKeyboard = new InlineKeyboard()
    .combine(supportKeyboard)
    .row()
    .combine(backToMainMenuKeyboard);