import { Composer } from 'gramio';
import * as keyboard from '../keyboards/index.js';
import { mainMenuText } from '../utils/text/main-menu-text.js';

export const mainMenu = new Composer({ name: 'mainMenu' })
    .callbackQuery('main_menu', async context => {
        await context.editText(await mainMenuText(context.dbuser!), {
            parse_mode: 'HTML',
            reply_markup: await keyboard.mainMenuKeyboard(Boolean(context.dbuser?.trial_key), context.from.id)
        });
    });