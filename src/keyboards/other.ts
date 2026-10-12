import { ButtonOptions, InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard } from './main.js';
import { connectHelpKeyboard } from './help.js';
import { remnawave } from '../services/remnawave/index.js';
import { getUserSub } from '../database/user_sub.js';

export const copyLinkKeyboard = (url: string) => {
    return new InlineKeyboard()
        .copy('Скопировать', url, { style: 'success' });
};

export const webAppKeyboard = (text: string, url: string) => {
    return new InlineKeyboard()
        .webApp(text, url, { style: 'primary' });
};

export const copyAndMenuKeyboard = (url: string) => {
    return new InlineKeyboard()
        .combine(copyLinkKeyboard(url))
        .row()
        .combine(backToMainMenuKeyboard);
};

export const copyWebappMenuKeyboard = async (text: string, userId: string | number) => {
    const [userSub] = await getUserSub(userId);
    const user = await remnawave.getUserByUserId(userSub.rw_user_id);

    return new InlineKeyboard()
        .columns(1)
        .combine(importHappKeyboard(user!.response.subscriptionUrl))
        .combine(copyLinkKeyboard(user!.response.subscriptionUrl))
        .combine(webAppKeyboard(text, user!.response.subscriptionUrl))
        .combine(connectHelpKeyboard)
        .text('💮 Моя подписка', 'user_sub')
        .combine(backToMainMenuKeyboard);
};

export const urlKeyboard = (text: string, url: string) => {
    return new InlineKeyboard()
        .url(text, url);
};

export const emptyButtonKeyboard = (text: string) => {
    return new InlineKeyboard()
        .text(text, '__empty_button');
};

export const importHappKeyboard = (subUrl: string) => {
    const happUrl = subUrl.replace(/https:\/\/(\w+)/, 'https://happ');
    return new InlineKeyboard()
        .url('Подключить в Happ', happUrl, { style: 'success' });
};

export const backKeyboard = (callbackData: string, customName?: string, options?: ButtonOptions) =>
    new InlineKeyboard().text(customName ?? '◀️ Назад', callbackData, options);