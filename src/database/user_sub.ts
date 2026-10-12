import sql from './index.js';
import { IUserSub } from './types.js';


export const createUserSub = async (id: number, rwId: number, username: string, subPlanId: string): Promise<void> => {
    await sql`
        INSERT INTO user_sub (id, rw_user_id, username, sub_plan_id)
        VALUES (${id}, ${rwId}, ${username}, ${subPlanId})
    `;
};

export const getUserSub = async (userId: string | number) => {
    return await sql<IUserSub[]>`
        SELECT * FROM user_sub
        WHERE id = ${userId}
    `;
};

export const getUserSubRwId = async (userId: string | number) => {
    return await sql<IUserSub[]>`
        SELECT * FROM user_sub
        WHERE rw_user_id = ${userId}
    `;
};

export const setLimitExtended = async (userId: number, limitExtended: boolean) => {
    await sql`
        UPDATE user_sub
        SET is_limit_extended = ${limitExtended}
        WHERE id = ${userId}    
    `;
};

export const updateUserSubPlanID = async (userId: number, newPlanId: number) => {
    await sql`
        UPDATE user_sub
        SET sub_plan_id = ${newPlanId}
        WHERE id = ${userId}    
    `;
};