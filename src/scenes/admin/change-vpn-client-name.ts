import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { adminVpnClientProfileKeyboard } from '../../keyboards/admin.js';
import { changeVpnClientName } from '../../database/vpn_clients.js';
import { clientInfoText } from '../../utils/text/a-client-info-text.js';


export const changeVpnClientNameScene = new Scene('change_vpn_client_name')
    .params<{ osId: number; clientId: number; }>()
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Отправьте название', { reply_markup: sceneCancelKeyboard });
        }

        const osId = context.scene.params.osId;
        const clientId = context.scene.params.clientId;

        if (context.is("callback_query")) {
            await context.send(await clientInfoText(clientId), {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
                reply_markup: await adminVpnClientProfileKeyboard(osId, clientId)
            });
            await context.answerCallbackQuery();
            return await context.scene.exit();
        }

        if (!context.text) {
            return await context.send('Отправьте название', { reply_markup: sceneCancelKeyboard });
        }

        await changeVpnClientName(clientId, context.text);

        await context.send(await clientInfoText(clientId), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: await adminVpnClientProfileKeyboard(osId, clientId)
        });

        return await context.scene.exit();
    });