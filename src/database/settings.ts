import type { ISetting } from '../types/database.js';
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

    return Number(result!.duration) || undefined;
};

export const getSubPlans = async () => {
    const [result] = await sql<ISetting[]>`
        SELECT * FROM settings
        WHERE key = 'plans'
    `;

    return JSON.parse(result?.data).plans || undefined;
};

export const getLimitExtend = async () => {
    const [result] = await sql<ISetting[]>`
        SELECT * FROM settings
        WHERE key = 'limit_extend'
    `;

    return JSON.parse(result?.data) || undefined;
};