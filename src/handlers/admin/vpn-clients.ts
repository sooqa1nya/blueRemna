import { Composer } from 'gramio';
import { sceneInit } from '../../plugins/scenes.js';
import { addVpnClientScene } from '../../scenes/admin/add-vpn-client.js';
import { changeVpnClientNameScene } from '../../scenes/admin/change-vpn-client-name.js';
import { changeVpnClientLinkScene } from '../../scenes/admin/change-vpn-client-link.js';
import { changeVpnClientButtonStyle, deleteVpnClient, updateVpnClientPriority } from '../../database/vpn_clients.js';
import { clientInfoText } from '../../utils/text/a-client-info-text.js';
import {
    adminListOsKeyboard,
    adminlistVpnClientsKeyboard,
    adminAddClientData,
    adminVpnClientData,
    adminVpnClientProfileKeyboard,
    adminVpnClientsListData,
    changeClientPriorityData,
    deleteVpnClientData,
    nameVpnClientData,
    linkVpnClientData,
    chooseButtonStyleData,
    newButtonStyleData,
    changeStyleButtonKeyboard
} from '../../keyboards/admin.js';

export const vpnClientsAdmin = new Composer({ name: 'admin-vpn-clients' })
    .extend(sceneInit)
    .callbackQuery('admin_clients', async context => {
        await context.editText('Список ОС',
            {
                reply_markup: await adminListOsKeyboard()
            }
        );
    })
    .callbackQuery(adminVpnClientsListData, async context => {
        await context.editText('Список клиентов',
            {
                reply_markup: await adminlistVpnClientsKeyboard(context.queryData.id)
            }
        );
    })
    .callbackQuery(adminAddClientData, async context => {
        await context.scene.enter(addVpnClientScene, {
            osId: context.queryData.os
        });
    })
    .callbackQuery(adminVpnClientData, async context => {
        await context.editText(await clientInfoText(context.queryData.id), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: await adminVpnClientProfileKeyboard(context.queryData.os, context.queryData.id)
        });
    })
    .callbackQuery(changeClientPriorityData, async context => {
        await updateVpnClientPriority(context.queryData.id, context.queryData.value);
        await context.answerCallbackQuery();

        await context.editText(await clientInfoText(context.queryData.id), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: await adminVpnClientProfileKeyboard(context.queryData.os, context.queryData.id)
        });
    })
    .callbackQuery(deleteVpnClientData, async context => {
        await deleteVpnClient(context.queryData.id);
        await context.answerCallbackQuery();

        await context.editText('Список клиентов', {
            reply_markup: await adminlistVpnClientsKeyboard(context.queryData.os)
        });
    })
    .callbackQuery(nameVpnClientData, async context => {
        await context.scene.enter(changeVpnClientNameScene, {
            osId: context.queryData.os,
            clientId: context.queryData.id
        });
    })
    .callbackQuery(linkVpnClientData, async context => {
        await context.scene.enter(changeVpnClientLinkScene, {
            osId: context.queryData.os,
            clientId: context.queryData.id
        });
    })
    .callbackQuery(chooseButtonStyleData, async context => {
        await context.editText('Выберите стиль кнопки', {
            reply_markup: await changeStyleButtonKeyboard(context.queryData.os, context.queryData.id)
        });
    })
    .callbackQuery(newButtonStyleData, async context => {
        const style: string | null = context.queryData.style ? context.queryData.style : null;
        await changeVpnClientButtonStyle(context.queryData.id, style);
        await context.answerCallbackQuery();

        await context.editText(await clientInfoText(context.queryData.id), {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: await adminVpnClientProfileKeyboard(context.queryData.os, context.queryData.id)
        });
    });
