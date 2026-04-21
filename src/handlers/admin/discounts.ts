import { Composer } from 'gramio';
import { sceneInit } from '../../plugins/scenes.js';
import { globalDiscountScene } from '../../scenes/admin/global-discount.js';

export const discountsAdmin = new Composer({ name: 'admin-discounts' })
    .extend(sceneInit)
    .callbackQuery('change_discount', async context => {
        await context.scene.enter(globalDiscountScene);
    });
