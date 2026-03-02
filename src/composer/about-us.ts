import { Composer } from 'gramio';
import * as handler from '../handlers/index.js';

export const aboutUs = new Composer()
    .callbackQuery('about_us', handler.handleAboutUs);