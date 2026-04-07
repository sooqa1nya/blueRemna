import sql from './index.js';
import { IVpnClients } from './types.js';

export const getVpnClientsByOs = async (osId: number) => {
    return await sql<IVpnClients[]>`
        SELECT
            vc.id as id,
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

export const getVpnClientById = async (id: number) => {
    const [result] = await sql<IVpnClients[]>`
        SELECT * FROM vpn_clients
        WHERE id = ${id}
    `;

    return result;
};

export const addVpnClient = async (osId: number, name: string) => {
    return await sql`
        INSERT INTO vpn_clients (operating_system_id, name)
        VALUES (${osId}, ${name})
        RETURNING *
    `;
};

export const updateVpnClientPriority = async (id: number, priority: number) => {
    await sql`
        UPDATE vpn_clients
        SET priority = priority + ${priority}
        WHERE id = ${id}
    `;
};

export const changeVpnClientLink = async (id: number, link: string) => {
    await sql`
        UPDATE vpn_clients
        SET link = ${link}
        WHERE id = ${id}
    `;
};

export const changeVpnClientName = async (id: number, name: string) => {
    await sql`
        UPDATE vpn_clients
        SET name = ${name}
        WHERE id = ${id}
    `;
};

export const changeVpnClientButtonStyle = async (id: number, buttonStyle: string | null) => {
    await sql`
        UPDATE vpn_clients
        SET button_style = ${buttonStyle}
        WHERE id = ${id}
    `;
};

export const deleteVpnClient = async (id: number) => {
    await sql`
        DELETE FROM vpn_clients
        WHERE id = ${id}
    `;
};