import { Composer } from 'gramio';
import { remnawave } from '../services/remnawave/index.js';
import { supportMenuKeyboard } from '../keyboards/main.js';

export const sceneCancel = new Composer({ name: 'sceneCancel' })
    .callbackQuery('scene_cancel', async context => {
        await context.message?.delete();
        await context.answerCallbackQuery();
    });