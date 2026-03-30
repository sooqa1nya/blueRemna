import { InlineKeyboard } from 'gramio';
import { backToMainMenuKeyboard } from './main.js';
import { connectHelpKeyboard } from './help.js';

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
        .columns(1)
        .combine(importHappKeyboard(url))
        .combine(copyLinkKeyboard(url))
        .combine(webAppKeyboard(text, url))
        .combine(connectHelpKeyboard)
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