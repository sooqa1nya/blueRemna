
/**
 * Статус платежа
 */
export enum PaymentStatus {
    /** Ожидает оплаты — Транзакция ожидает поступления платежа от пользователя */
    PENDING = 'PENDING',
    /** Отменен — Транзакция отменена пользователем или системой */
    CANCELED = 'CANCELED',
    /** Подтвержден — Транзакция успешно подтверждена и завершена */
    CONFIRMED = 'CONFIRMED',
    /** Chargeback — Спорная транзакция, требующая разбирательства */
    CHARGEBACKED = 'CHARGEBACKED',
    /** По платежу прошёл частичный возврат. Платёж остаётся зачисленным на остаток суммы. */
    PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
    /** Платёж поставлен на проверку. Деньги по нему зарезервированы до решения: вывести их нельзя, но и списания со счёта ещё не было. */
    DISPUTED = 'DISPUTED'
}

/**
 * Способы оплаты
 */
enum PaymentMethodInt {
    SBP_QR = 2,
    ERIP = 3,
    CARD_ACQUIRING = 11,
    INTERNATIONAL_ACQUIRING = 12,
    CRYPTO = 13,
    SBERPAY = 14
}

// ============================================================
// Request / Response types
// ============================================================

/**
 * Тело запроса для создания транзакции.
 * Не указывайте поле `id` — оно генерируется системой автоматически.
 */
export interface CreateTransactionRequest {
    /** Номер способа оплаты (к примеру, 2 для QR СБП) */
    paymentMethod: PaymentMethodInt;

    paymentDetails: {
        /** Сумма платежа */
        amount: number;
        /** Валюта платежа (например, RUB) */
        currency: string;
    };
    /** Назначение (описание) платежа, указывайте по возможности всегда */
    description?: string;
    /** Редирект при успешном платеже */
    return?: string;
    /** Редирект при неуспешном платеже */
    failedUrl?: string;
    /** Дополнительная информация для инициализации в вашей системе */
    payload?: string;
}

/**
 * Ответ на создание транзакции
 */
export interface CreateTransactionResponse {
    /** Человекочитаемое имя метода оплаты */
    paymentMethod?: string;
    /** ID созданной транзакции */
    transactionId: string;
    /** Ссылка для оплаты (перейдите, чтобы завершить оплату) */
    redirect?: string;
    /** Ваша ссылка для редиректа после успешной оплаты */
    return?: string;
    /** Детали платежа (строка или объект) */
    paymentDetails?: string | Record<string, unknown>;
    /** Статус транзакции */
    status: PaymentStatus;
    /** Время до истечения платежа (HH:MM:SS) */
    expiresIn?: string;
    merchantId?: string;
    usdtRate?: number;
}

/**
 * Ответ на запрос статуса транзакции
 */
export interface TransactionStatusResponse {
    id?: string;
    status?: PaymentStatus;
    paymentDetails?: {
        amount?: number;
        currency?: string;
    };
    merchantName?: string;
    mechantId?: string;
    comission?: number;
    /** Название метода оплаты (например, SBPQR) */
    paymentMethod?: string;
    expiresIn?: string;
    return?: string;
    comissionUsdt?: number;
    amountUsdt?: number;
    qr?: string;
    payformSuccessUrl?: string;
    payload?: string;
    comissionType?: number;
    externalId?: string;
    description?: string;
}

/**
 * Callback-статус (подмножество PaymentStatus, приходящее в callback)
 */
export type CallbackStatus = PaymentStatus.CONFIRMED | PaymentStatus.CANCELED | PaymentStatus.CHARGEBACKED | PaymentStatus.PARTIALLY_REFUNDED | PaymentStatus.DISPUTED;

/**
 * Тело callback-уведомления
 */
export interface CallbackPayload {
    /** ID транзакции / подписки (uuid). Всегда. Для платежей — идентификатор платежа, для статусов подписки — идентификатор подписки */
    id: string;

    /** Сумма платежа в валюте платежа. Всегда */
    amount: number;

    /** Валюта. Всегда */
    currency: string;

    /** Статус транзакции / подписки. Всегда. См. страницы статусов */
    status: CallbackStatus | string;

    /** Код метода оплаты. Всегда для платежей */
    paymentMethod?: PaymentMethodInt;

    /** То, что вы передали при создании платежа; пустая строка, если не передавали. Всегда */
    payload: string;

    /** Только если платёж создан по платёжной ссылке */
    paymentLinkId?: string;

    /** Только для платежей по подписке и статусов подписки */
    subscriptionId?: string;

    /** Только когда следующее списание определено (ISO date-time) */
    nextChargeAt?: string;

    // --- поля возвратов ---

    /** Только по возвратам */
    refundId?: string;

    /** Сумма конкретной операции возврата */
    refundAmount?: number;

    /** Сколько возвращено по платежу всего */
    refundedAmount?: number;

    /** Сколько ещё можно вернуть */
    refundableAmount?: number;

    /** Succeeded или Declined */
    refundStatus?: 'Succeeded' | 'Declined' | string;
}