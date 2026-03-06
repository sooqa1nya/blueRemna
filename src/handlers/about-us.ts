import { Composer } from 'gramio';
import { remnawave } from '../services/remnawave/index.js';
import { supportMenuKeyboard } from '../keyboards/main.js';

export const aboutUs = new Composer({ name: 'aboutUs' })
    .callbackQuery('about_us', async context => {
        const hosts = await remnawave.getHostsForVPN();

        const text = `
ℹ️ *Информация*

🌏 Доступные локации:
    _${!!hosts ? hosts.join('\n    ') : 'Нет доступных локаций'}_

✅ Нет нужной локации? Свяжитесь с поддержкой, и мы постараемся добавить её в ближайшее время!

[📜 Пользовательское соглашение (кликабельно)](${process.env.USER_AGREEMENT_URL!})
[🔒 Политика конфиденциальности (кликабельно)](${process.env.PRIVACY_POLICY_URL!})
`;

        await context.editText(text, {
            reply_markup: supportMenuKeyboard,
            link_preview_options: { is_disabled: true },
            parse_mode: 'Markdown'
        });
    });