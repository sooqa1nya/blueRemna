import type { Bot, CallbackQueryShorthandContext } from 'gramio';
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
        console.error('[free-trial]: ❌ Ошибка при добавлении в сквад: ' + squads);
        return;
    }

    const days = await getFreeTrial();
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
        console.error('[free-trial]: ❌ Ошибка при создании пользователя: ' + user);
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
        console.error('[free-trial]: ❌ Ошибка при добавлении профиля в БД. UUID: ' + error);
        return;
    }

    try {
        await context.send(`🆓 Пробный период\n\n- Пользователь: <code>${context.from.id}</code>`, {
            chat_id: process.env.LOG_CHAT_ID!,
            parse_mode: 'HTML'
        });
    } catch { }

    const text = `
✅ Ваша пробная подписка активирована

⏳ Дата окончания: <code>${date.toLocaleDateString('ru-RU')}</code>

ℹ️ Инструкция по использованию:
1. Нажмите кнопку "Скопировать" что бы скопировать ссылку на подписку
2. Установите любое поддерживаемое приложение для работы с подписками <i>(доступные приложения можно найти в меню "Помощь")</i>
3. Вставьте скопированную ссылку в приложение и наслаждайтесь использованием blueVPN 💙
    `;

    await context.editText(text, { parse_mode: 'HTML', reply_markup: copyAndMenuKeyboard(user.response.subscriptionUrl) });
};