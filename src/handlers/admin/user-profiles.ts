import { Composer } from 'gramio';
import { sceneInit } from '../../plugins/scenes.js';
import { aFindUserProfileScene } from '../../scenes/admin/find-user-profile.js';
import { changeSaleScene } from '../../scenes/admin/change-sale.js';
import { changeRefBalanceScene } from '../../scenes/admin/change-ref-balance.js';
import { changeRefProcentScene } from '../../scenes/admin/change-ref-procent.js';
import { aUserProfileText } from '../../utils/text/a-user-profile-text.js';
import {
    backAUserProfileData,
    aChangeUserSaleData,
    aChangeUserRefBalanceData,
    aChangeUserRefProcData,
    aUserSubData,
    aUserProfileKeyboard,
    aUserProfilesKeyboard,
    adminUserProfilesData,
    aUserSubKeybard,
    switchDeviceLimitData,
    changeDescriptionData,
    changeDeviceLimitData,
    aChangeDaysData,
    changeSubDurationData,
    aChangeDaysKeyboard
} from '../../keyboards/admin.js';
import { getProfileByID, setLimitExtended } from '../../database/user_profiles.js';
import { remnawave } from '../../services/remnawave/index.js';
import { changeDescriptionScene } from '../../scenes/admin/change-description.js';
import { aSubProfileText } from '../../utils/text/a-sub-profile-text.js';
import { changeDeviceLimitScene } from '../../scenes/admin/change-device-limit.js';

export const userProfilesAdmin = new Composer({ name: 'admin-user-profiles' })
    .extend(sceneInit)
    .callbackQuery('admin_user_profile', async context => {
        await context.scene.enter(aFindUserProfileScene);
    })

    .callbackQuery(backAUserProfileData, async context => {
        await context.editText(await aUserProfileText(context.queryData.i), {
            parse_mode: 'HTML',
            reply_markup: aUserProfileKeyboard(context.queryData.i)
        });
    })

    .callbackQuery(aChangeUserSaleData, async context => {
        await context.scene.enter(changeSaleScene, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aChangeUserRefBalanceData, async context => {
        await context.scene.enter(changeRefBalanceScene, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aChangeUserRefProcData, async context => {
        await context.scene.enter(changeRefProcentScene, {
            userId: context.queryData.i
        });
    })

    .callbackQuery(aUserSubData, async context => {
        await context.editText('🔑 Подписки пользователя', {
            reply_markup: await aUserProfilesKeyboard(context.queryData.i)
        });
    })

    .callbackQuery(adminUserProfilesData, async context => {
        const [userProfile] = await getProfileByID(context.queryData.k);
        const rw = await remnawave.getUserByUUID(userProfile.uuid);
        if (!rw) {
            return await context.answerCallbackQuery('❌ Ошибка получения информации о подписке');
        }
        const sub = rw.response;

        await context.editText(aSubProfileText(rw), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: aUserSubKeybard(context.queryData.u, context.queryData.k, userProfile.is_limit_extended, sub.subscriptionUrl)
        });
    })

    .callbackQuery(switchDeviceLimitData, async context => {
        await setLimitExtended(Number(context.queryData.k), !context.queryData.l);
        const [userProfile] = await getProfileByID(context.queryData.k);
        const rw = await remnawave.getUserByUUID(userProfile.uuid);
        if (!rw) {
            return await context.answerCallbackQuery('❌ Ошибка получения информации о подписке');
        }
        const sub = rw.response;
        await context.editReplyMarkup(aUserSubKeybard(userProfile.user_id, context.queryData.k, userProfile.is_limit_extended, sub.subscriptionUrl));
        await context.answerCallbackQuery('✅ Успешно');
    })

    .callbackQuery(changeDescriptionData, async context => {
        await context.answerCallbackQuery();
        await context.scene.enter(changeDescriptionScene, {
            profileId: context.queryData.k
        });
    })

    .callbackQuery(changeDeviceLimitData, async context => {
        await context.answerCallbackQuery();
        await context.scene.enter(changeDeviceLimitScene, {
            profileId: context.queryData.k
        });
    })

    .callbackQuery(changeSubDurationData, async context => {
        const [userProfile] = await getProfileByID(context.queryData.k);
        if (!userProfile) {
            return await context.answerCallbackQuery('❌ Не найден userProfile');
        }

        await context.editText('↘️ Выберите действие (в днях)', {
            reply_markup: aChangeDaysKeyboard(String(userProfile.user_id), context.queryData.k)
        });
    })

    .callbackQuery(aChangeDaysData, async context => {
        const [userProfile] = await getProfileByID(context.queryData.k);
        const rw = await remnawave.getUserByUUID(userProfile.uuid);
        if (!rw) {
            return await context.answerCallbackQuery('❌ Ошибка получения информации о подписке');
        }
        const sub = rw.response;

        const currentDate = new Date();
        const expireDate = new Date(sub.expireAt);

        // Выбираем источник: если подписка не истекла, добавляем к её дате, иначе к текущей
        let date = expireDate >= currentDate ? expireDate : currentDate;
        date.setDate(date.getDate() + context.queryData.d);

        if (date <= currentDate) {
            date = new Date(currentDate);
            date.setMinutes(date.getMinutes() + 1);
        }

        const updateUser = await remnawave.updateUser({
            uuid: userProfile.uuid,
            trafficLimitStrategy: sub.trafficLimitStrategy,
            expireAt: date.toISOString()
        });
        if (!updateUser) {
            return await context.answerCallbackQuery('❌ Ошибка обновления пользователя');
        }

        await context.editText(`↘️ Выберите действие (в днях)\n\n📆 Дата истечения: ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`, {
            reply_markup: aChangeDaysKeyboard(String(userProfile.user_id), context.queryData.k)
        });
        await context.answerCallbackQuery('✅ Успешно');
    });
