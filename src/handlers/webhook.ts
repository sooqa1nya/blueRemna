import { Composer } from 'gramio';
import { remnawave } from '../services/remnawave/index.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';
import { profileMainMenuKeyboard, refreshFreeTrialData } from '../keyboards/webhook.js';
import { getFreeTrial } from '../database/settings.js';
import { supportClients } from '../utils/get-support-clients.js';
import { getProfile } from '../database/user_profiles.js';

export const webhook = new Composer({ name: 'webhook' })
    .callbackQuery(refreshFreeTrialData, async context => {
        const days = await getFreeTrial();
        if (!days) {
            return console.error('webhook Composer', 'getFreeTrial не найден');
        }
        const date = new Date();


        const user = await remnawave.getUserByUUID(context.queryData.id);
        if (!user) {
            await context.answerCallbackQuery('❌ Ошибка #2 при продлении подписки. Обратитесь в поддержку.');
            console.error('Ошибка #2 при продлении подписки', user);
            return;
        }

        const expiteDate = new Date(user.response.expireAt);
        expiteDate < date ? date.setDate(date.getDate() + days) : date.setDate(expiteDate.getDate() + days);

        await remnawave.updateUser({
            uuid: context.queryData.id,
            expireAt: date.toISOString()
        });

        const text = `
✅ Подписка обновлена
        
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

        const [dbuser] = await getProfile(context.queryData.id);
        await context.editText(text, { reply_markup: profileMainMenuKeyboard(dbuser.id) });
    });