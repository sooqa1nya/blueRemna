import { Composer } from 'gramio';
import * as handler from '../handlers/index.js';

export const help = new Composer()
    .callbackQuery('help', handler.handleHelp);