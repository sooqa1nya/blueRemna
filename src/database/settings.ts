import type { ISetting } from './types.js';
import sql from './index.js';

export const getKey = async (key: string) => {
    return await sql<ISetting[]>`
        SELECT * FROM settings
        WHERE key = ${key}
    `;
};

export const getFreeTrial = async () => {
    const [result] = await sql`
        SELECT data->>'duration' AS duration 
        FROM settings 
        WHERE key = 'free_trial'
    `;

    return Number(result?.duration) || undefined;
};

export const getSubPlans = async () => {
    const [result] = await sql<ISetting[]>`
        SELECT * FROM settings
        WHERE key = 'plans'
    `;

    return result?.data.plans || undefined;
};

export const getLimitExtend = async () => {
    const [result] = await sql<ISetting[]>`
        SELECT * FROM settings
        WHERE key = 'limit_extend'
    `;

    return result?.data || undefined;
};

export const getGlobalSale = async () => {
    const [result] = await sql`
        SELECT data->>'sale' AS sale FROM settings
        WHERE key = 'global_sale'
    `;

    return Number(result?.sale) || 0;
};

export const updateGlobalSale = async (sale: number) => {
    await sql`
        UPDATE settings
        SET data = jsonb_set(data, '{sale}', ${sale})
        WHERE key = 'global_sale';
    `;
};