import type { Bot, CallbackQueryShorthandContext, SuccessfulPaymentContext } from 'gramio';
import { remnawave } from '../services/remnawave/index.js';
import { copyWebappMenuKeyboard } from '../keyboards/other.js';
import { addProfile } from '../database/user_profiles.js';
import { scheduler } from 'node:timers/promises';

export const newProfile = async (context: CallbackQueryShorthandContext<Bot, any>, months: number) => {
    const days = months * 30;
    const date = new Date();

    const profile = `id${String(context.from.id).slice(0, 2)}${date.getTime()}`; // Создаем уникальный ID для профиля
    const squads = await remnawave.getSquadForVPN();

    if (!squads) {
        await context.answerCallbackQuery('❌ Ошибка при добавлении в сквад. Обратитесь в поддержку.');
        console.error('Ошибка при получении сквада для VPN', squads);
        return;
    }

    date.setDate(date.getDate() + Number(days));
    const user = await remnawave.createUser({
        username: profile,
        status: 'ACTIVE',
        trafficLimitStrategy: 'NO_RESET',
        expireAt: date.toISOString(),
        telegramId: context.from.id,
        hwidDeviceLimit: 5,
        activeInternalSquads: [squads.internal],
        externalSquadUuid: squads.external
    });

    if (!user) {
        await context.answerCallbackQuery('❌ Ошибка при создании пользователя. Обратитесь в поддержку.');
        console.error('Ошибка при создании пользователя', user);
        return;
    }

    try {
        await addProfile(
            context.from.id,
            user.response.id,
            profile
        );
    } catch (error) {
        await context.answerCallbackQuery('❌ Ошибка при добавлении профиля в БД. Обратитесь в поддержку.');
        console.error('Ошибка при добавлении профиля в БД', error);
        await remnawave.deleteUser(user.response.id);
        return;
    }

    const text = `
✅ Подписка активирована

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


export const newProfileStars = async (context: SuccessfulPaymentContext<Bot>) => {
    if (!context.hasFrom() || !context.successfulPayment) {
        return;
    }

    const payload: { k: number; m: number; } = JSON.parse(context.successfulPayment.invoicePayload);

    const days = payload.m * 30;
    const date = new Date();

    const profile = `id${String(context.from.id).slice(0, 2)}${date.getTime()}`; // Создаем уникальный ID для профиля
    const squads = await remnawave.getSquadForVPN();

    if (!squads) {
        const message = await context.send('❌ Ошибка при добавлении в сквад. Обратитесь в поддержку.');
        await scheduler.wait(10000);
        await message.delete();

        console.error('Ошибка при получении сквада для VPN', squads);
        return;
    }

    date.setDate(date.getDate() + Number(days));
    const user = await remnawave.createUser({
        username: profile,
        status: 'ACTIVE',
        trafficLimitStrategy: 'NO_RESET',
        expireAt: date.toISOString(),
        telegramId: context.from.id,
        hwidDeviceLimit: 5,
        activeInternalSquads: [squads.internal],
        externalSquadUuid: squads.external
    });

    if (!user) {
        const message = await context.send('❌ Ошибка при создании пользователя. Обратитесь в поддержку.');
        await scheduler.wait(10000);
        await message.delete();

        console.error('Ошибка при создании пользователя', user);
        return;
    }

    try {
        await addProfile(
            context.from.id,
            user.response.id,
            profile
        );
    } catch (error) {
        const message = await context.send('❌ Ошибка при добавлении профиля в БД. Обратитесь в поддержку.');
        await scheduler.wait(10000);
        await message.delete();

        console.error('Ошибка при добавлении профиля в БД', error);
        await remnawave.deleteUser(user.response.id);
        return;
    }

    const text = `
✅ Подписка активирована

⏳ Дата окончания: <code>${date.toLocaleDateString('ru-RU')}</code>

ℹ️ Подключение
 <i>- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную</i>

<b>❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку</b>
`;

    await context.send(text, {
        parse_mode: 'HTML',
        reply_markup: copyWebappMenuKeyboard('👤 Профиль', user.response.subscriptionUrl)
    });
};

