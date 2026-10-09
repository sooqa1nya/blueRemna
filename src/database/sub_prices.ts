import sql from './index.js';
import { ISubPrices } from './types.js';

// УДАЛЕНИЕ
export const getSubPrices = async () => {
    return await sql<ISubPrices[]>`
        SELECT * FROM sub_prices
    `;
};

export const getPricesByPlan = async (planId: number) => {
    return await sql<ISubPrices[]>`
        SELECT * FROM sub_prices
        WHERE plan_id = ${planId}
        ORDER BY months
    `;
};

export const getPriceById = async (priceId: number) => {
    return await sql<ISubPrices[]>`
        SELECT * FROM sub_prices
        WHERE id = ${priceId}
    `;
};