import { Composer } from 'gramio';
import { getFreeTrial } from '../database/settings.js';
import { useFreeTrial } from '../database/users.js';
import { copyWebappMenuKeyboard } from '../keyboards/other.js';
import { freeTrialInfoKeyboard } from '../keyboards/free-trial.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';
import { userSubUpdate } from '../utils/userSubUpdate.js';


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

        // Выдача сабки
        try {
            await userSubUpdate(context.from.id);
        } catch (e) {
            console.error('Ошибка sub-payment => userSubUpdate', e);
            await context.answerCallbackQuery('❌ Ошибка выдачи подписки');
        }

        await useFreeTrial(context.from.id, false);
        const text = `
✅ Ваша пробная подписка активирована

ℹ️ Подключение
 _- Если у вас установлен Happ, нажмите кнопку "Подключить в Happ"
 - У вас другой клиент? Нажмите кнопку "Скопировать" и добавьте ключ вручную_

*❗️ Если вы не разобрались как подключиться к VPN нажмите кнопку "Помощь с подключением" или обратитесь в поддержку*
            `;

        await context.editText(text, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true },
            reply_markup: await copyWebappMenuKeyboard('👤 Профиль', context.from.id)
        });

        try {
            await context.send(`🆓 Пробный период\n\n- Пользователь: <code>${context.from.id}</code>`, {
                chat_id: process.env.LOG_CHAT_ID!,
                parse_mode: 'HTML'
            });
        } catch { }
    });