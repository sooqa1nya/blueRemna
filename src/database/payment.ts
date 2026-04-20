import type { IPayment } from './types.js';
import sql from './index.js';

export const addPayment = async (userId: number, service: string, paymentId: string, amount: number, months: number, payload: string | null) => {
    return await sql<IPayment[]>`
        INSERT INTO payments (user_id, service, payment_id, amount, months, payload)
        VALUES (${userId}, ${service}, ${paymentId}, ${amount}, ${months}, ${payload})
        RETURNING *
    `;
};

export const getPayment = async (id: number) => {
    return await sql<IPayment[]>`
        SELECT * FROM payments
        WHERE id = ${id}
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

export const getUserPaidPayments = async (userId: number) => {
    return await sql<IPayment[]>`
        SELECT * FROM payments
        WHERE
            user_id = ${userId} AND
            status = 'paid'
    `;
};


export const getPaymentStats = async () => {
    return await sql < { count_today: number; sum_today: string; count_week: number; sum_week: string; count_month: number; sum_month: string; count_all: number; sum_all: string; }[]> `
        SELECT
            -- За текущий день
            COUNT(*) FILTER (WHERE payment_time >= CURRENT_DATE)                          AS count_today,
            COALESCE(SUM(amount) FILTER (WHERE payment_time >= CURRENT_DATE), 0)          AS sum_today,

            -- За текущую неделю
            COUNT(*) FILTER (WHERE payment_time >= DATE_TRUNC('week', NOW()))              AS count_week,
            COALESCE(SUM(amount) FILTER (WHERE payment_time >= DATE_TRUNC('week', NOW())), 0) AS sum_week,

            -- За текущий месяц
            COUNT(*) FILTER (WHERE payment_time >= DATE_TRUNC('month', NOW()))             AS count_month,
            COALESCE(SUM(amount) FILTER (WHERE payment_time >= DATE_TRUNC('month', NOW())), 0) AS sum_month,

            -- За всё время
            COUNT(*)                                                                       AS count_all,
            COALESCE(SUM(amount), 0)                                                       AS sum_all

        FROM payments
        WHERE status = 'paid';
    `;
};