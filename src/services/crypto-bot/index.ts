import type { ICreateInvoice, IInvoiceResponse } from './types.js';

class CryptoBot {
    private token: string;
    private apiURL: string = 'https://pay.crypt.bot';

    constructor(token: string) {
        this.token = token;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.apiURL}/api/${endpoint}`, {
            method: 'POST',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Crypto-Pay-API-Token': this.token,
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('CryptoBot API error:', error);
            return undefined as T;
        }

        return await response.json();
    }

    public async createInvoice(invoice: ICreateInvoice) {
        return await this.request<IInvoiceResponse>('createInvoice', {
            method: 'POST',
            body: JSON.stringify(invoice)
        });
    }

    public async getInvoices(data: any) {
        return await this.request<any>('getInvoices', {
            body: JSON.stringify(data)
        });
    }

    public async getMe() {
        return await this.request<any>('getMe');
    }
}

export const cryptoBot = new CryptoBot(process.env.CRYPTO_BOT_TOKEN!);