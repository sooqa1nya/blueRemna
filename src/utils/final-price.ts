import { getGlobalSale } from '../database/settings.js';

export const calcSale = async (userSale: number): Promise<number> => {
    const globalSale = await getGlobalSale();
    return userSale + globalSale > 70 ? 70 : userSale + globalSale;
};

export const finalPrice = async (price: string, userSale: number, stars: boolean = false): Promise<string> => {
    const finalSale = await calcSale(userSale);
    let result = Number(price) * (1 - finalSale / 100);
    if (stars) {
        result = result / Number(process.env.STARS_COEFFICIENT);
    }
    return String(Math.round(result));
};

