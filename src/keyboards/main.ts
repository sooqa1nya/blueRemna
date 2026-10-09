import { CallbackData, InlineKeyboard } from 'gramio';
import { getProfiles } from '../database/user_profiles.js';

export const policyKeyboard = new InlineKeyboard()
    .text('✅ Ознакомлен', 'accept_policy', { style: 'success' });

export const mainMenuKeyboard = async (free_trial: boolean, id: number) => {
    const profiles = await getProfiles(id);
    return new InlineKeyboard()
        .addIf(!free_trial, InlineKeyboard.text('🎁 Пробный период', 'free_trial_info', { style: 'success' }))
        .row()
        .text(profiles.length > 0 ? '🛒 Продлить подписку' : '🛒 Купить подписку', 'sub_buy')
        .row()
        .addIf(profiles.length > 0, InlineKeyboard.text('💮 Моя подписка', 'active_keys'))
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