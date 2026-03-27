import { Scene } from '@gramio/scenes';
import { adminMenuKeyboard, broadcastMenuKeyboard } from '../../keyboards/admin.js';
import { updateGlobalSale } from '../../database/settings.js';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';


export const broadcastScene = new Scene('broadcast')
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Отправьте пост для рассылки', { reply_markup: sceneCancelKeyboard });
        }

        if (context.is("callback_query")) {
            context.scene.exit();
            await context.editText('Меню рассылки', {
                reply_markup: broadcastMenuKeyboard()
            });

            await context.answerCallbackQuery();
            return;
        }

        await context.send('Меню рассылки', {
            reply_markup: broadcastMenuKeyboard(context.id)
        });

        return context.scene.exit();
    });