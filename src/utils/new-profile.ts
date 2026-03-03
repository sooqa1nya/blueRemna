import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { remnawave } from '../services/remnawave/index.js';
import { copyWebappMenuKeyboard } from '../keyboards/other.js';
import { addProfile } from '../database/user_profiles.js';

export const newProfile = async (context: CallbackQueryShorthandContext<Bot, any>) => {
    const days = context.queryData.m * 30;
    const date = new Date();

    const profile = `id${String(context.from.id).slice(0, 2)}${date.getTime()}`; // Создаем уникальный ID для профиля
    const squads = await remnawave.getSquadForVPN();

    if (!squads) {
        await context.answerCallbackQuery('❌ Ошибка при добавлении в сквад. Обратитесь в поддержку.');
        return;
    }

    date.setDate(date.getDate() + Number(days));
    const user = await remnawave.createUser({
        username: profile,
        expireAt: date.toISOString(),
        telegramId: context.from.id,
        hwidDeviceLimit: 5,
        activeInternalSquads: [squads.internal],
        externalSquadUuid: squads.external
    });

    if (!user) {
        await context.answerCallbackQuery('❌ Ошибка при создании пользователя. Обратитесь в поддержку.');
        return;
    }

    try {
        await addProfile(
            context.from.id,
            user.response.uuid,
            profile
        );
    } catch (error) {
        await context.answerCallbackQuery('❌ Ошибка при добавлении профиля в БД. Обратитесь в поддержку.');
        await remnawave.deleteUser(user.response.uuid);
        return;
    }

    const text = `
✅ Подписка активирована

⏳ Дата окончания: <code>${date.toLocaleDateString('ru-RU')}</code>

ℹ️ Инструкция по использованию:
1. Нажмите кнопку "Скопировать" что бы скопировать ссылку на подписку
2. Установите любое поддерживаемое приложение для работы с подписками <i>(доступные приложения можно найти в меню "Помощь")</i>
3. Вставьте скопированную ссылку в приложение и наслаждайтесь использованием blueVPN 💙`;

    await context.editText(text, { parse_mode: 'HTML', reply_markup: copyWebappMenuKeyboard('👤 Профиль', user.response.subscriptionUrl) });
};


