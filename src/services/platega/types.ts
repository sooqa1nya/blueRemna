
/**
 * Статус платежа
 */
enum PaymentStatus {
    /** Ожидает оплаты — Транзакция ожидает поступления платежа от пользователя */
    PENDING = 'PENDING',
    /** Отменен — Транзакция отменена пользователем или системой */
    CANCELED = 'CANCELED',
    /** Подтвержден — Транзакция успешно подтверждена и завершена */
    CONFIRMED = 'CONFIRMED',
    /** Chargeback — Спорная транзакция, требующая разбирательства */
    CHARGEBACKED = 'CHARGEBACKED',
}

/**
 * Способы оплаты
 */
enum PaymentMethodInt {
    /** СБП с QR-кодом (НСПК / QR) */
    SBP_QR = 2,
    /** Российские карты (МИР, Visa, Mastercard) */
    CARDS_RUB = 10,
    /** Общий карточный эквайринг */
    CARD_ACQUIRING = 11,
    /** Международные карточные платежи */
    INTERNATIONAL_ACQUIRING = 12,
    /** Общие криптовалютные платежи */
    CRYPTO = 13,
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
export type CallbackStatus = PaymentStatus.CONFIRMED | PaymentStatus.CANCELED;

/**
 * Тело callback-уведомления
 */
export interface CallbackPayload {
    /** ID транзакции */
    id: string;
    /** Сумма */
    amount: number;
    /** Валюта */
    currency: string;
    /** Статус транзакции в callback */
    status: CallbackStatus;
    /** ID метода оплаты */
    paymentMethod: PaymentMethodInt;
}