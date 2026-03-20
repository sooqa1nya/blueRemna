import type { IUserProfiles } from '../types/database.js';
import sql from './index.js';

export const addProfile = async (userId: number, uuid: string, username: string): Promise<void> => {
    await sql`
        INSERT INTO user_profiles (user_id, uuid, username)
        VALUES (${userId}, ${uuid}, ${username})
    `;
};

export const getProfiles = async (userId: number) => {
    return await sql<IUserProfiles[]>`
        SELECT * FROM user_profiles
        WHERE user_id = ${userId}
    `;
};

export const getProfile = async (uuid: string) => {
    return await sql<IUserProfiles[]>`
        SELECT * FROM user_profiles
        WHERE uuid = ${uuid}
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