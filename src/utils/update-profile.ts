import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { getProfileByID } from '../database/user_profiles.js';
import { remnawave } from '../services/remnawave/index.js';
import { copyWebappMenuKeyboard } from '../keyboards/other.js';

export const updateProfile = async (context: CallbackQueryShorthandContext<Bot, any>) => {
    const days = context.queryData.m * 30;
    const currentDate = new Date();

    const [profile] = await getProfileByID(context.queryData.k);
    if (!profile) {
        await context.answerCallbackQuery('❌ Ошибка #1 при продлении подписки. Обратитесь в поддержку.');
        console.error('Ошибка #1 при продлении подписки', profile);
        return;
    }

    const user = await remnawave.getUserByUUID(profile.uuid);
    if (!user) {
        await context.answerCallbackQuery('❌ Ошибка #2 при продлении подписки. Обратитесь в поддержку.');
        console.error('Ошибка #2 при продлении подписки', user);
        return;
    }

    const expireDate = new Date(user.response.expireAt);

    // Выбираем источник: если подписка не истекла, добавляем к её дате, иначе к текущей
    const date = expireDate >= currentDate ? expireDate : currentDate;
    date.setDate(date.getDate() + days);

    await remnawave.updateUser({
        uuid: profile.uuid,
        expireAt: date.toISOString()
    });

    const text = `
✅ Подписка продлена

⏳ Дата окончания: <code>${date.toLocaleDateString('ru-RU')}</code>

ℹ️ Подключение
 <i>- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную</i>

<b>❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку</b>
    `;

    await context.editText(text, {
        parse_mode: 'HTML',
        reply_markup: copyWebappMenuKeyboard('👤 Профиль', user.response.subscriptionUrl)
    });
};