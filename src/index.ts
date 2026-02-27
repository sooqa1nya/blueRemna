import 'dotenv/config';
import { Bot } from 'gramio';

import { initDatabase } from './database/index.js';
import { handleStart } from './commands/start.js';
import * as handler from './handlers/index.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import * as keyboard from './keyboards/index.js';

initDatabase();

const bot = new Bot(process.env.BOT_TOKEN as string)
    .onStart(() => console.log('🤖 Бот запущен'));


// Middlewares
bot.use(authMiddleware);

// Commands
bot.command('start', handleStart);

// Callbacks
// main menu
bot.callbackQuery('accept_policy', handler.handleAcceptPolicy);
bot.callbackQuery('main_menu', handler.handleMainMenu);
bot.callbackQuery(keyboard.mainMenuData, handler.handleBuyExtend);

// payment
bot.callbackQuery('extend_key', handler.handleExtendKey);
bot.callbackQuery(keyboard.currentKeysData, handler.handleSelectDuration);
bot.callbackQuery(keyboard.priceData, handler.handlePaymentMethod);
bot.callbackQuery(keyboard.paymentSystemData, handler.handlePaymentNew);
bot.callbackQuery(keyboard.checkPaymentData, handler.handleCheckPayment);

// active keys
bot.callbackQuery('active_keys', handler.handleActiveKeys);
bot.callbackQuery(keyboard.userKeyData, handler.handleActiveKey);
bot.callbackQuery(keyboard.extendDeviceLimitData, handler.handleExtendDeviceLimit);
bot.callbackQuery(keyboard.extendPaymentData, handler.handleExtendPayment);
bot.callbackQuery(keyboard.extendCheckPaymentData, handler.handleExtendCheckPayment);

// about us
bot.callbackQuery('about_us', handler.handleAboutUs);

// help
bot.callbackQuery('help', handler.handleHelp);

// affiliate program
bot.callbackQuery('affiliate_program', handler.handleAffiliateProgram);

// free trial
bot.callbackQuery('free_trial', handler.handleFreeTrial);


bot.start();