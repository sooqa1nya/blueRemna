import { CallbackData, InlineKeyboard } from 'gramio';

export const policyKeyboard = new InlineKeyboard()
    .text('✅ Ознакомлен', 'accept_policy', { style: 'success' });


export const mainMenuData = new CallbackData('buy_extend')
    .number('k');
export const mainMenuKeyboard = async (free_trial: boolean) => {
    return new InlineKeyboard()
        .text('🛒 Оформить подписку', mainMenuData.pack({ k: -1 }))
        .text('🔑 Мои подписки', 'active_keys')
        .row()
        .text('ℹ️ Информация', 'about_us')
        .text('💬 Помощь', 'help')
        .row()
        .addIf(!free_trial, InlineKeyboard.text('🔑 Пробный период', 'free_trial'))
        .row()
        .text('💰 Партнерская программа', 'affiliate_program');
};

export const backToMainMenuKeyboard = new InlineKeyboard()
    .text('◀️ Главное меню', 'main_menu');

export const supportKeyboard = new InlineKeyboard()
    .url('👤 Поддержка', `https://t.me/${process.env.SUPPORT_USERNAME as string}`, { style: 'primary' });

export const supportMenuKeyboard = new InlineKeyboard()
    .combine(supportKeyboard)
    .row()
    .combine(backToMainMenuKeyboard);