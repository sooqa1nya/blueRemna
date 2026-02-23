interface ICrypto {
    currency_type: 'crypto';
    asset?: 'USDT' | 'TON' | 'BTC' | 'ETH' | 'LTC' | 'BNB' | 'TRX' | 'USDC';
    fiat?: never;
    accepted_assets?: never;
}

interface IFiat {
    currency_type?: 'fiat';
    fiat?: | 'USD' | 'EUR' | 'RUB' | 'BYN' | 'UAH' | 'GBP'
    | 'CNY' | 'KZT' | 'UZS' | 'GEL' | 'TRY' | 'AMD'
    | 'THB' | 'INR' | 'BRL' | 'IDR' | 'AZN' | 'AED'
    | 'PLN' | 'ILS';
    asset?: never;
    accepted_assets?: string;
}

interface ICreateInvoiceBase {
    amount: string;
    swap_to?: 'USDT' | 'TON' | 'TRX' | 'ETH' | 'SOL' | 'BTC' | 'LTC';
    description?: string;
    hidden_message?: string;
    paid_btn_name?: 'viewItem' | 'openChannel' | 'openBot' | 'callback';
    paid_btn_url?: string;
    payload?: string;
    allow_comments?: boolean;
    allow_anonymous?: boolean;
    expires_in?: number;
}

interface IDeleteInvoice {
    invoice_id: number;
}


interface IInvoiceBase {
    ok: boolean;
    result: {
        invoice_id: number;
        hash: string;
        amount: string;
        accepeted_assets: string[];
        pay_url: string;
        bot_invoice_url: string;
        mini_app_invoice_url: string;
        web_app_invoice_url: string;
        status: 'active' | 'paid' | 'expired';
        created_at: Date;
        allow_comments: boolean;
        allow_anonymous: boolean;
    };
}

export type ICreateInvoice = ICreateInvoiceBase & (ICrypto | IFiat);
export type IInvoiceResponse = IInvoiceBase & (ICrypto | IFiat);