import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { aUserSubKeybard } from '../../keyboards/admin.js';
import { getProfileByID } from '../../database/user_profiles.js';
import { remnawave } from '../../services/remnawave/index.js';
import { aSubProfileText } from '../../utils/text/a-sub-profile-text.js';


export const changeDeviceLimitScene = new Scene('device_limit')
    .params<{ profileId: number; }>()
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Отправьте устройства которые будет добавлены/вычтены из лимита (5, -5..)', { reply_markup: sceneCancelKeyboard });
        }

        const [userProfile] = await getProfileByID(context.scene.params.profileId);
        let rwProfile = await remnawave.getUserByUserId(userProfile.rw_user_id);

        if (context.is("callback_query")) {
            await context.send(aSubProfileText(rwProfile!), {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
                reply_markup: aUserSubKeybard(userProfile.user_id, context.scene.params.profileId, userProfile.is_limit_extended, rwProfile!.response.subscriptionUrl)
            });
            await context.answerCallbackQuery();
            return await context.scene.exit();
        }

        const text = Number(context.text);

        if (!Number.isInteger(text) || !rwProfile) {
            return await context.delete();
        }

        const limit = (rwProfile.response.hwidDeviceLimit || 0) + text;

        await remnawave.updateUser({
            id: userProfile.rw_user_id,
            trafficLimitStrategy: rwProfile.response.trafficLimitStrategy,
            hwidDeviceLimit: limit > 0 ? limit : 0
        });

        rwProfile = await remnawave.getUserByUserId(userProfile.rw_user_id);

        await context.send(aSubProfileText(rwProfile!), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: aUserSubKeybard(userProfile.user_id, context.scene.params.profileId, userProfile.is_limit_extended, rwProfile!.response.subscriptionUrl)
        });

        return await context.scene.exit();
    });