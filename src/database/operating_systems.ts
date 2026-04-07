import sql from './index.js';
import { IOperatingSystems } from './types.js';


export const getAllOs = async () => {
    return await sql<IOperatingSystems[]>`
        SELECT * FROM operating_systems
        ORDER BY priority DESC
    `;
};

export const getOsById = async (id: number) => {
    const [result] = await sql<IOperatingSystems[]>`
        SELECT * FROM operating_systems
        WHERE id = ${id}
    `;

    return result;
};