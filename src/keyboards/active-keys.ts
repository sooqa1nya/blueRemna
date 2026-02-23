import { CallbackData, InlineKeyboard } from 'gramio';
import { getProfiles } from '../database/user_profiles.js';
import { backToMainMenuKeyboard } from './main.js';
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
export const userKeyKeyboard = async (key: number, subUrl: string) => {
    return new InlineKeyboard()
        .text('🔄 Продлить', currentKeysData.pack({ k: key }), { style: 'primary' })
        .row()
        .copy('📋 Скопировать', subUrl, { style: 'success' })
        .row()
        .combine(backToMainMenuKeyboard);
};