import type { Bot, CallbackData, CallbackQueryShorthandContext } from 'gramio';
import { getProfileByID, getProfiles } from '../database/user_profiles.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';
import { userKeyKeyboard, userKeysKeyboard } from '../keyboards/active-keys.js';
import { remnawave } from '../services/remnawave/index.js';


export const handleActiveKeys = async (context: CallbackQueryShorthandContext<Bot, 'active_keys'>) => {
    const profiles = await getProfiles(context.from.id);
    if (!profiles.length) {
        return await context.editText('❗️ У вас нет активной подписки.\n\n✅ Чтобы приобрести подписку, вернитесь в главное меню и выберите пункт "Купить или продлить".', { reply_markup: backToMainMenuKeyboard });
    }

    await context.editText('🔑 Доступные подписки:', { reply_markup: await userKeysKeyboard(context.from.id) });
};

export const handleActiveKey = async (context: CallbackQueryShorthandContext<Bot, CallbackData<{ k: number; }>>) => {
    const [dbprofile] = (await getProfileByID(context.queryData.k));

    const user = await remnawave.getUserByUUID(dbprofile!.uuid);
    const expire = new Date(user.response.expireAt);
    const daysRemaining = Math.ceil((expire.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    await context.editText(`
🔑 <code>${dbprofile?.username}</code>

📆 Дата истечения: <code>${expire.toLocaleDateString('ru-RU')} (${daysRemaining}д)</code>
${user.response.hwidDeviceLimit ? `📱 Лимит устройств: <code>${user.response.hwidDeviceLimit}</code>\n` : ''}
<code>${user.response.subscriptionUrl}</code>

ℹ️ Примечание:
<i> - Что бы активировать подписку необходимо добавить ссылку в приложение.
 - Список доступных приложений вы можете найти в разделе "Помощь" главного меню.
 - Что бы скопировать ссылку нажмите на зеленую кнопку.</i>
    `, {
        reply_markup: await userKeyKeyboard(context.queryData.k, user.response.subscriptionUrl),
        parse_mode: 'HTML'
    });
};