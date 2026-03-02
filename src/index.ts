import 'dotenv/config';
import { Bot } from 'gramio';

import { initDatabase } from './database/index.js';
import { mainMenu } from './composer/main-menu.js';
import { subPayment } from './composer/sub-payment.js';
import { activeKeys } from './composer/active-keys.js';
import { freeTrial } from './composer/free-trial.js';
import { affilianteProgram } from './composer/affiliate-program.js';
import { help } from './composer/help.js';
import { aboutUs } from './composer/about-us.js';
import { dbUser } from './middlewares/db-user.js';
import { authMiddleware } from './middlewares/auth-middleware.js';
import { start } from './composer/start.js';

initDatabase();

new Bot(process.env.BOT_TOKEN as string)
    .onStart(() => console.log('🤖 Бот запущен'))
    .derive(dbUser)
    .use(authMiddleware)
    .extend(start)
    .extend(mainMenu)
    .extend(subPayment)
    .extend(activeKeys)
    .extend(freeTrial)
    .extend(affilianteProgram)
    .extend(help)
    .extend(aboutUs)
    .start();