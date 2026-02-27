import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { backToMainMenuKeyboard } from '../keyboards/main.js';
import { addProfile } from '../database/user_profiles.js';
import { useFreeTrial } from '../database/users.js';
import { remnawave } from '../services/remnawave/index.js';
import { getFreeTrial } from '../database/settings.js';
import { copyAndMenuKeyboard } from '../keyboards/other.js';

export const handleFreeTrial = async (context: CallbackQueryShorthandContext<Bot, 'free_trial'>) => {
    const date = new Date();
    const profile = `id${String(context.from.id).slice(0, 2)}${date.getTime()}`; // Создаем уникальный ID для профиля
    const squads = await remnawave.getSquadForVPN();

    if (!squads) {
        await context.answerCallbackQuery('❌ Ошибка при добавлении в сквад. Обратитесь в поддержку.');
        return;
    }

    const days = await getFreeTrial();
    date.setDate(date.getDate() + days);
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
        await useFreeTrial(context.from.id);
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

    try {
        await context.send(`🆓 Пробный период\n\n- Пользователь: <code>${context.from.id}</code>`, {
            chat_id: process.env.LOG_CHAT_ID!,
            parse_mode: 'HTML'
        });
    } catch { }

    await context.editText(`✅ Ваша пробная подписка.\n⏳ Длительность: <code>${process.env.FREE_TRIAL_DAYS}д</code>\n<code>${user.response.subscriptionUrl}</code>`, { parse_mode: 'HTML', reply_markup: copyAndMenuKeyboard(user.response.subscriptionUrl) });
};