import { Composer } from 'gramio';
import * as handler from '../handlers/index.js';
import * as keyboard from '../keyboards/index.js';

export const activeKeys = new Composer()
    .callbackQuery('active_keys', handler.handleActiveKeys)
    .callbackQuery(keyboard.userKeyData, handler.handleActiveKey)
    .callbackQuery(keyboard.extendDeviceLimitData, handler.handleExtendDeviceLimit)
    .callbackQuery(keyboard.extendPaymentData, handler.handleExtendPayment)
    .callbackQuery(keyboard.extendCheckPaymentData, handler.handleExtendCheckPayment);