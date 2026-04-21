import { Scene } from '@gramio/scenes';
import { sceneCancelKeyboard } from '../../keyboards/scene-cancel.js';
import { aUserSubKeybard } from '../../keyboards/admin.js';
import { getProfileByID } from '../../database/user_profiles.js';
import { remnawave } from '../../services/remnawave/index.js';
import { aSubProfileText } from '../../utils/text/a-sub-profile-text.js';


export const changeDescriptionScene = new Scene('change_description')
    .params<{ profileId: number; }>()
    .step(['message', 'callback_query'], async (context) => {
        if (context.scene.step.firstTime) {
            return await context.editText('Отправьте новое описание для подписки', { reply_markup: sceneCancelKeyboard });
        }

        const [userProfile] = await getProfileByID(context.scene.params.profileId);
        let rwProfile = await remnawave.getUserByUUID(userProfile.uuid);

        if (context.is("callback_query")) {
            await context.send(aSubProfileText(rwProfile!), {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
                reply_markup: aUserSubKeybard(userProfile.user_id, context.scene.params.profileId, userProfile.is_limit_extended, rwProfile!.response.subscriptionUrl)
            });
            await context.answerCallbackQuery();
            return context.scene.exit();
        }

        const text = context.text;

        if (!text || !rwProfile) {
            await context.delete();
            return;
        }

        await remnawave.updateUser({
            uuid: userProfile.uuid,
            trafficLimitStrategy: rwProfile.response.trafficLimitStrategy,
            description: text
        });

        rwProfile = await remnawave.getUserByUUID(userProfile.uuid);

        await context.send(aSubProfileText(rwProfile!), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: aUserSubKeybard(userProfile.user_id, context.scene.params.profileId, userProfile.is_limit_extended, rwProfile!.response.subscriptionUrl)
        });

        return await context.scene.exit();
    });