import { getUserPaidPayments } from '../database/payment.js';
import { findPayloadCount, findUser } from '../database/users.js';
import { remnawave } from '../services/remnawave/index.js';

export const aUserProfileText = async (userId: string | number) => {
    const user = await findUser(userId);

    const regDate = new Date(user.register);
    const lastActivityDate = new Date(user.last_activity);

    const userProfiles = (await remnawave.getUserByTelegramId(String(userId))).response;
    let activeSub = 0;
    for (const sub of userProfiles) {
        if (sub.status == 'ACTIVE') {
            activeSub++;
        }
    }

    const payments = await getUserPaidPayments(Number(userId));
    let paymentSum = 0;
    for (const payment of payments) {
        paymentSum += payment.amount;
    }

    const refCount = (await findPayloadCount(`id${userId}`)).count;

    return `
Профиль пользователя: ${user.is_active ? '🟢' : '🔴'} <code>${userId}</code>

Регистрация: <code>${regDate.toLocaleDateString('ru-RU')} ${regDate.toLocaleTimeString('ru-RU')}</code>
Последняя активность: <code>${lastActivityDate.toLocaleDateString('ru-RU')} ${lastActivityDate.toLocaleTimeString('ru-RU')}</code>

Админ: ${user.is_admin ? '✅' : '❌'}

Пробный период: <code>${user.trial_key ? 'Использован' : 'Не использован'}</code>
Подписок: <code>${userProfiles.length}</code>
Активных: <code>${activeSub}</code>

Скидка: <code>${user.sale}%</code>
Транзакции: <code>${paymentSum}₽ (${payments.length})</code>

Рефералы: <code>${refCount}</code>
Реф. баланс: <code>${user.ref_balance}</code>
Реф. процент: <code>${user.ref_proc}%</code>

${user.payload ? `payload: <code>${user.payload}</code>` : ''}
    `;
};
