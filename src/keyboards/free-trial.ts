import { InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard, supportKeyboard } from './main.js';


export const freeTrialInfoKeyboard = new InlineKeyboard()
    .columns(1)
    .text('🎁 Активировать подписку', 'free_trial', { style: 'success' })
    .combine(supportKeyboard)
    .combine(backToMainMenuKeyboard);
