import { Composer } from 'gramio';
import * as handler from '../handlers/index.js';

export const affilianteProgram = new Composer()
    .callbackQuery('affiliate_program', handler.handleAffiliateProgram);