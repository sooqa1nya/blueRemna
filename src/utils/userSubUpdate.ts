import { getPayment } from '../database/payment.js';
import { getPlanById, getPlanByTag } from '../database/sub_plans.js';
import { createUserSub, getUserSub } from '../database/user_sub.js';
import { remnawave } from '../services/remnawave/index.js';


export const userSubUpdate = async (userId: string | number, paymentId?: number, days: number = 3) => {
    try {
        let subPlanId;
        let internalSquads: Array<string> = [];

        if (paymentId) {
            const [payment] = await getPayment(paymentId);
            days = payment.months * 30;
            subPlanId = Number(payment.sub_plan_id);
        } else {
            subPlanId = (await getPlanByTag('bs'))[0].id;
        }

        // Добавляем пользователю внутренние сквады
        const [plan] = await getPlanById(subPlanId);
        internalSquads.push(plan.internal_squad);
        if (plan.tag !== 'default') {
            const [defaultSquad] = await getPlanByTag('default');
            internalSquads.push(defaultSquad.internal_squad);
        }

        const [userSub] = await getUserSub(userId);
        const squads = await remnawave.getSquadForVPN();

        const currentDate = new Date();

        const limitStrategy = internalSquads.length > 1 ? 'MONTH' : 'NO_RESET';
        const limitBytes = internalSquads.length > 1 ? 50 * 1073741824 : 0;

        if (!userSub) {
            const profileUsername = `id${String(userId).slice(0, 2)}${currentDate.getTime()}`; // Создаем уникальный username для профиля
            currentDate.setDate(currentDate.getDate() + Number(days));

            const user = await remnawave.createUser({
                username: profileUsername,
                status: 'ACTIVE',
                trafficLimitStrategy: limitStrategy,
                trafficLimitBytes: limitBytes,
                expireAt: currentDate.toISOString(),
                telegramId: Number(userId),
                hwidDeviceLimit: 5,
                activeInternalSquads: internalSquads,
                externalSquadUuid: squads!.external
            });

            await createUserSub(
                Number(userId),
                user!.response.id,
                profileUsername,
                String(subPlanId)
            );
            return;
        }

        const user = await remnawave.getUserByUserId(userSub.rw_user_id);

        const expireDate = new Date(user!.response.expireAt);
        const date = expireDate > currentDate ? expireDate : currentDate; // Выбираем источник: если подписка не истекла, добавляем к её дате, иначе к текущей
        date.setDate(date.getDate() + days);

        await remnawave.updateUser({
            id: userSub.rw_user_id,
            trafficLimitStrategy: limitStrategy,
            trafficLimitBytes: limitBytes,
            expireAt: date.toISOString()
        });
    } catch (error) {
        throw error;
    }
};