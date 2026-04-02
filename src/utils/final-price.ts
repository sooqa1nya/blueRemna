import { getGlobalSale } from '../database/settings.js';

export const calcSale = async (globalSale: number, userSale: number): Promise<number> => {
    return userSale + globalSale > 70 ? 70 : userSale + globalSale;
};
export const finalPrice = async (price: number, userSale: number, stars: boolean = false): Promise<number> => {
    const globalSale = await getGlobalSale();
    const finalSale = await calcSale(globalSale, userSale);
    let result = price * (1 - finalSale / 100);
    if (stars) {
        result = result / Number(process.env.STARS_COEFFICIENT);
    }
    return Math.round(result);
};

