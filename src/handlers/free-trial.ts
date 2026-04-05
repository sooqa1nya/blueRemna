import { Composer } from 'gramio';
import { remnawave } from '../services/remnawave/index.js';
import { getFreeTrial } from '../database/settings.js';
import { useFreeTrial } from '../database/users.js';
import { addProfile } from '../database/user_profiles.js';
import { copyWebappMenuKeyboard } from '../keyboards/other.js';
import { freeTrialInfoKeyboard } from '../keyboards/free-trial.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';


export const freeTrial = new Composer({ name: 'freeTrial' })
    .callbackQuery('free_trial_info', async context => {
        if (context.dbuser?.trial_key) {
            return await context.editText('🚫 Вы уже активировали пробную подписку', {
                reply_markup: backToMainMenuKeyboard
            });
        }

        const text = `
🎁 *Пробная подписка*

⏳ Длительность (дни): \`${await getFreeTrial()}\`

❗️ Что бы получить инструкцию по подключению нажмите кнопку *"Помощь с подключением"*

ℹ️ Если у вас не получилось подключиться - обратитесь в поддержку *(кнопка "Поддержка")*, поможем с настройкой и подключением
        `;

        await context.editText(text, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true },
            reply_markup: freeTrialInfoKeyboard
        });
    })

    .callbackQuery('free_trial', async context => {
        const trialActivated = await useFreeTrial(context.from.id);
        if (!trialActivated) {
            return await context.editText('🚫 Вы уже активировали пробную подписку', {
                reply_markup: backToMainMenuKeyboard
            });
        }

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

        const text = `
✅ Ваша пробная подписка активирована

⏳ Дата окончания: \`${date.toLocaleDateString('ru-RU')}\`

ℹ️ Подключение
 _- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную_

*❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку*
            `;

        await context.editText(text, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true },
            reply_markup: copyWebappMenuKeyboard('👤 Профиль', user.response.subscriptionUrl)
        });

        try {
            await context.send(`🆓 Пробный период\n\n- Пользователь: <code>${context.from.id}</code>`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }
    });