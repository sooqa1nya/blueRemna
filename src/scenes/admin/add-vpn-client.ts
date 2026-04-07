import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { adminlistVpnClientsKeyboard, adminVpnClientProfileKeyboard } from '../../keyboards/admin.js';
import { addVpnClient } from '../../database/vpn_clients.js';


export const addVpnClientScene = new Scene('add_vpn_client')
    .params<{ osId: number; }>()
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Отправьте название', { reply_markup: sceneCancelKeyboard });
        }

        const osId = context.scene.params.osId;
        if (context.is("callback_query")) {
            await context.send('Список клиентов', {
                parse_mode: 'HTML',
                reply_markup: await adminlistVpnClientsKeyboard(osId)
            });
            await context.answerCallbackQuery();
            return context.scene.exit();
        }

        if (!context.text) {
            return await context.send('Отправьте название', { reply_markup: sceneCancelKeyboard });
        }

        const [client] = await addVpnClient(osId, context.text);

        await context.send(`✅ Клиент добавлен\n\nНазвание: <code>${context.text}</code>`, {
            parse_mode: 'HTML',
            reply_markup: await adminVpnClientProfileKeyboard(osId, client.id)
        });

        return await context.scene.exit();
    });