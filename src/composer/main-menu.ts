import { Composer } from 'gramio';
import * as handler from '../handlers/index.js';
import * as keyboard from '../keyboards/index.js';

export const mainMenu = new Composer()
    .callbackQuery('main_menu', handler.handleMainMenu)
    .callbackQuery(keyboard.mainMenuData, handler.handleBuyExtend);