import sql from './index.js';
import { IOperatingSystems } from './types.js';


export const getAllOs = async () => {
    return sql<IOperatingSystems[]>`
        SELECT * FROM operating_systems
        ORDER BY priority DESC
    `;
};