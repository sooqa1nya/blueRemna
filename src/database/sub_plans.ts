import sql from './index.js';
import { ISubPlans } from './types.js';


export const getSubPlans = async () => {
    return await sql<ISubPlans[]>`
        SELECT * FROM sub_plans
        ORDER BY priority DESC
    `;
};

export const getPlanById = async (id: number) => {
    return await sql<ISubPlans[]>`
        SELECT * FROM sub_plans
        WHERE id = ${id}
    `;
};