import { InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard } from './main.js';

export const refKeyboard = () => {
    return new InlineKeyboard()
        .switchToChat('🫂 Пригласить друга', undefined, { style: 'primary' })
        .combine(backToMainMenuKeyboard)
        .columns(1);
};