import { Composer } from 'gramio';
import { globalDiscountScene } from '../scenes/global-discount.js';
import { scenes } from '@gramio/scenes';
import { broadcastScene } from '../scenes/broadcast.js';
import { refStats } from '../scenes/ref-stats.js';

export const sceneInit = new Composer({ name: 'sceneInit' })
    .extend(scenes([globalDiscountScene, broadcastScene, refStats]))
    .as('scoped');