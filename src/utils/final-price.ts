import { getGlobalSale } from '../database/settings.js';

export const calcSale = async (globalSale: number, userSale: number): Promise<number> => {
    return userSale + globalSale > 70 ? 70 : userSale + globalSale;
};
export const finalPrice = async (price: string, userSale: number, stars: boolean = false): Promise<string> => {
    const globalSale = await getGlobalSale();
    const finalSale = await calcSale(globalSale, userSale);
    let result = Number(price) * (1 - finalSale / 100);
    if (stars) {
        result = result / Number(process.env.STARS_COEFFICIENT);
    }
    return String(Math.round(result));
};

