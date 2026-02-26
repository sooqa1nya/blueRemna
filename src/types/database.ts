export interface IUser {
    id: number;
    username: string | null;
    first_name: string;
    register: Date;
    trial_key: boolean;
    last_activity: Date;
    ref_balance: number;
    ref_proc: number;
    sale: number;
    is_admin: boolean;
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
}

export interface IPayment {
    id: number;
    user_id: number;
    service: string;
    payment_id: string;
    payment_time: Date;
    amount: number;
    status: 'pending' | 'paid';
    payload: string | null;
}

export interface ISetting {
    id: number;
    key: string;
    data: any;
}

// еще под вопросом
declare module 'gramio' {
    interface Context<Bot> {
        dbuser?: IUser;
    }
}