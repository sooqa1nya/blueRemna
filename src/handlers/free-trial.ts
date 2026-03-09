import { Composer } from 'gramio';
import { remnawave } from '../services/remnawave/index.js';
import { getFreeTrial } from '../database/settings.js';
import { useFreeTrial } from '../database/users.js';
import { addProfile } from '../database/user_profiles.js';
import { copyWebappMenuKeyboard } from '../keyboards/other.js';
import { freeTrialInfoKeyboard } from '../keyboards/free-trial.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';
import { supportClients } from '../utils/get-support-clients.js';


export const freeTrial = new Composer({ name: 'freeTrial' })
    .callbackQuery('free_trial_info', async context => {
        if (context.dbuser?.trial_key) {
            return await context.editText('🚫 Вы уже активировали пробную подписку', {
                reply_markup: backToMainMenuKeyboard
            });
        }

        const text = `
🎁 Пробная подписка

⏳ Длительность (дни): \`${await getFreeTrial()}\`

❗️ *Инструкция по подключению*
 - Для начала вам необходимо скачать любое приложение из списка ниже.
 - После установки нажмите кнопку активации подписки. 
 - После активации вам будет выдана ссылка для подключения, получить её можно нажав кнопку "Скопировать".
 - После копирования ссылку нужно вставить в скачанное приложение, после чего вы сможете подключиться к blueVPN.

ℹ️ При возникновении проблем вы всегда можете обратиться в поддержку

💮 Поддерживаемые приложения (текст кликабельный)
 - iOS: ${supportClients.ios}
 - Android: ${supportClients.android}
 - Windows: ${supportClients.windows}
 - macOS: ${supportClients.macos}
 - Linux: ${supportClients.linux}
        `;

        await context.editText(text, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true },
            reply_markup: freeTrialInfoKeyboard
        });
    })

    .callbackQuery('free_trial', async context => {
        if (context.dbuser?.trial_key) {
            return await context.editText('🚫 Вы уже активировали пробную подписку', {
                reply_markup: backToMainMenuKeyboard
            });
        }

        await useFreeTrial(context.from.id);

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

❗️ *Инструкция по подключению*
 - Для начала вам необходимо скачать любое приложение из списка ниже.
 - После установки нажмите кнопку активации подписки. 
 - После активации вам будет выдана ссылка для подключения, получить её можно нажав кнопку "Скопировать".
 - После копирования ссылку нужно вставить в скачанное приложение, после чего вы сможете подключиться к blueVPN.

💮 Поддерживаемые приложения (текст кликабельный)
 - iOS: ${supportClients.ios}
 - Android: ${supportClients.android}
 - Windows: ${supportClients.windows}
 - macOS: ${supportClients.macos}
 - Linux: ${supportClients.linux}
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