import { Composer } from 'gramio';
import { helpKeyboard, helpListOsKeyboard, helpListVpnClientsKeyboard, vpnClientData } from '../keyboards/help.js';

export const help = new Composer({ name: 'help' })
    .callbackQuery('help', async context => {
        const text = `
☀️ *Помощь*

↘️ *Инструкция по подключению*
 _1. Установите поддерживаемое приложение (зелёная кнопка "Скачать приложение")
 2. После установки приложения перейдите в меню вашей подписки (кнопка "Мои подписки" в Главном меню /start)_

▶️ *Если вы используете Happ:*
 _3. Нажмите кнопку "Подключить в Happ", после чего вас перенаправит в скачанное приложение
 4. Выберите необходимую локацию
 5. Нажмите кнопку "Подключиться"_

▶️ *Если вы используете другой клиент:*
 _3. Нажмите кнопку "Скопировать", что бы скопировать ключ для подключения
 4. Добавьте ключ в скачанный клиент
 5. Выберите необходимую локацию
 6. Нажмите кнопку "Подключиться"_

ℹ️ При возникновении вопросов или проблем вы всегда можете обратиться в поддержку
    `;

        await context.editText(text, {
            reply_markup: helpKeyboard,
            link_preview_options: { is_disabled: true },
            parse_mode: 'Markdown'
        });
    })

    .callbackQuery('list_clients', async context => {
        await context.editText(`↘️ Выберите ваше устройство`, {
            parse_mode: 'HTML',
            reply_markup: helpListOsKeyboard
        });
    })

    .callbackQuery(vpnClientData, async context => {
        const text = `
↘️ Выберите клиент для загруки

После нажатия на кнопку вы перейдете на страницу загрузки клиента

<b>❗️ Мы рекомендуем использовать Happ (зелёная кнопка), но вы так же можете выбрать любое другое приложение из списка</b>
        `;

        await context.editText(text, {
            parse_mode: 'HTML',
            reply_markup: await helpListVpnClientsKeyboard(context.queryData.id)
        });
    });