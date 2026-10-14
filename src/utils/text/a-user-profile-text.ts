import { getUserPaidPayments } from '../../database/payment.js';
import { getPlanById } from '../../database/sub_plans.js';
import { getUserSub } from '../../database/user_sub.js';
import { findPayloadCount, findUser } from '../../database/users.js';
import { remnawave } from '../../services/remnawave/index.js';

export const aUserProfileText = async (userId: string | number) => {
    const user = await findUser(userId);
    const regDate = new Date(user.register);
    const lastActivityDate = new Date(user.last_activity);

    let subInfoText: string = 'Статус: <code>Подписка не создана</code>';

    const [userSub] = await getUserSub(userId);

    if (userSub) {
        const [rwProfile, [plan]] = await Promise.all([
            remnawave.getUserByUserId(userSub.rw_user_id),
            getPlanById(Number(userSub.sub_plan_id))
        ]);

        subInfoText = `Тариф: <code>${plan.name}</code>\nСтатус: <code>${rwProfile?.response.status}</code>`;
    }

    const payments = await getUserPaidPayments(Number(userId));
    let paymentSum = 0;
    if (payments.length) {
        for (const payment of payments) {
            paymentSum += Number(payment.amount);
        }
    }

    const [referals] = await findPayloadCount(`id${userId}`);

    return `
<a href="tg://user?id=${userId}">Профиль пользователя</a>

${user.is_active ? '🟢' : '🔴'} <code>${userId}</code>
Username: ${user.username ? `@${user.username}` : '<code>N/A</code>'}
Имя: ${user.first_name ? `<code>${user.first_name}</code>` : '<code>N/A</code>'}

Админ: ${user.is_admin ? '✅' : '❌'}

Авторизирован: <code>${user.agreed_policy ? 'Да' : 'Нет'}</code>
Регистрация: <code>${regDate.toLocaleDateString('ru-RU')} ${regDate.toLocaleTimeString('ru-RU')}</code>
Последняя активность: <code>${lastActivityDate.toLocaleDateString('ru-RU')} ${lastActivityDate.toLocaleTimeString('ru-RU')}</code>

Пробный период: <code>${user.trial_key ? 'Использован' : 'Не использован'}</code>
${subInfoText}

Скидка: <code>${user.sale}%</code>
Транзакции: <code>${paymentSum}₽ (${payments.length})</code>

Рефералы: <code>${referals.count}</code>
Реф. баланс: <code>${user.ref_balance}₽</code>
Реф. процент: <code>${user.ref_proc}%</code>
${user.payload ? `\npayload: <code>${user.payload}</code>\n` : ''}`;
};
