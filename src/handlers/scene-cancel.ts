import { Composer } from 'gramio';


export const sceneCancel = new Composer({ name: 'sceneCancel' })
    .callbackQuery('scene_cancel', async context => {
        await context.message?.delete();
        await context.answerCallbackQuery();
    });