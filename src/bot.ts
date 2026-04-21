import { Bot } from 'gramio';

import { mainMenu } from './handlers/main-menu.js';
import { subPayment } from './handlers/sub-payment.js';
import { activeKeys } from './handlers/active-keys.js';
import { freeTrial } from './handlers/free-trial.js';
import { affilianteProgram } from './handlers/affiliate-program.js';
import { help } from './handlers/help.js';
import { aboutUs } from './handlers/about-us.js';
import { authMiddleware } from './middlewares/auth-middleware.js';
import { start } from './handlers/start.js';
import { sceneCancel } from './handlers/scene-cancel.js';
import { emptyButton } from './handlers/other.js';
import { starsPayment } from './handlers/stars-payment.js';
import { findUser } from './database/users.js';
import { admin } from './handlers/admin/index.js';


export const bot = new Bot(process.env.BOT_TOKEN as string)
    .onStart(() => console.log('🤖 Бот запущен'))
    .derive(async context => {
        if (context.is('message') || context.is('callback_query')) {
            const dbuser = await findUser(context.chatId || context.from?.id);
            return { dbuser };
        }
        return {};
    })
    .use(authMiddleware)
    .extend(start)
    .extend(mainMenu)
    .extend(subPayment)
    .extend(activeKeys)
    .extend(freeTrial)
    .extend(affilianteProgram)
    .extend(help)
    .extend(aboutUs)
    .extend(starsPayment)
    .extend(admin)
    .extend(sceneCancel)
    .extend(emptyButton);