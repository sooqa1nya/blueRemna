import { components } from '../../services/remnawave/types.js';


export const aSubProfileText = (rwUser: components['schemas']['GetUserByUuidResponseDto']) => {
    const sub = rwUser.response;

    const createDate = new Date(sub.createdAt);
    const expireDate = new Date(sub.expireAt);
    const onlineDate = sub.userTraffic.onlineAt ? new Date(sub.userTraffic.onlineAt) : null;

    return `
uuid: <code>${sub.uuid}</code>
Имя: <code>${sub.username}</code> <code>[${sub.id}]</code>
Телеграм: <code>${sub.telegramId || 'Нет'}</code>

Статус: <code>${sub.status}</code>
Дата создания: <code>${createDate.toLocaleDateString('ru-RU')} ${createDate.toLocaleTimeString('ru-RU')}</code>
Дата истечения: <code>${expireDate.toLocaleDateString('ru-RU')} ${expireDate.toLocaleTimeString('ru-RU')}</code>
Лимит устройств: <code>${sub.hwidDeviceLimit}</code>

Использовано: <code>${(sub.userTraffic.lifetimeUsedTrafficBytes / Math.pow(1024, 3)).toFixed(2)} GB</code>
Последнее подключение: <code>${onlineDate ? onlineDate.toLocaleDateString('ru-RU') + ' ' + onlineDate.toLocaleTimeString('ru-RU') : 'Нет'}</code>

${sub.description ? `Описание: <code>${sub.description}</code>` : ''}
        `;
};
