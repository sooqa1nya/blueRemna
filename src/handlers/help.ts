import { Composer } from 'gramio';
import { supportMenuKeyboard } from '../keyboards/main.js';
import { supportClients } from '../utils/get-support-clients.js';

export const help = new Composer({ name: 'help' })
    .callbackQuery('help', async context => {
        const text = `
☀️ *Помощь*

❗️ *Инструкция по подключению*
 - Для начала вам необходимо скачать любое приложение из списка ниже.
 - После установки нажмите кнопку активации подписки. 
 - После активации вам будет выдана ссылка для подключения, получить её можно нажав кнопку "Скопировать".
 - После копирования ссылку нужно вставить в скачанное приложение, после чего вы сможете подключиться к blueVPN.

ℹ️ При возникновении проблем вы всегда можете обратиться в поддержку

💮 Поддерживаемые приложения (текст кликабельный)
 - iOS: ${supportClients.ios}
 - Android: ${supportClients.android}
 - Windows: ${supportClients.windows}
 - macOS: ${supportClients.macos}
 - Linux: ${supportClients.linux}
    `;

        await context.editText(text,
            {
                reply_markup: supportMenuKeyboard,
                link_preview_options: { is_disabled: true },
                parse_mode: 'Markdown'
            });
    });