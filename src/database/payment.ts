import type { IPayment } from '../types/database.js';
import sql from './index.js';

export const addPayment = async (userId: number, service: string, paymentId: string, amount: number, payload: string | null) => {
    return await sql<IPayment[]>`
        INSERT INTO payments (user_id, service, payment_id, amount, payload)
        VALUES (${userId}, ${service}, ${paymentId}, ${amount}, ${payload})
        RETURNING *
    `;
};

export const getPayment = async (id: number) => {
    return await sql<IPayment[]>`
        SELECT * FROM payments
        WHERE id = ${id}
    `;
};

export const getPayments = async (id: number) => {
    return await sql<IPayment[]>`
        SELECT * FROM payments
        WHERE 
            user_id = ${id} AND
            payment_time >= NOW() - INTERVAL '30 minutes'
    `;
};

export const changeStatus = async (id: number, status: 'paid' | 'pending'): Promise<void> => {
    await sql<IPayment[]>`
        UPDATE payments
        SET status = ${status}
        WHERE id = ${id}
    `;
};

export const getPaymentPayload = async (payload: string) => {
    return await sql<IPayment[]>`
        SELECT * FROM payments
        WHERE 
            payload = ${payload} AND
            status = 'paid'
    `;
};

export const getPaid = async () => {
    return await sql<IPayment[]>`
        SELECT * FROM payments
        WHERE status = 'paid'
    `;
};

export const getPaidSubs = async () => {
    const [result] = await sql`
        SELECT SUM(amount) FROM payments
        WHERE status = 'paid'
    `;

    return result.sum || 0;
};

export const getUserPaidPayments = async (id: number) => {
    return await sql<IPayment[]>`
        SELECT * FROM payments
        WHERE
            id = ${id} AND
            status = 'paid'
    `;
};