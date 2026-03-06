import { InlineKeyboard } from 'gramio';

export const adminMenuKeyboard = async () => {
    return new InlineKeyboard()
        .text('Изменить глобальную скидку', 'change_discount');
};

export const sceneCancelKeyboard = new InlineKeyboard()
    .text('Отмена', 'scene_cancel');