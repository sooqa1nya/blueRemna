import { Composer } from 'gramio';
import * as handler from '../handlers/index.js';
import { handleStart } from '../commands/start.js';

export const start = new Composer()
    .command('start', handleStart)
    .callbackQuery('accept_policy', handler.handleAcceptPolicy);