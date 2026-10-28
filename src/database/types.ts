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

export interface IUserSub {
    id: string;
    rw_user_id: number;
    username: string;
    sub_plan_id: string;
    is_limit_extended: boolean;
}

export interface IPayment {
    id: number;
    user_id: string;
    service: string;
    payment_id: string;
    payment_time: Date;
    amount: string;
    status: 'pending' | 'process' | 'paid' | 'chargebacked' | 'partially_refunded' | 'disputed';
    months: number;
    sub_plan_id: string;
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

export interface ISubPlans {
    id: number;
    active: boolean;
    name: string;
    tag: string;
    internal_squad: string;
    info: string;
    priority: number;
}

export interface ISubPrices {
    id: number;
    months: number;
    days: number;
    amount: string;
    plan_id: string;
}

declare module 'gramio' {
    interface Context<Bot> {
        dbuser?: IUser;
    }
}