import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { supportMenuKeyboard } from '../keyboards/main.js';


const ios = `[Happ](https://apps.apple.com/us/app/happ-proxy-utility/id6504287215) / [v2RayTun](https://apps.apple.com/us/app/v2raytun/id6476628951)`;
const android = `[Happ](https://play.google.com/store/apps/details?id=com.happproxy) / [FlClashX](https://github.com/pluralplay/FlClashX/releases/latest) / [v2RayTun](https://play.google.com/store/apps/details?id=com.v2raytun.android)`;
const windows = `[Happ](https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe) / [FlClashX](https://github.com/pluralplay/FlClashX/releases/latest) / [Koala Clash](https://github.com/coolcoala/koala-clash/releases/latest) / [v2RayN](https://github.com/2dust/v2rayN/releases/latest) / [Throne](https://github.com/throneproj/Throne/releases/latest) / [v2RayTun](https://v2raytun.com/)`;
const macos = `[Happ](https://apps.apple.com/us/app/happ-proxy-utility/id6504287215) / [FlClashX](https://github.com/pluralplay/FlClashX/releases/latest) / [Koala Clash](https://github.com/coolcoala/koala-clash/releases/latest) / [Throne](https://github.com/throneproj/Throne/releases/latest)`;
const linux = `[Happ](https://github.com/Happ-proxy/happ-desktop/releases/latest) / [FlClashX](https://github.com/pluralplay/FlClashX/releases/latest) / [Koala Clash](https://github.com/coolcoala/koala-clash/releases/latest) / [Throne](https://github.com/throneproj/Throne/releases/latest) `;

const text = `
☀️ *Помощь*

❗️ Что бы подключиться к blueVPN, необходимо импортировать ссылку подписки в любой клиент с поддержкой протокола VLESS и HWID.

💮 Рекомендуемые клиенты:
- iOS: ${ios}
- Android: ${android}
- Windows: ${windows}
- macOS: ${macos}
- Linux: ${linux}
`;

export const handleHelp = async (context: CallbackQueryShorthandContext<Bot, 'help'>) => {
    await context.editText(text,
        {
            reply_markup: supportMenuKeyboard,
            link_preview_options: { is_disabled: true },
            parse_mode: 'Markdown'
        });
};