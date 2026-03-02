import { findUser } from '../database/users.js';

export const dbUser = async (context: any) => {
    const dbuser = await findUser(context.from?.id ?? 0);
    return { dbuser };
};