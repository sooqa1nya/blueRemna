import { Composer } from 'gramio';


export const emptyButton = new Composer({ name: 'emptyButton' })
    .callbackQuery('__empty_button', async context => {
        await context.answerCallbackQuery('🟢 Информационная кнопка, не требует нажатия.');
    });