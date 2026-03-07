import { CallbackData, InlineKeyboard } from 'gramio';

export const adminMenuKeyboard = async () => {
    return new InlineKeyboard()
        .columns(1)
        .text('Рассылка', 'broadcast_settings')
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