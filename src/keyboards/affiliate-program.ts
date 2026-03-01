import { InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard } from './main.js';

export const refKeyboard = (url: string) => {
    const text = `${url}

💙 blueVPN — моя защита в сети  
бесплатный пробный период по моей ссылке
${url}

Попробуй, скорость и приватность реально радуют ⚡🔒
    `;
    return new InlineKeyboard()
        .switchToChosenChat('🫂 Пригласить друга', {
            query: text,
            allow_user_chats: true,
            allow_group_chats: true,
            allow_channel_chats: true,
            allow_bot_chats: false
        }, {
            style: 'primary'
        })
        .combine(backToMainMenuKeyboard)
        .columns(1);
};