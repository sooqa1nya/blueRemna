import { Composer } from 'gramio';
import { adminMenuKeyboard } from '../../keyboards/admin.js';

export const mainAdmin = new Composer({ name: 'admin-main' })
    .command('a', async context => {
        await context.send('💮 Админ-панель', {
            reply_markup: await adminMenuKeyboard()
        });
    })
    .callbackQuery('a', async context => {
        await context.editText('💮 Админ-панель', {
            reply_markup: await adminMenuKeyboard()
        });
        await context.answerCallbackQuery();
    });
