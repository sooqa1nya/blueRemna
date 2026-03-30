import 'dotenv/config';
import { Bot } from 'gramio';

import { initDatabase } from './database/index.js';
import { mainMenu } from './handlers/main-menu.js';
import { subPayment } from './handlers/sub-payment.js';
import { activeKeys } from './handlers/active-keys.js';
import { freeTrial } from './handlers/free-trial.js';
import { affilianteProgram } from './handlers/affiliate-program.js';
import { help } from './handlers/help.js';
import { aboutUs } from './handlers/about-us.js';
import { dbUser } from './middlewares/db-user.js';
import { authMiddleware } from './middlewares/auth-middleware.js';
import { start } from './handlers/start.js';
import { admin } from './handlers/admin.js';
import { sceneCancel } from './handlers/scene-cancel.js';
import { serverFastify } from './services/remnawave/webhooks.js';
import { emptyButton } from './handlers/other.js';

initDatabase();
serverFastify();


export const bot = new Bot(process.env.BOT_TOKEN as string)
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
    .extend(admin)
    .extend(sceneCancel)
    .extend(emptyButton);

bot.start();