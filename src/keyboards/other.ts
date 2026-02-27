import { InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard } from './main.js';

export const copyLinkKeyboard = (url: string) => {
    return new InlineKeyboard()
        .copy('📋 Скопировать', url, { style: 'success' });
};
export const copyAndMenuKeyboard = (url: string) => {
    return new InlineKeyboard()
        .combine(copyLinkKeyboard(url))
        .row()
        .combine(backToMainMenuKeyboard);
}; 