import { Composer } from 'gramio';
import * as keyboard from '../keyboards/index.js';

export const mainMenu = new Composer({ name: 'mainMenu' })
    .callbackQuery('main_menu', async context => {
        await context.editText(`🌐 Главное меню`, { reply_markup: await keyboard.mainMenuKeyboard(Boolean(context.dbuser?.trial_key), context.from.id) });
    });