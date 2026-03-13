/**
 * Enum для статуса пользователя
 */
export enum UserStatus {
    ACTIVE = 'ACTIVE',
    DISABLED = 'DISABLED',
    LIMITED = 'LIMITED',
    EXPIRED = 'EXPIRED',
}

/**
 * Enum для стратегии сброса трафика
 */
export enum TrafficLimitStrategy {
    NO_RESET = 'NO_RESET',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
}

/**
 * DTO для создания пользователя
 */
export interface CreateUserRequestDto {
    /**
     * Unique username for the user. Required.
     * Must be 3-36 characters long and contain only letters, numbers, underscores and dashes.
     *
     * @pattern ^[a-zA-Z0-9_-]+$
     * @minLength 3
     * @maxLength 36
     */
    username: string;

    /**
     * Optional. User account status. Defaults to ACTIVE.
     *
     * @default 'ACTIVE'
     */
    status?: UserStatus;

    /**
     * Optional. Short UUID identifier for the user.
     */
    shortUuid?: string;

    /**
     * Optional. Password for Trojan protocol. Must be 8-32 characters.
     *
     * @minLength 8
     * @maxLength 32
     */
    trojanPassword?: string;

    /**
     * Optional. UUID for VLESS protocol. Must be a valid UUID format.
     *
     * @format uuid
     */
    vlessUuid?: string;

    /**
     * Optional. Password for Shadowsocks protocol. Must be 8-32 characters.
     *
     * @minLength 8
     * @maxLength 32
     */
    ssPassword?: string;

    /**
     * Optional. Traffic limit in bytes. Set to 0 for unlimited traffic.
     *
     * @minimum 0
     */
    trafficLimitBytes?: number;

    /**
     * Optional. Available reset periods. Defaults to NO_RESET.
     *
     * @default 'NO_RESET'
     */
    trafficLimitStrategy?: TrafficLimitStrategy;

    /**
     * Account expiration date. Required.
     *
     * @format date-time
     * @example '2025-01-17T15:38:45.065Z'
     */
    expireAt: string;

    /**
     * Optional. Account creation date.
     *
     * @format date-time
     * @example '2025-01-17T15:38:45.065Z'
     */
    createdAt?: string;

    /**
     * Optional. Date of last traffic reset.
     *
     * @format date-time
     * @example '2025-01-17T15:38:45.065Z'
     */
    lastTrafficResetAt?: string;

    /**
     * Optional. Additional notes or description for the user account.
     */
    description?: string;

    /**
     * Optional. User tag for categorization.
     * Max 16 characters, uppercase letters, numbers and underscores only.
     *
     * @pattern ^[A-Z0-9_]+$
     * @maxLength 16
     * @nullable
     */
    tag?: string | null;

    /**
     * Optional. Telegram user ID for notifications. Must be an integer.
     *
     * @nullable
     */
    telegramId?: number | null;

    /**
     * Optional. User email address. Must be a valid email format.
     *
     * @format email
     * @nullable
     */
    email?: string | null;

    /**
     * Optional. Maximum number of hardware devices allowed. Must be a positive integer.
     *
     * @minimum 0
     */
    hwidDeviceLimit?: number;

    /**
     * Optional. Array of UUIDs representing enabled internal squads.
     *
     * @items format: uuid
     */
    activeInternalSquads?: string[];

    /**
     * Optional. Pass UUID to create user with specific UUID,
     * otherwise it will be generated automatically.
     *
     * @format uuid
     */
    uuid?: string;

    /**
     * Optional. External squad UUID.
     *
     * @format uuid
     * @nullable
     */
    externalSquadUuid?: string | null;
}

/**
 * Enum для статуса пользователя (при обновлении доступны только 2 значения)
 */
export enum UpdateUserStatus {
    ACTIVE = 'ACTIVE',
    DISABLED = 'DISABLED',
}

/**
 * DTO для обновления пользователя
 */
export interface UpdateUserRequestDto {
    /**
     * Username of the user.
     */
    username?: string;

    /**
     * UUID of the user. UUID has higher priority than username,
     * so if both are provided, username will be ignored.
     *
     * @format uuid
     */
    uuid?: string;

    /**
     * User account status.
     */
    status?: UpdateUserStatus;

    /**
     * Traffic limit in bytes. 0 - unlimited.
     *
     * @minimum 0
     */
    trafficLimitBytes?: number;

    /**
     * Available reset periods. Defaults to NO_RESET.
     *
     * @default 'NO_RESET'
     */
    trafficLimitStrategy?: TrafficLimitStrategy;

    /**
     * Expiration date.
     *
     * @format date-time
     * @example '2025-01-17T15:38:45.065Z'
     */
    expireAt?: string;

    /**
     * Additional notes or description for the user account.
     *
     * @nullable
     */
    description?: string | null;

    /**
     * User tag for categorization.
     * Max 16 characters, uppercase letters, numbers and underscores only.
     *
     * @pattern ^[A-Z0-9_]+$
     * @maxLength 16
     * @nullable
     */
    tag?: string | null;

    /**
     * Telegram user ID for notifications. Must be an integer.
     *
     * @nullable
     */
    telegramId?: number | null;

    /**
     * User email address. Must be a valid email format.
     *
     * @format email
     * @nullable
     */
    email?: string | null;

    /**
     * Maximum number of hardware devices allowed.
     *
     * @minimum 0
     * @nullable
     */
    hwidDeviceLimit?: number | null;

    /**
     * Array of UUIDs representing enabled internal squads.
     *
     * @items format: uuid
     */
    activeInternalSquads?: string[];

    /**
     * Optional. External squad UUID.
     *
     * @format uuid
     * @nullable
     */
    externalSquadUuid?: string | null;
}
/**
 * Информация о внутреннем скводе
 */
export interface InternalSquadDto {
    /**
     * UUID сквода
     *
     * @format uuid
     */
    uuid: string;

    /**
     * Название сквода
     */
    name: string;
}

/**
 * Информация о трафике пользователя
 */
export interface UserTrafficDto {
    /**
     * Использованный трафик в байтах (за текущий период)
     */
    usedTrafficBytes: number;

    /**
     * Использованный трафик в байтах (за всё время)
     */
    lifetimeUsedTrafficBytes: number;

    /**
     * Дата последнего онлайна
     *
     * @format date-time
     * @nullable
     */
    onlineAt: string | null;

    /**
     * Дата первого подключения
     *
     * @format date-time
     * @nullable
     */
    firstConnectedAt: string | null;

    /**
     * UUID последнего узла, к которому подключался пользователь
     *
     * @format uuid
     * @nullable
     */
    lastConnectedNodeUuid: string | null;
}

/**
 * Данные пользователя в ответе
 */
export interface UserResponseDto {
    /**
     * @format uuid
     */
    uuid: string;

    id: number;

    shortUuid: string;

    username: string;

    /**
     * @default 'ACTIVE'
     */
    status?: UserStatus;

    /**
     * Traffic limit in bytes. 0 - unlimited.
     *
     * @default 0
     */
    trafficLimitBytes?: number;

    /**
     * Available reset periods.
     *
     * @default 'NO_RESET'
     */
    trafficLimitStrategy?: TrafficLimitStrategy;

    /**
     * @format date-time
     */
    expireAt: string;

    /**
     * @nullable
     */
    telegramId: number | null;

    /**
     * @format email
     * @nullable
     */
    email: string | null;

    /**
     * @nullable
     */
    description: string | null;

    /**
     * @nullable
     */
    tag: string | null;

    /**
     * @nullable
     */
    hwidDeviceLimit: number | null;

    /**
     * @format uuid
     * @nullable
     */
    externalSquadUuid: string | null;

    trojanPassword: string;

    /**
     * @format uuid
     */
    vlessUuid: string;

    ssPassword: string;

    /**
     * @default 0
     */
    lastTriggeredThreshold?: number;

    /**
     * @format date-time
     * @nullable
     */
    subRevokedAt: string | null;

    /**
     * @nullable
     */
    subLastUserAgent: string | null;

    /**
     * @format date-time
     * @nullable
     */
    subLastOpenedAt: string | null;

    /**
     * @format date-time
     * @nullable
     */
    lastTrafficResetAt: string | null;

    /**
     * @format date-time
     */
    createdAt: string;

    /**
     * @format date-time
     */
    updatedAt: string;

    subscriptionUrl: string;

    activeInternalSquads: InternalSquadDto[];

    userTraffic: UserTrafficDto;
}

/**
 * DTO ответа на запрос получения пользователя по UUID
 */
export interface GetUserByUuidResponseDto {
    response: UserResponseDto;
}

/**
 * Информация о количестве участников и инбаундов сквода
 */
export interface InternalSquadInfoDto {
    /**
     * Количество участников сквода
     */
    membersCount: number;

    /**
     * Количество инбаундов сквода
     */
    inboundsCount: number;
}

/**
 * Инбаунд сквода
 */
export interface InternalSquadInboundDto {
    [key: string]: unknown;
}

/**
 * Детальная информация о внутреннем скводе
 */
export interface InternalSquadDetailDto {
    /**
     * @format uuid
     */
    uuid: string;

    /**
     * Позиция отображения в списке
     */
    viewPosition: number;

    /**
     * Название сквода
     */
    name: string;

    /**
     * Сводная информация о скводе
     */
    info: InternalSquadInfoDto;

    /**
     * Список инбаундов сквода
     */
    inbounds: InternalSquadInboundDto[];

    /**
     * @format date-time
     */
    createdAt: string;

    /**
     * @format date-time
     */
    updatedAt: string;
}

/**
 * Тело ответа со списком внутренних скводов
 */
export interface InternalSquadsResponseData {
    /**
     * Общее количество внутренних скводов
     */
    total: number;

    /**
     * Список внутренних скводов
     */
    internalSquads: InternalSquadDetailDto[];
}

/**
 * DTO ответа на запрос получения списка внутренних скводов
 */
export interface GetInternalSquadsResponseDto {
    response: InternalSquadsResponseData;
}

/**
 * DTO ответа на запрос создания пользователя
 */
export interface CreateUserResponseDto {
    response: UserResponseDto;
}


/**
 * DTO ответа на запрос получения пользователя
 */
export interface GetUserByUuidResponseDto {
    response: UserResponseDto;
}

/**
 * Тип шаблона подписки
 */
export enum TemplateType {
    XRAY_JSON = 'XRAY_JSON',
    XRAY_BASE64 = 'XRAY_BASE64',
    MIHOMO = 'MIHOMO',
    STASH = 'STASH',
    CLASH = 'CLASH',
    SINGBOX = 'SINGBOX',
}

/**
 * Шаблон внешнего сквода
 */
export interface ExternalSquadTemplateDto {
    /**
     * @format uuid
     */
    templateUuid: string;

    templateType: TemplateType;
}

/**
 * Настройки подписки внешнего сквода
 */
export interface ExternalSquadSubscriptionSettingsDto {
    profileTitle?: string;

    supportLink?: string;

    /**
     * @minimum 1
     */
    profileUpdateInterval?: number;

    isProfileWebpageUrlEnabled?: boolean;

    serveJsonAtBaseSubscription?: boolean;

    isShowCustomRemarks?: boolean;

    /**
     * @nullable
     */
    happAnnounce?: string | null;

    /**
     * @nullable
     */
    happRouting?: string | null;

    randomizeHosts?: boolean;
}

/**
 * Переопределения хоста
 */
export interface ExternalSquadHostOverridesDto {
    /**
     * @maxLength 30
     * @nullable
     */
    serverDescription?: string | null;

    /**
     * @minimum 0
     * @maximum 65535
     * @nullable
     */
    vlessRouteId?: number | null;
}

/**
 * Настройки HWID внешнего сквода
 */
export interface ExternalSquadHwidSettingsDto {
    enabled: boolean;

    fallbackDeviceLimit: number;

    /**
     * @maxLength 200
     * @nullable
     */
    maxDevicesAnnounce: string | null;
}

/**
 * Кастомные ремарки для различных состояний пользователей
 */
export interface ExternalSquadCustomRemarksDto {
    /**
     * @minItems 1
     */
    expiredUsers: string[];

    /**
     * @minItems 1
     */
    limitedUsers: string[];

    /**
     * @minItems 1
     */
    disabledUsers: string[];

    /**
     * @minItems 1
     */
    emptyHosts: string[];

    /**
     * @minItems 1
     */
    HWIDMaxDevicesExceeded: string[];

    /**
     * @minItems 1
     */
    HWIDNotSupported: string[];
}

/**
 * Заголовки ответа (произвольные ключ-значение)
 */
export interface ExternalSquadResponseHeadersDto {
    [key: string]: string;
}

/**
 * Информация о внешнем скводе
 */
export interface ExternalSquadInfoDto {
    membersCount: number;
}

/**
 * Детальная информация о внешнем скводе
 */
export interface ExternalSquadDetailDto {
    /**
     * @format uuid
     */
    uuid: string;

    viewPosition: number;

    name: string;

    info: ExternalSquadInfoDto;

    templates: ExternalSquadTemplateDto[];

    /**
     * @nullable
     */
    subscriptionSettings: ExternalSquadSubscriptionSettingsDto | null;

    /**
     * @nullable
     */
    hostOverrides: ExternalSquadHostOverridesDto | null;

    /**
     * @nullable
     */
    responseHeaders: ExternalSquadResponseHeadersDto | null;

    /**
     * @nullable
     */
    hwidSettings: ExternalSquadHwidSettingsDto | null;

    /**
     * @nullable
     */
    customRemarks: ExternalSquadCustomRemarksDto | null;

    /**
     * @format uuid
     * @nullable
     */
    subpageConfigUuid: string | null;

    /**
     * @format date-time
     */
    createdAt: string;

    /**
     * @format date-time
     */
    updatedAt: string;
}

/**
 * Тело ответа со списком внешних скводов
 */
export interface ExternalSquadsResponseData {
    total: number;

    externalSquads: ExternalSquadDetailDto[];
}

/**
 * DTO ответа на запрос получения списка внешних скводов
 */
export interface GetExternalSquadsResponseDto {
    response: ExternalSquadsResponseData;
}

/**
 * Конфигурация профиля (произвольная структура)
 */
export interface ConfigProfileConfigDto {
    [key: string]: unknown;
}

/**
 * Сырой инбаунд (произвольная структура)
 */
export interface RawInboundDto {
    [key: string]: unknown;
}

/**
 * Инбаунд конфигурационного профиля
 */
export interface ConfigProfileInboundDto {
    /**
     * @format uuid
     */
    uuid: string;

    /**
     * @format uuid
     */
    profileUuid: string;

    tag: string;

    type: string;

    /**
     * @nullable
     */
    network: string | null;

    /**
     * @nullable
     */
    security: string | null;

    /**
     * @nullable
     */
    port: number | null;

    /**
     * @nullable
     */
    rawInbound: RawInboundDto | null;
}

/**
 * Нода конфигурационного профиля
 */
export interface ConfigProfileNodeDto {
    /**
     * @format uuid
     */
    uuid: string;

    name: string;

    countryCode: string;
}

/**
 * Детальная информация о конфигурационном профиле
 */
export interface ConfigProfileDetailDto {
    /**
     * @format uuid
     */
    uuid: string;

    viewPosition: number;

    name: string;

    config: ConfigProfileConfigDto;

    inbounds: ConfigProfileInboundDto[];

    nodes: ConfigProfileNodeDto[];

    /**
     * @format date-time
     */
    createdAt: string;

    /**
     * @format date-time
     */
    updatedAt: string;
}

/**
 * Тело ответа со списком конфигурационных профилей
 */
export interface ConfigProfilesResponseData {
    total: number;

    configProfiles: ConfigProfileDetailDto[];
}

/**
 * DTO ответа на запрос получения списка конфигурационных профилей
 */
export interface GetConfigProfilesResponseDto {
    response: ConfigProfilesResponseData;
}

/**
 * Уровень безопасности хоста
 */
export enum SecurityLayer {
    DEFAULT = 'DEFAULT',
    TLS = 'TLS',
    NONE = 'NONE',
}

/**
 * Параметры xHTTP (произвольная структура)
 */
export interface XHttpExtraParamsDto {
    [key: string]: unknown;
}

/**
 * Параметры мультиплексирования (произвольная структура)
 */
export interface MuxParamsDto {
    [key: string]: unknown;
}

/**
 * Параметры сокета (произвольная структура)
 */
export interface SockoptParamsDto {
    [key: string]: unknown;
}

/**
 * Информация об инбаунде хоста
 */
export interface HostInboundDto {
    /**
     * @format uuid
     * @nullable
     */
    configProfileUuid: string | null;

    /**
     * @format uuid
     * @nullable
     */
    configProfileInboundUuid: string | null;
}

/**
 * Детальная информация о хосте
 */
export interface HostDetailDto {
    /**
     * @format uuid
     */
    uuid: string;

    viewPosition: number;

    remark: string;

    address: string;

    port: number;

    /**
     * @nullable
     */
    path: string | null;

    /**
     * @nullable
     */
    sni: string | null;

    /**
     * @nullable
     */
    host: string | null;

    /**
     * @nullable
     */
    alpn: string | null;

    /**
     * @nullable
     */
    fingerprint: string | null;

    /**
     * @default false
     */
    isDisabled?: boolean;

    /**
     * @default 'DEFAULT'
     */
    securityLayer?: SecurityLayer;

    /**
     * @nullable
     */
    xHttpExtraParams: XHttpExtraParamsDto | null;

    /**
     * @nullable
     */
    muxParams: MuxParamsDto | null;

    /**
     * @nullable
     */
    sockoptParams: SockoptParamsDto | null;

    inbound: HostInboundDto;

    /**
     * @maxLength 30
     * @nullable
     */
    serverDescription: string | null;

    /**
     * @nullable
     */
    tag: string | null;

    /**
     * @default false
     */
    isHidden?: boolean;

    /**
     * @default false
     */
    overrideSniFromAddress?: boolean;

    /**
     * @default false
     */
    keepSniBlank?: boolean;

    /**
     * @minimum 0
     * @maximum 65535
     * @nullable
     */
    vlessRouteId: number | null;

    /**
     * @default false
     */
    allowInsecure?: boolean;

    shuffleHost: boolean;

    mihomoX25519: boolean;

    /**
     * Список UUID нод, привязанных к хосту
     *
     * @items format: uuid
     */
    nodes: string[];

    /**
     * @format uuid
     * @nullable
     */
    xrayJsonTemplateUuid: string | null;

    /**
     * Список UUID внутренних скводов, исключённых из хоста
     *
     * @items format: uuid
     */
    excludedInternalSquads: string[];

    /**
     * Типы подписок, из которых хост исключён
     */
    excludeFromSubscriptionTypes?: TemplateType[];
}

/**
 * DTO ответа на запрос получения всех хостов
 */
export interface GetAllHostsResponseDto {
    response: HostDetailDto[];
}

export interface GetUserByTelegramIdResponseDto {
    response: UserResponseDto[];
}

export interface RemnawaveWebhookUserEventsDto {
    scope: 'user';
    event: 'user.created' | 'user.modified' | 'user.deleted' | 'user.revoked' | 'user.disabled'
    | 'user.enabled' | 'user.limited' | 'user.expired' | 'user.traffic_reset' | 'user.expires_in_72_hours' | 'user.expires_in_48_hours'
    | 'user.expires_in_24_hours' | 'user.expired_24_hours_ago' | 'user.first_connected' | 'user.bandwidth_usage_threshold_reached' | 'user.not_connected';
    timestamp: string;
    data: UserResponseDto;
    meta: {
        notConnectedAfterHours: number | null;
    } | null;
}


/**
 * Провайдер ноды
 */
export interface NodeProviderDto {
    /**
     * @format uuid
     */
    uuid: string;

    name: string;

    /**
     * @nullable
     */
    faviconLink: string | null;

    /**
     * @nullable
     */
    loginUrl: string | null;

    /**
     * @format date-time
     */
    createdAt: string;

    /**
     * @format date-time
     */
    updatedAt: string;
}

/**
 * Конфигурационный профиль ноды
 */
export interface NodeConfigProfileDto {
    /**
     * @format uuid
     * @nullable
     */
    activeConfigProfileUuid: string | null;

    activeInbounds: ConfigProfileInboundDto[];
}

/**
 * Данные ноды в вебхук-событии
 */
export interface NodeWebhookDataDto {
    /**
     * @format uuid
     */
    uuid: string;

    name: string;

    address: string;

    /**
     * @nullable
     */
    port: number | null;

    isConnected: boolean;

    isDisabled: boolean;

    isConnecting: boolean;

    /**
     * @format date-time
     * @nullable
     */
    lastStatusChange: string | null;

    /**
     * @nullable
     */
    lastStatusMessage: string | null;

    /**
     * @nullable
     */
    xrayVersion: string | null;

    /**
     * @nullable
     */
    nodeVersion: string | null;

    xrayUptime: string;

    isTrafficTrackingActive: boolean;

    /**
     * @nullable
     */
    trafficResetDay: number | null;

    /**
     * @nullable
     */
    trafficLimitBytes: number | null;

    /**
     * @nullable
     */
    trafficUsedBytes: number | null;

    /**
     * @nullable
     */
    notifyPercent: number | null;

    /**
     * @nullable
     */
    usersOnline: number | null;

    viewPosition: number;

    countryCode: string;

    consumptionMultiplier: number;

    tags: string[];

    /**
     * @nullable
     */
    cpuCount: number | null;

    /**
     * @nullable
     */
    cpuModel: string | null;

    /**
     * @nullable
     */
    totalRam: string | null;

    /**
     * @format date-time
     */
    createdAt: string;

    /**
     * @format date-time
     */
    updatedAt: string;

    configProfile: NodeConfigProfileDto;

    /**
     * @format uuid
     * @nullable
     */
    providerUuid: string | null;

    /**
     * @nullable
     */
    provider: NodeProviderDto | null;
}

/**
 * DTO вебхука для событий нод
 */
export interface RemnawaveWebhookNodeEventsDto {
    scope: 'node';

    event: 'node.created' | 'node.modified' | 'node.modified' | 'node.disabled' | 'node.enabled' | 'node.deleted' | 'node.connection_lost' | 'node.connection_restored' | 'node.traffic_notify';

    /**
     * @format date-time
     */
    timestamp: string;

    data: NodeWebhookDataDto;
}

/**
 * Данные CRM вебхук-события
 */
export interface CrmWebhookDataDto {
    providerName: string;

    nodeName: string;

    /**
     * @format date-time
     */
    nextBillingAt: string;

    loginUrl: string;
}

/**
 * DTO вебхука для CRM-событий
 */
export interface RemnawaveWebhookCrmEventsDto {
    scope: 'crm';

    event: 'crm.infra_billing_node_payment_in_7_days' | 'crm.infra_billing_node_payment_in_48hrs' | 'crm.infra_billing_node_payment_in_24hrs' | 'crm.infra_billing_node_payment_due_today' | 'crm.infra_billing_node_payment_overdue_24hrs' | 'crm.infra_billing_node_payment_overdue_48hrs' | 'crm.infra_billing_node_payment_overdue_7_days';

    /**
     * @format date-time
     */
    timestamp: string;

    data: CrmWebhookDataDto;
}