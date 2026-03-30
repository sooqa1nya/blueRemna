import sql from './index.js';
import { IVpnClients } from './types.js';

export const getVpnClientsByOs = async (osId: number) => {
    return sql<IVpnClients[]>`
        SELECT 
            vc.name as name,
            vc.operating_system_id as operating_system_id,
            vc.link as link,
            vc.button_style as button_style,
            vc.priority as priority
        FROM vpn_clients vc
        JOIN operating_systems os ON vc.operating_system_id = os.id
        WHERE os.id = ${osId}
        ORDER BY vc.priority DESC
    `;
};