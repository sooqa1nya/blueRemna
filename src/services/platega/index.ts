import type { CreateTransactionRequest, CreateTransactionResponse } from './types.js';

class Platega {
    private token: string;
    private merchantId: string;
    private apiURL: string = 'https://app.platega.io';

    constructor(token: string, merchantId: string) {
        this.token = token;
        this.merchantId = merchantId;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.apiURL}${endpoint}`, {
            method: 'POST',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-Secret': this.token,
                'X-MerchantId': this.merchantId,
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Platega API error:', error);
            return undefined as T;
        }

        return await response.json();
    }

    public async createTransaction(transaction: CreateTransactionRequest) {
        return await this.request<CreateTransactionResponse>('/transaction/process', {
            method: 'POST',
            body: JSON.stringify(transaction)
        });
    }

    public async getTransactionStatus(id: string) {
        return await this.request<CreateTransactionResponse>(`/transaction/${id}`, {
            method: 'GET'
        });
    }
}

export const platega = new Platega(process.env.PLATEGA_TOKEN!, process.env.PLATEGA_MERCHANT_ID!);