import type { IUserProfiles } from './types.js';
import sql from './index.js';

export const addProfile = async (userId: number, rwId: number, username: string): Promise<void> => {
    await sql`
        INSERT INTO user_profiles (user_id, rw_user_id, username)
        VALUES (${userId}, ${rwId}, ${username})
    `;
};

export const getProfiles = async (userId: number) => {
    return await sql<IUserProfiles[]>`
        SELECT * FROM user_profiles
        WHERE user_id = ${userId}
    `;
};

export const getProfile = async (rwId: number) => {
    return await sql<IUserProfiles[]>`
        SELECT * FROM user_profiles
        WHERE rw_user_id = ${rwId}
    `;
};

export const getProfileByID = async (id: number) => {
    return await sql<IUserProfiles[]>`
        SELECT * FROM user_profiles
        WHERE id = ${id}
    `;
};

export const setLimitExtended = async (id: number, limitExtended: boolean) => {
    await sql`
        UPDATE user_profiles
        SET is_limit_extended = ${limitExtended}
        WHERE id = ${id}    
    `;
};
