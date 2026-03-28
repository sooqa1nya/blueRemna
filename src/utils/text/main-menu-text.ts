import { IUser } from '../../types/database.js';

export const mainMenuText = async (user: IUser) => {
    const regDate = new Date(user.register);

    return `
👤 Профиль

<blockquote>ID: <code>${user.id}</code>
Регистрация: <code>${regDate.toLocaleDateString('ru-RU')}</code>
${user.sale > 0 ? `Скидка: <code>${user.sale}%</code>` : ''}</blockquote>
    `;
};