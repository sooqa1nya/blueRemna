import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { getProfileByID } from '../database/user_profiles.js';
import { remnawave } from '../services/remnawave/index.js';
import { backToMainMenuKeyboard } from '../keyboards/main.js';

export const updateProfile = async (context: CallbackQueryShorthandContext<Bot, any>) => {
    const days = context.queryData.m * 30;
    const date = new Date();

    const [profile] = await getProfileByID(context.queryData.k);
    if (!profile) {
        await context.answerCallbackQuery('❌ Ошибка #1 при продлении подписки. Обратитесь в поддержку.');
        return;
    }

    const sub = await remnawave.getUserByUUID(profile.uuid);
    if (!sub) {
        await context.answerCallbackQuery('❌ Ошибка #2 при продлении подписки. Обратитесь в поддержку.');
        return;
    }

    const user = await remnawave.getUserByUUID(profile.uuid);
    if (!user) {
        await context.answerCallbackQuery('❌ Ошибка #3 при продлении подписки. Обратитесь в поддержку.');
        return;
    }
    const expiteDate = new Date(user.response.expireAt);

    expiteDate < date ? date.setDate(date.getDate() + days) : date.setDate(expiteDate.getDate() + days);

    await remnawave.updateUser({
        uuid: profile.uuid,
        expireAt: date.toISOString()
    });

    await context.editText('✅ Подписка продлена!', { reply_markup: backToMainMenuKeyboard });
};