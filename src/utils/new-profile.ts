import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { remnawave } from '../services/remnawave/index.js';
import { copyAndMenuKeyboard } from '../keyboards/other.js';
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

    await context.editText(`✅ Ваша подписка:\n<code>${user.response.subscriptionUrl}</code>`, { parse_mode: 'HTML', reply_markup: copyAndMenuKeyboard(user.response.subscriptionUrl) });
};


