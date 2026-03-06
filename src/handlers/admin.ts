import { Composer } from 'gramio';
import { globalDiscountScene } from '../scenes/global-discount.js';
import { scenes } from '@gramio/scenes';
import { adminMenuKeyboard } from '../keyboards/admin.js';
import { sceneInit } from '../plugins/scenes.js';

const tipaComposerNew = new Composer({ name: 'ss' })
    .extend(sceneInit)
    .callbackQuery('s', async context => {
        await context.answerCallbackQuery();
        await context.scene.enter(globalDiscountScene);
    });


export const admin = new Composer()
    .guard(context => !!context.dbuser?.is_admin)
    .extend(sceneInit)
    .command('a', async context => {
        if (!context.hasFrom()) {
            return;
        }

        await context.send('💮 Админ-панель', {
            reply_markup: await adminMenuKeyboard()
        });
    })
    .callbackQuery('change_discount', async context => {
        await context.scene.enter(globalDiscountScene);
    });