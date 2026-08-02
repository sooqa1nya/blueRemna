import type { IUser } from './types.js';
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

export const useFreeTrial = async (id: string | number, status: boolean = true) => {
    const result = await sql`
        UPDATE users
        SET trial_key = ${status}
        WHERE id = ${id} AND trial_key = FALSE
        RETURNING id
    `;
    return result.length > 0; // Возвращает true, если обновление произошло
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

export const getActiveUsers = async () => {
    return await sql<IUser[]>`
        SELECT * FROM users
        WHERE is_active = TRUE
    `;
};

export const updateUserActivity = async (id: string | number) => {
    return await sql`
        UPDATE users
        SET
            last_activity = NOW(),
            is_active = TRUE
        WHERE id = ${id}
    `;
};

export const setActive = async (id: string | number, active: boolean) => {
    return await sql`
        UPDATE users
        SET is_active = ${active}
        WHERE id = ${id}
    `;
};

export const getUsersPayload = async (payload: string) => {
    return await sql<IUser[]>`
        SELECT * FROM users
        WHERE payload = ${payload}
    `;
};

export const setRefBalance = async (id: string | number, balance: number) => {
    await sql`
        UPDATE users
        SET ref_balance = ${balance}
        WHERE id = ${id}
    `;
};

export const updateRefBalance = async (id: string | number, balance: number) => {
    await sql`
        UPDATE users
        SET ref_balance = ref_balance + ${balance}
        WHERE id = ${id}
    `;
};

export const setUserSale = async (id: string | number, sale: number) => {
    await sql`
        UPDATE users
        SET sale = ${sale}
        WHERE id = ${id}
    `;
};

export const setUserRefProc = async (id: string | number, proc: number) => {
    await sql`
        UPDATE users
        SET ref_proc = ${proc}
        WHERE id = ${id}
    `;
};