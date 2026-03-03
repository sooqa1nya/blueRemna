import { getGlobalSale } from '../database/settings.js';

export const calcSale = async (globalSale: number, userSale: number): Promise<number> => {
    return userSale + globalSale > 70 ? 70 : userSale + globalSale;
};
export const finalPrice = async (price: number, userSale: number): Promise<number> => {
    const globalSale = await getGlobalSale();
    const finalSale = await calcSale(globalSale, userSale);
    return Math.round(price * (1 - finalSale / 100));
};

