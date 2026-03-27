import { CallbackData, InlineKeyboard } from 'gramio';


export const adminMenuKeyboard = async () => {
    return new InlineKeyboard()
        .columns(1)
        .text('Рассылка', 'broadcast_settings')
        .text('Статистика', 'admin_stats')
        .text('Профиль пользователя', 'admin_user_profile')
        .text('Создать рефку', 'ref_generate')
        .text('Изменить глобальную скидку', 'change_discount');
};

export const backAdminMenuKeyboard = new InlineKeyboard()
    .text('◀️ Админ меню', 'a');

export const checkMailingData = new CallbackData('check_mailing_data')
    .number('id');
export const startMailingData = new CallbackData('start_mailing_data')
    .number('id');
export const broadcastMenuKeyboard = (copyMessageId: number = 0) => {
    return new InlineKeyboard()
        .columns(1)
        .text('🔄 Изменить пост', 'change_post')
        .addIf(!!copyMessageId, InlineKeyboard.text('👀 Посмотреть пост', checkMailingData.pack({ id: copyMessageId })))
        .addIf(!!copyMessageId, InlineKeyboard.text('🟢 Начать рассылку', startMailingData.pack({ id: copyMessageId })))
        .combine(backAdminMenuKeyboard);
};

export const statsKeyboard = new InlineKeyboard()
    .columns(1)
    .text('Общая', 'general_stats')
    .text('По рефке', 'ref_stats')
    .combine(backAdminMenuKeyboard);

export const retryRefStatsKeyboard = new InlineKeyboard()
    .columns(1)
    .text('🔄 Ввести реф. ссылку', 'ref_stats')
    .combine(backAdminMenuKeyboard);

export const backRefKeyboard = new InlineKeyboard()
    .columns(1)
    .text('Статистика', 'admin_stats')
    .combine(backAdminMenuKeyboard);


export const backAUserProfileData = new CallbackData('back_a_u_profile')
    .string('i'); // user id
export const backAUserProfileKeyboard = (userId: string) => {
    return new InlineKeyboard()
        .text('◀️ Пользователь', backAUserProfileData.pack({ i: userId }));
};

export const aChangeUserSaleData = new CallbackData('a_change_user_sale')
    .string('i'); // user id
export const aChangeUserRefBalanceData = new CallbackData('a_change_user_ref_b')
    .string('i'); // user id
export const aChangeUserRefProcData = new CallbackData('a_change_user_ref_p')
    .string('i'); // user id
export const aUserSubData = new CallbackData('a_user_sub')
    .string('i'); // user id
export const aUserProfileKeyboard = (userId: string | number) => {
    return new InlineKeyboard()
        .text('Реф. баланс', aChangeUserRefBalanceData.pack({ i: String(userId) }))
        .text('Реф. процент', aChangeUserRefProcData.pack({ i: String(userId) }))
        .row()
        .text('Скидка', aChangeUserSaleData.pack({ i: String(userId) }))
        .text('Подписки', aUserSubData.pack({ i: String(userId) }))
        .row()
        .combine(backAdminMenuKeyboard);
};