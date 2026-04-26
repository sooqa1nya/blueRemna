import { Composer, InlineKeyboard, InlineQueryResult, InputMessageContent, MediaInput } from 'gramio';
import { findUser, getUsersPayload, setActive } from '../database/users.js';
import { bot } from '../bot.js';
import { remnawave } from '../services/remnawave/index.js';
import { getPaymentPayload } from '../database/payment.js';


export const inlineQuery = new Composer({ name: 'inlineQuery' })
    .inlineQuery(/ref (.*)/, async context => {
        const user = await findUser(context.from.id);
        if (!user.is_admin) {
            return;
        }

        await context.answer([
            InlineQueryResult.article(
                (new Date().getTime()).toString(),
                '▶️ Отправить статистику',
                InputMessageContent.text(
                    '✅ Запрос принят',
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true }
                    }
                ), {
                reply_markup: new InlineKeyboard().text('⏳ Подготовка..', '__empty_button')
            }
            )
        ], {
            cache_time: 0
        });
    },
        {
            onResult: async context => {
                const getRef = context.query.match(/https:\/\/t.me\/\w+\?start=(?<ref>\w+)/);
                const ref = getRef ? getRef[1] : context.query.replace(/^ref\s+/, '');
                const users = await getUsersPayload(ref);

                if (!users.length) {
                    return await context.editText('🚫 Реф. ссылка не найдена', {
                        inline_message_id: context.inlineMessageId
                    });
                }

                const usersCount = users.length;
                let liveUsers = 0;
                let deathUsers = 0;
                let freeTrials = 0;
                let agreedPolicy = 0;
                let agreedPolicyActive = 0;
                let onlineAt = 0;

                await context.editText(`⏳ Подготовка статистики..`, {
                    parse_mode: 'HTML'
                });

                for (const user of users) {
                    if (user.trial_key) {
                        freeTrials++;
                    }

                    if (user.agreed_policy) {
                        agreedPolicy++;
                    }

                    try {
                        if (!user.is_active) {
                            throw new Error;
                        }

                        if (user.agreed_policy) {
                            agreedPolicyActive++;
                        }

                        await bot.api.sendChatAction({
                            chat_id: user.id,
                            action: 'typing'
                        });
                        liveUsers++;
                    } catch {
                        await setActive(user.id, false);
                        deathUsers++;
                    }

                    const remnaUser = await remnawave.getUserByTelegramId(user.id.toString());
                    if (remnaUser && remnaUser.response.length) {
                        for (const element of remnaUser.response) {
                            if (element.userTraffic.onlineAt) {
                                onlineAt++;
                                break;
                            }
                        }
                    }

                    const usersProcessed = liveUsers + deathUsers;
                    if (!(usersProcessed % 50)) {
                        await context.editText(`⏳ Обработано <code>${usersProcessed} (${(usersProcessed * 100 / usersCount).toFixed(2)}%)</code> пользователей`, {
                            parse_mode: 'HTML'
                        });
                    }
                }

                const text = `
🔗 Реферальная ссылка: <code>${ref}</code>

👤 Всего: <code>${usersCount}</code>
  └ Активных: <code>${agreedPolicy} (${(agreedPolicy * 100 / usersCount).toFixed(2)}%)</code>

🟢 Живых: <code>${liveUsers} (${(liveUsers * 100 / usersCount).toFixed(2)}%)</code>
  └ Активных: <code>${agreedPolicyActive} (${(agreedPolicyActive * 100 / liveUsers).toFixed(2)}%)</code>

🔴 Мертвых: <code>${deathUsers}</code>

🆓 Пробных подписок: <code>${freeTrials} (${(freeTrials * 100 / usersCount).toFixed(2)}%)</code>
🌐 Подключений: <code>${onlineAt} (${(onlineAt * 100 / freeTrials).toFixed(2)}%)</code>
💳 Оплачено подписок: <code>${(await getPaymentPayload(ref)).length}</code>
                    `;

                await context.editText(text, {
                    parse_mode: 'HTML'
                });
            }
        }
    )

    .inlineQuery(/.*/, async context => {
        const refUrl = `https://t.me/lightbluevpn_bot?start=id${context.from.id}`;
        const text = `
<b>💙 blueVPN — моя защита в сети</b>  

🎁 Бесплатный пробный период по моей ссылке

<blockquote>• Обход блокировок и ограничений
• Множество стран на выбор
• Работает на всех устройствах
• Скорость без ограничений
• Подключение до 5 устройств</blockquote>
        `;
        await context.answer([
            InlineQueryResult.article(
                'id-1',
                '💙 blueVPN',
                InputMessageContent.text(
                    text,
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true }
                    }
                ),
                {
                    reply_markup: new InlineKeyboard().url('🎁 Забрать пробный период', refUrl, { style: 'success' }),
                    description: 'Синий VPN сервис'
                }
            ),
            InlineQueryResult.article(
                'id-2',
                '🎁 Бесплатный пробный период',
                InputMessageContent.text(
                    text,
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true }
                    }
                ),
                {
                    reply_markup: new InlineKeyboard().url('🎁 Забрать пробный период', refUrl, { style: 'success' }),
                    description: 'Просто попробуй'
                }
            ),
            InlineQueryResult.article(
                'id-3',
                '🎬 YouTube без рекламы',
                InputMessageContent.text(
                    text,
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true }
                    }
                ),
                {
                    reply_markup: new InlineKeyboard().url('🎁 Забрать пробный период', refUrl, { style: 'success' }),
                    description: 'Видео в 4К без задержек'
                }
            ),
            InlineQueryResult.article(
                'id-4',
                '📱 Для всех устройств',
                InputMessageContent.text(
                    text,
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true }
                    }
                ),
                {
                    reply_markup: new InlineKeyboard().url('🎁 Забрать пробный период', refUrl, { style: 'success' }),
                    description: 'Всегда оставайся на связи'
                }
            )
        ]);
    });
