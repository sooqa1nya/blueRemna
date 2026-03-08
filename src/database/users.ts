import type { IUser } from '../types/database.js';
import sql from './index.js';

export const upsertUser = async (id: string | number, username: string | null, firstName: string, payload: string | null) => {
    const [user] = await sql<IUser[]>`
        INSERT INTO users (id, username, first_name, payload)
        VALUES (${id}, ${username}, ${firstName}, ${payload})
        ON CONFLICT (id) DO UPDATE
        SET 
            username = ${username},
            first_name = ${firstName},
            last_activity = NOW()
        RETURNING *
  `;
    return user;
};

export const createUser = async (id: string | number, username: string | null, firstName: string, payload: string | null): Promise<void> => {
    await sql`
        INSERT INTO users (id, username, first_name, payload)
        VALUES (${id}, ${username}, ${firstName}, ${payload})
    `;
};

export const findUser = async (id: string | number) => {
    const [user] = await sql<IUser[]>`
        SELECT * FROM users
        WHERE id = ${id}
    `;
    return user || null;
};

export const acceptPolicy = async (id: string | number): Promise<void> => {
    await sql`
        UPDATE users
        SET agreed_policy = true
        WHERE id = ${id}
    `;
};

export const findPayloadCount = async (payload: string) => {
    return await sql<{ count: number; }[]>`
        SELECT COUNT(id) as count FROM users
        WHERE
            payload = ${payload}
    `;
};

export const useFreeTrial = async (id: string | number) => {
    await sql`
        UPDATE users
        SET trial_key = TRUE
        WHERE id = ${id}
    `;
};

export const updateUserRefBalance = async (id: string | number, amount: number) => {
    await sql`
        UPDATE users
        SET ref_balance = ${amount}
        WHERE id = ${id}
    `;
};

export const getUsers = async () => {
    return await sql<IUser[]>`
        SELECT * FROM users
    `;
};

export const updateUserActivity = async (id: string | number) => {
    return await sql`
        UPDATE users
        SET last_activity = NOW()
        WHERE id = ${id}
    `;
};