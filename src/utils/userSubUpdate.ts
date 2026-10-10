import { getPayment } from '../database/payment.js';
import { getPlanById, getPlanByTag } from '../database/sub_plans.js';
import { createUserSub, getUserSub } from '../database/user_sub.js';
import { remnawave } from '../services/remnawave/index.js';


export const userSubUpdate = async (userId: string | number, paymentId: number) => {
    try {
        const [userSub] = await getUserSub(userId);
        const [payment] = await getPayment(paymentId);

        // Добавляем пользователю внутренние сквады
        let internalSquads: Array<string> = [];
        const [plan] = await getPlanById(Number(payment.sub_plan_id));
        internalSquads.push(plan.internalSquad);
        if (plan.tag !== 'default') {
            const [defaultSquad] = await getPlanByTag('default');
            internalSquads.push(defaultSquad.internalSquad);
        }

        const squads = await remnawave.getSquadForVPN();

        const currentDate = new Date();
        const days = payment.months * 30;

        if (!userSub) {
            const profileUsername = `id${String(userId).slice(0, 2)}${currentDate.getTime()}`; // Создаем уникальный username для профиля
            currentDate.setDate(currentDate.getDate() + Number(days));

            const user = await remnawave.createUser({
                username: profileUsername,
                status: 'ACTIVE',
                trafficLimitStrategy: 'NO_RESET',
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
                payment.sub_plan_id
            );
            return;
        }

        const user = await remnawave.getUserByUserId(userSub.rw_user_id);

        const expireDate = new Date(user!.response.expireAt);
        const date = expireDate > currentDate ? expireDate : currentDate; // Выбираем источник: если подписка не истекла, добавляем к её дате, иначе к текущей
        date.setDate(date.getDate() + days);

        await remnawave.updateUser({
            id: userSub.rw_user_id,
            trafficLimitStrategy: 'NO_RESET',
            expireAt: date.toISOString()
        });
    } catch (error) {
        throw error;
    }
};