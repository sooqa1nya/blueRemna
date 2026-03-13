import { InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard } from './main.js';

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

export const copyWebappMenuKeyboard = (text: string, url: string) => {
    return new InlineKeyboard()
        .combine(copyLinkKeyboard(url))
        .row()
        .combine(webAppKeyboard(text, url))
        .row()
        .combine(backToMainMenuKeyboard);
};

export const urlKeyboard = (text: string, url: string) => {
    return new InlineKeyboard()
        .url(text, url);
}; 