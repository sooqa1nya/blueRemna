import { InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard } from './main.js';

export const refKeyboard = (url: string) => {
    const text = `https://t.me/share/url?url=${url}

💙 blueVPN — моя защита в сети  
бесплатный пробный период по моей ссылке
${url}

Попробуй, скорость и приватность реально радуют ⚡🔒`;

    return new InlineKeyboard()
        .url('🫂 Пригласить друга', text, { style: 'primary' })
        .combine(backToMainMenuKeyboard)
        .columns(1);
};