import { Composer } from 'gramio';
import { globalDiscountScene } from '../scenes/admin/global-discount.js';
import { scenes } from '@gramio/scenes';
import { broadcastScene } from '../scenes/admin/broadcast.js';
import { refStatsScene } from '../scenes/admin/ref-stats.js';
import { aFindUserProfileScene } from '../scenes/admin/find-user-profile.js';
import { changeSaleScene } from '../scenes/admin/change-sale.js';
import { changeRefBalanceScene } from '../scenes/admin/change-ref-balance.js';
import { changeRefProcentScene } from '../scenes/admin/change-ref-procent.js';
import { addVpnClientScene } from '../scenes/admin/add-vpn-client.js';
import { changeVpnClientLinkScene } from '../scenes/admin/change-vpn-client-link.js';
import { changeVpnClientNameScene } from '../scenes/admin/change-vpn-client-name.js';
import { changeDescriptionScene } from '../scenes/admin/change-description.js';

export const sceneInit = new Composer({ name: 'sceneInit' })
    .extend(scenes([
        globalDiscountScene, broadcastScene,
        refStatsScene, aFindUserProfileScene,
        changeSaleScene, changeRefBalanceScene,
        changeRefProcentScene, addVpnClientScene,
        changeVpnClientLinkScene, changeVpnClientNameScene,
        changeDescriptionScene
    ]))
    .as('scoped');