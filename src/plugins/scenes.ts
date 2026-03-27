import { Composer } from 'gramio';
import { globalDiscountScene } from '../scenes/admin/global-discount.js';
import { scenes } from '@gramio/scenes';
import { broadcastScene } from '../scenes/admin/broadcast.js';
import { refStats } from '../scenes/admin/ref-stats.js';
import { aFindUserProfile } from '../scenes/admin/find-user-profile.js';
import { changeSale } from '../scenes/admin/change-sale.js';
import { changeRefBalance } from '../scenes/admin/change-ref-balance.js';
import { changeRefProcent } from '../scenes/admin/change-ref-procent.js';

export const sceneInit = new Composer({ name: 'sceneInit' })
    .extend(scenes([globalDiscountScene, broadcastScene, refStats, aFindUserProfile, changeSale, changeRefBalance, changeRefProcent]))
    .as('scoped');