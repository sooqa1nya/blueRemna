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
    backAUserProfileKeyboard,
    aUserProfilesKeyboard,
    adminUserProfilesData,
    aUserSubKeybard,
    switchDeviceLimitData,
    changeDescriptionData
} from '../../keyboards/admin.js';
import { getProfileByID, setLimitExtended } from '../../database/user_profiles.js';
import { remnawave } from '../../services/remnawave/index.js';
import { findUser } from '../../database/users.js';
import { changeDescriptionScene } from '../../scenes/admin/change-description.js';
import { aSubProfileText } from '../../utils/text/a-sub-profile-text.js';

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
    });