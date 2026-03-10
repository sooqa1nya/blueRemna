import { Scene } from '@gramio/scenes';
import { adminMenuKeyboard } from '../keyboards/admin.js';
import { updateGlobalSale } from '../database/settings.js';
import { sceneCancelKeyboard } from '../keyboards/scene-cancel.js';


export const globalDiscountScene = new Scene('change_global_discount')
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Введите новую глобальную скидку в процентах (число от 0 до 100)', { reply_markup: sceneCancelKeyboard });
        }

        if (context.is("callback_query")) {
            await context.send('💮 Админ-панель', {
                reply_markup: await adminMenuKeyboard()
            });
            await context.answerCallbackQuery();
            return context.scene.exit();
        }

        const sale = Number(context.text);

        if (!Number.isInteger(sale) || sale < 0 || sale > 100) {
            return await context.send('Пожалуйста, введите число от 0 до 100', { reply_markup: sceneCancelKeyboard });
        }

        await updateGlobalSale(sale);

        await context.send('💮 Админ-панель', {
            reply_markup: await adminMenuKeyboard()
        });

        return context.scene.exit();
    });