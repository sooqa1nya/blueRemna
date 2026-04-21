import { Composer } from 'gramio';
import { sceneInit } from '../../plugins/scenes.js';

import { broadcastAdmin } from './broadcast.js';
import { statsAdmin } from './stats.js';
import { userProfilesAdmin } from './user-profiles.js';
import { vpnClientsAdmin } from './vpn-clients.js';
import { referralAdmin } from './referral.js';
import { discountsAdmin } from './discounts.js';
import { mainAdmin } from './main.js';

export const admin = new Composer({ name: 'admin' })
    .guard(context => !!context.dbuser?.is_admin)
    .extend(sceneInit)
    .extend(mainAdmin)
    .extend(broadcastAdmin)
    .extend(statsAdmin)
    .extend(userProfilesAdmin)
    .extend(vpnClientsAdmin)
    .extend(referralAdmin)
    .extend(discountsAdmin);
