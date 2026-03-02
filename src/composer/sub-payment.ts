import { Composer } from 'gramio';
import * as handler from '../handlers/index.js';
import * as keyboard from '../keyboards/index.js';

export const subPayment = new Composer()
    .callbackQuery('extend_key', handler.handleExtendKey)
    .callbackQuery(keyboard.currentKeysData, handler.handleSelectDuration)
    .callbackQuery(keyboard.priceData, handler.handlePaymentMethod)
    .callbackQuery(keyboard.paymentSystemData, handler.handlePaymentNew)
    .callbackQuery(keyboard.checkPaymentData, handler.handleCheckPayment);