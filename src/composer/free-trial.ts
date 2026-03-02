import { Composer } from 'gramio';
import * as handler from '../handlers/index.js';

export const freeTrial = new Composer()
    .callbackQuery('free_trial', handler.handleFreeTrial);