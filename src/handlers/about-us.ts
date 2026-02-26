import type { Bot, CallbackQueryShorthandContext } from 'gramio';
import { supportMenuKeyboard } from '../keyboards/main.js';
import { remnawave } from '../services/remnawave/index.js';


export const handleAboutUs = async (context: CallbackQueryShorthandContext<Bot, 'about_us'>) => {

    const hosts = await remnawave.getHostsForVPN();

    const text = `
ℹ️ *Информация*

🌏 Доступные локации:
${!!hosts ? hosts.map(x => `  ${x}\n`) : '    Нет доступных локаций\n'}
✅ Нет нужной локации? Свяжитесь с поддержкой, и мы постараемся добавить её в ближайшее время!

[📜 Пользовательское соглашение (кликабельно)](${process.env.USER_AGREEMENT_URL!})
[🔒 Политика конфиденциальности (кликабельно)](${process.env.PRIVACY_POLICY_URL!})
`;

    await context.editText(text, {
        reply_markup: supportMenuKeyboard,
        link_preview_options: { is_disabled: true },
        parse_mode: 'Markdown'
    });
};