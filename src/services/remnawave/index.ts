import createClient from "openapi-fetch";
import type { paths, components } from './types.js';


class RemnaWaveService {
    private externalSquad: string | null = null;
    private client: ReturnType<typeof createClient<paths>>;

    constructor(JWT: string, baseURL: string) {
        this.client = createClient<paths>({
            baseUrl: baseURL,
            headers: {
                'Authorization': `Bearer ${JWT}`,
                'Content-Type': 'application/json'
            }
        });
    }


    public async getUsers(data?: { size?: number, start?: number; }) {
        const { data: response, error } = await this.client.GET('/api/users', {
            params: { query: data }
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return response;
    }

    public async createUser(data: components['schemas']['CreateUserBodyDto']) {
        const { data: response, error } = await this.client.POST('/api/users', {
            body: data
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return response;
    };

    public async updateUser(data: components['schemas']['UpdateUserBodyDto']) {
        const { data: response, error } = await this.client.PATCH('/api/users', {
            body: data
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return response;
    };

    public async getUserByUserId(userId: number) {
        const { data, error } = await this.client.GET('/api/users/{userId}', {
            params: { path: { userId } }
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async getUserByTelegramId(tg: string) {
        const { data, error } = await this.client.GET('/api/users/stream', {
            params: {
                query: {
                    telegramId: tg,
                    size: 1000
                }
            }
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async deleteUser(userId: number) {
        const { data, error } = await this.client.DELETE('/api/users/{userId}', {
            params: { path: { userId } }
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async getInternalSquads() {
        const { data, error } = await this.client.GET('/api/internal-squads', {});
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async getExternalSquads() {
        const { data, error } = await this.client.GET('/api/external-squads', {});
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async getExternalSquad() {
        if (this.externalSquad) {
            return this.externalSquad;
        }

        const external = await this.getExternalSquads();
        if (!external) {
            console.error('Ошибка получения сквада');
            return undefined;
        }

        this.externalSquad = external.response.externalSquads.filter(x => x.name === process.env.REMNAWAVE_EXTERNAL_SQUAD)[0]?.uuid;;
        return this.externalSquad;
    };

    public async getHosts() {
        const { data, error } = await this.client.GET('/api/hosts', {});
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async getHostsByTag(tag: string) {
        const res = await this.getHosts();
        const hosts = res?.response.filter(x => x.tags.includes(tag.toUpperCase()) && !x.isDisabled && !x.isHidden).map(x => x.remark);
        if (!hosts?.length) {
            console.error('[getHostsByTag] Ошибка получения хостов для профиля. tag:', tag);
            return undefined;
        }
        return hosts;
    };

    public async getHostsForVPN() {
        const res = await this.getHosts();
        const hosts = res?.response.filter(x => x.sni && !x.isDisabled && !x.isHidden).map(x => x.remark);
        if (!hosts?.length) {
            console.error('Ошибка получения хостов для профиля');
            return undefined;
        }
        return hosts;
    }

    public async getUserHwidDevices(userId: number) {
        const { data, error } = await this.client.GET('/api/hwid/devices/{userId}', {
            params: { path: { userId } }
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    }

    public async deleteUserHwidDevice(data: components['schemas']['DeleteUserHwidDeviceBodyDto']) {
        const { data: response, error } = await this.client.POST('/api/hwid/devices/delete', {
            body: data
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return response;
    };
}

export const remnawave = new RemnaWaveService(
    process.env.REMNAWAVE_JWT_SECRET!,
    process.env.REMNAWAVE_URL!
);