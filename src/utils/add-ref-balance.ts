import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { findUser, updateUserRefBalance } from '../database/users.js';

export const addRefBalance = async (context: CallbackQueryShorthandContext<Bot, any>, amount: number) => {
    if (context.dbuser?.payload) {
        const regex = /id([?<id>0-9]+)/;
        if (regex.test(context.dbuser.payload)) {
            const match = context.dbuser.payload.match(regex)!;
            const referrerId = match[1];
            if (!referrerId) {
                return;
            }

            const referrer = await findUser(Number(referrerId));
            if (referrer) {
                await updateUserRefBalance(referrer.id, Number(referrer.ref_balance) + amount * (referrer.ref_proc / 100));
            }
        }
    }
};


