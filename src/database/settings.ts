import type { ISetting } from '../types/database.js';
import sql from './index.js';

export const getKey = async (key: string) => {
    return await sql<ISetting[]>`
        SELECT * FROM settings
        WHERE key = ${key}
    `;
};

export const getFreeTrial = async () => {
    const [freeTrial] = await sql<ISetting[]>`
        SELECT * FROM settings
        WHERE key = 'free_trial'
    `;

    return JSON.parse(freeTrial?.data).duration || undefined;
};

export const getSubPlans = async () => {
    const [plans] = await sql<ISetting[]>`
        SELECT * FROM settings
        WHERE key = 'plans'
    `;

    return JSON.parse(plans?.data).plans || undefined;
};