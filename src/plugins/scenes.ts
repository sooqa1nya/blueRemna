import { Composer } from 'gramio';
import { globalDiscountScene } from '../scenes/global-discount.js';
import { scenes } from '@gramio/scenes';

export const sceneInit = new Composer({ name: 'sceneInit' })
    .extend(scenes([globalDiscountScene]))
    .as('scoped');