export interface Plan {
    price: number;       // Стоимость тарифа (например, 189 или 299)
    durationDays: number; // Длительность периода в днях (например, 30)
}

export interface SwitchResult {
    newExpireDate: Date;
    newRemainingDays: number;
    deltaDays: number; // Положительное число = дни добавлены, отрицательное = списаны
}

/**
 * Пересчитывает дату окончания подписки при переходе между тарифами
 * 
 * @param currentExpireDate - Текущая дата окончания подписки
 * @param fromPlan - Текущий тариф
 * @param toPlan - Новый тариф
 * @param currentDate - Текущий момент времени (по умолчанию Date.now())
 */
export const recalculateSubscription = (
    currentExpireDate: Date,
    fromPlan: Plan,
    toPlan: Plan,
    currentDate: Date = new Date()
): SwitchResult => {
    const nowMs = currentDate.getTime();
    const expireMs = currentExpireDate.getTime();
    const remainingMs = Math.max(0, expireMs - nowMs);

    // Если подписка уже истекла
    if (remainingMs === 0) {
        return {
            newExpireDate: currentDate,
            newRemainingDays: 0,
            deltaDays: 0,
        };
    }

    // Стоимость одной миллисекунды для каждого тарифа
    const msInDay = 24 * 60 * 60 * 1000;
    const pricePerMsFrom = fromPlan.price / (fromPlan.durationDays * msInDay);
    const pricePerMsTo = toPlan.price / (toPlan.durationDays * msInDay);

    // Остаток денежной ценности на старом тарифе
    const remainingValue = remainingMs * pricePerMsFrom;

    // Сколько миллисекунд дает этот баланс на новом тарифе
    const newRemainingMs = Math.floor(remainingValue / pricePerMsTo);
    const newExpireDate = new Date(nowMs + newRemainingMs);

    // Расчет разницы в днях для логирования или вывода пользователю
    const originalRemainingDays = remainingMs / msInDay;
    const newRemainingDays = Number((newRemainingMs / msInDay).toFixed(2));
    const deltaDays = Number((newRemainingDays - originalRemainingDays).toFixed(2));

    return {
        newExpireDate,
        newRemainingDays,
        deltaDays,
    };
};