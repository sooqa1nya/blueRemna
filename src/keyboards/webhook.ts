import { CallbackData, InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard, supportKeyboard } from './main.js';
import { userKeyData } from './active-keys.js';

export const refreshFreeTrialData = new CallbackData('refresh_free_trial')
    .string('id');
export const notConnectedKeyboard = (id: string) => {
    return new InlineKeyboard()
        .columns(1)
        .combine(supportKeyboard)
        .text('🔄 Обновить пробный период', refreshFreeTrialData.pack({ id }), { style: 'success' });
};

export const profileMainMenuKeyboard = (k: number) => {
    return new InlineKeyboard()
        .columns(1)
        .text('🔑 Подписка', userKeyData.pack({ k }))
        .combine(backToMainMenuKeyboard);
};