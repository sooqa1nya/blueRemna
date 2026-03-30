import { ButtonOptions } from 'gramio';

export interface IUser {
    id: number;
    username: string | null;
    first_name: string;
    register: Date;
    trial_key: boolean;
    last_activity: Date;
    ref_balance: string;
    ref_proc: number;
    sale: number;
    is_admin: boolean;
    is_active: boolean;
    agreed_policy: boolean;
    payload: string | null;
}

export interface INode {
    id: number;
    is_active: boolean;
    location: string;
    name: string;
}

export interface IUserProfiles {
    id: number;
    user_id: number;
    uuid: string;
    username: string;
    is_limit_extended: boolean;
}

export interface IPayment {
    id: number;
    user_id: number;
    service: string;
    payment_id: string;
    payment_time: Date;
    amount: string;
    status: 'pending' | 'paid';
    payload: string | null;
}

export interface ISetting {
    id: number;
    key: string;
    data: any;
}

export interface IOperatingSystems {
    id: number;
    name: string;
    button_style: ButtonOptions['style'];
    priority: number;
}

export interface IVpnClients {
    id: number;
    operating_system_id: number;
    name: string;
    link: string;
    button_style: ButtonOptions['style'];
    priority: number;
}

declare module 'gramio' {
    interface Context<Bot> {
        dbuser?: IUser;
    }
}