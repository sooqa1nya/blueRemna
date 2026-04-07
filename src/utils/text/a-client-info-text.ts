import { getOsById } from '../../database/operating_systems.js';
import { getVpnClientById } from '../../database/vpn_clients.js';

export const clientInfoText = async (clientId: number) => {
    const client = await getVpnClientById(clientId);
    const os = await getOsById(client.operating_system_id);

    return `
ОС: <code>${os.name}</code>
Клиент: <code>${client.name}</code>
Приоритет: <code>${client.priority}</code>
Стиль кнопки: <code>${client.button_style || 'default'}</code>

Ссылка: <code>${client.link || 'empty'}</code>
    `;
};