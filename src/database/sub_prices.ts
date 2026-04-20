import sql from './index.js';
import { ISubPrices } from './types.js';


export const getSubPrices = async () => {
    return await sql<ISubPrices[]>`
        SELECT * FROM sub_prices
    `;
};