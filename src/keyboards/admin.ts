import { CallbackData, InlineKeyboard } from 'gramio';
import { emptyButtonKeyboard } from './other.js';
import { getAllOs } from '../database/operating_systems.js';
import { getVpnClientsByOs } from '../database/vpn_clients.js';


export const adminMenuKeyboard = async () => {
    return new InlineKeyboard()
        .columns(1)
        .text('Рассылка', 'broadcast_settings')
        .text('Статистика', 'admin_stats')
        .text('Профиль пользователя', 'admin_user_profile')
        .text('Создать рефку', 'ref_generate')
        .text('Изменить глобальную скидку', 'change_discount')
        .text('Клиенты', 'admin_clients');
};

export const backAdminMenuKeyboard = new InlineKeyboard()
    .text('◀️ Админ меню', 'a');

export const checkMailingData = new CallbackData('check_mailing_data')
    .number('id');
export const startMailingData = new CallbackData('start_mailing_data')
    .number('id');
export const startActiveSubMailingData = new CallbackData('start_active_mailing')
    .number('id');
export const broadcastMenuKeyboard = (copyMessageId: number = 0) => {
    return new InlineKeyboard()
        .columns(1)
        .text('🔄 Изменить пост', 'change_post')
        .addIf(!!copyMessageId, InlineKeyboard.text('👀 Посмотреть пост', checkMailingData.pack({ id: copyMessageId })))
        .addIf(!!copyMessageId, InlineKeyboard.text('🟢 Рассылка по всем', startMailingData.pack({ id: copyMessageId })))
        .addIf(!!copyMessageId, InlineKeyboard.text('🟢 Рассылка по активным', startActiveSubMailingData.pack({ id: copyMessageId })))
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

export const adminVpnClientsListData = new CallbackData('admin_vpn_client_os_id')
    .number('id'); // id os
export const adminListOsKeyboard = async () => {
    const os = await getAllOs();

    const keyboard = new InlineKeyboard();
    keyboard.columns(1);
    if (os.length) {
        for (const element of os) {
            keyboard.text(element.name, adminVpnClientsListData.pack({ id: element.id }), {
                style: element.button_style || undefined
            });
        }
    } else {
        keyboard.combine(emptyButtonKeyboard('🚫 Список пуст'));
    }

    keyboard.combine(backAdminMenuKeyboard);

    return keyboard;
};


export const adminVpnClientData = new CallbackData('admin_client_os_id')
    .number('os') // id os
    .number('id'); // id client
export const adminAddClientData = new CallbackData('add_client')
    .number('os'); // id os
export const adminlistVpnClientsKeyboard = async (osId: number) => {
    const vpnClients = await getVpnClientsByOs(osId);

    const keyboard = new InlineKeyboard();
    keyboard.columns(1);
    if (vpnClients.length) {
        for (const element of vpnClients) {
            keyboard.text(element.name, adminVpnClientData.pack({ os: osId, id: element.id }), {
                style: element.button_style || undefined
            });
        }
    } else {
        keyboard.combine(emptyButtonKeyboard('🚫 Список пуст'));
    }

    keyboard.text('➕ Добавить', adminAddClientData.pack({ os: osId }), { style: 'success' });
    keyboard.text('◀️ Назад', 'admin_clients');

    return keyboard;
};

export const changeClientPriorityData = new CallbackData('change_client_priority')
    .number('os') // id os
    .number('id') // id client
    .number('value'); // change value
export const deleteVpnClientData = new CallbackData('delete_client')
    .number('os') // id os
    .number('id'); // id client
export const nameVpnClientData = new CallbackData('new_client_name')
    .number('os') // id os
    .number('id'); // id client
export const linkVpnClientData = new CallbackData('new_client_link')
    .number('os') // id os
    .number('id'); // id client
export const chooseButtonStyleData = new CallbackData('choose_bs')
    .number('os') // id os
    .number('id'); // id client
export const adminVpnClientProfileKeyboard = async (osId: number, clientId: number) => {
    return new InlineKeyboard()
        .text('-1', changeClientPriorityData.pack({ os: osId, id: clientId, value: -1 }), { style: 'danger' }).text('+1', changeClientPriorityData.pack({ os: osId, id: clientId, value: 1 }), { style: 'success' }).row()
        .text('-5', changeClientPriorityData.pack({ os: osId, id: clientId, value: -5 }), { style: 'danger' }).text('+5', changeClientPriorityData.pack({ os: osId, id: clientId, value: 5 }), { style: 'success' }).row()
        .text('Название', nameVpnClientData.pack({ os: osId, id: clientId }))
        .text('Ссылка', linkVpnClientData.pack({ os: osId, id: clientId }))
        .text('Стиль', chooseButtonStyleData.pack({ os: osId, id: clientId }))
        .row()
        .text('Удалить', deleteVpnClientData.pack({ os: osId, id: clientId }), { style: 'danger' }).row()
        .text('◀️ Назад', adminVpnClientsListData.pack({ id: osId }));
};


export const newButtonStyleData = new CallbackData('set_bs')
    .number('os') // id os
    .number('id') // id client
    .string('style'); // button style
export const changeStyleButtonKeyboard = async (osId: number, clientId: number) => {
    return new InlineKeyboard()
        .columns(1)
        .text('success', newButtonStyleData.pack({ os: osId, id: clientId, style: 'success' }), { style: 'success' })
        .text('primary', newButtonStyleData.pack({ os: osId, id: clientId, style: 'primary' }), { style: 'primary' })
        .text('danger', newButtonStyleData.pack({ os: osId, id: clientId, style: 'danger' }), { style: 'danger' })
        .text('default', newButtonStyleData.pack({ os: osId, id: clientId, style: 'default' }))
        .text('◀️ Назад', adminVpnClientData.pack({ os: osId, id: clientId }));
}; 