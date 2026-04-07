import { CallbackData, InlineKeyboard } from 'gramio';
import { getAllOs } from '../database/operating_systems.js';
import { emptyButtonKeyboard } from './other.js';
import { backToMainMenuKeyboard, supportKeyboard } from './main.js';
import { getVpnClientsByOs } from '../database/vpn_clients.js';

export const listClientsKeyboard = new InlineKeyboard()
    .text('Список приложений', 'list_clients', { style: 'success' });

export const helpKeyboard = new InlineKeyboard()
    .combine(listClientsKeyboard)
    .combine(supportKeyboard)
    .combine(backToMainMenuKeyboard);

export const vpnClientData = new CallbackData('vpn_client_os_id')
    .number('id'); // id os
export const listOsKeyboard = async () => {
    const os = await getAllOs();

    const keyboard = new InlineKeyboard();
    if (os.length) {
        for (const element of os) {
            keyboard.text(element.name, vpnClientData.pack({ id: element.id }), {
                style: element.button_style || undefined
            });
        }
    } else {
        keyboard.combine(emptyButtonKeyboard('⏳ В разработке..'));
    }

    return keyboard;
};

export const listVpnClientsKeyboard = async (osId: number) => {
    const vpnClients = (await getVpnClientsByOs(osId)).filter(client => client.link);

    const keyboard = new InlineKeyboard();
    if (vpnClients.length) {
        for (const element of vpnClients) {
            keyboard.url(element.name, element.link, {
                style: element.button_style || undefined
            });
        }
    } else {
        keyboard.combine(emptyButtonKeyboard('⏳ В разработке..'));
    }

    return keyboard;
};

export const helpListVpnClientsKeyboard = async (osId: number) => {
    return new InlineKeyboard()
        .columns(1)
        .combine(await listVpnClientsKeyboard(osId))
        .text('◀️ Назад', 'list_clients')
        .combine(backToMainMenuKeyboard);
};

export const helpListOsKeyboard = async () => {
    return new InlineKeyboard()
        .columns(1)
        .combine(await listOsKeyboard())
        .text('◀️ Назад', 'help');
};

export const connectHelpKeyboard = new InlineKeyboard()
    .text('Помощь с подключением', 'help', { style: 'danger' });