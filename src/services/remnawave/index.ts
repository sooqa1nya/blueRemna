import createClient from "openapi-fetch";
import type { paths, components } from './types.js';


class RemnaWaveService {
    private squads: { internal: string; external: string; } | null = null;
    private configProfile: string | null = null;
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


    public async createUser(data: components['schemas']['CreateUserRequestDto']) {
        const { data: response, error } = await this.client.POST('/api/users', {
            body: data
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return response;
    };

    public async updateUser(data: components['schemas']['UpdateUserRequestDto']) {
        const { data: response, error } = await this.client.PATCH('/api/users', {
            body: data
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return response;
    };

    public async getUserByUUID(uuid: string) {
        const { data, error } = await this.client.GET('/api/users/{uuid}', {
            params: { path: { uuid } }
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async getUserByTelegramId(tg: string) {
        const { data, error } = await this.client.GET('/api/users/by-telegram-id/{telegramId}', {
            params: { path: { telegramId: tg } }
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async deleteUser(uuid: string) {
        const { data, error } = await this.client.DELETE('/api/users/{uuid}', {
            params: { path: { uuid } }
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

    public async getSquadForVPN() {
        if (this.squads) {
            return this.squads;
        }

        const res = await this.getInternalSquads();
        const internal = res?.response.internalSquads.filter(x => x.name === process.env.REMNAWAVE_INTERNAL_SQUAD)[0]?.uuid;
        const res2 = await this.getExternalSquads();
        const external = res2?.response.externalSquads.filter(x => x.name === process.env.REMNAWAVE_EXTERNAL_SQUAD)[0]?.uuid;
        if (!internal || !external) {
            console.error('Ошибка получения сквада');
            return undefined;
        }

        this.squads = {
            internal,
            external
        };
        return this.squads;
    };

    public async getConfigProfiles() {
        const { data, error } = await this.client.GET('/api/config-profiles', {});
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async getConfigForVPN() {
        if (this.configProfile) {
            return this.configProfile;
        }

        const res = await this.getConfigProfiles();
        const profile = res?.response.configProfiles.filter(x => x.name === process.env.REMNAWAVE_PROFILE)[0]?.uuid;
        if (!profile) {
            console.error('Ошибка получения конфига профиля');
            return undefined;
        }

        this.configProfile = profile;
        return profile;
    }

    public async getHosts() {
        const { data, error } = await this.client.GET('/api/hosts', {});
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    };

    public async getHostsForVPN() {
        // const profile = await this.getConfigForVPN();
        // if (!profile) {
        //     return undefined;
        // }

        const res = await this.getHosts();
        const hosts = res?.response.filter(x => x.sni && !x.isDisabled && !x.isHidden).map(x => x.remark);
        if (!hosts?.length) {
            console.error('Ошибка получения хостов для профиля');
            return undefined;
        }
        return hosts;
    }

    public async getUserHwidDevices(uuid: string) {
        const { data, error } = await this.client.GET('/api/hwid/devices/{userUuid}', {
            params: { path: { userUuid: uuid } }
        });
        if (error) {
            console.error('RemnaWave API error:', error);
            return undefined;
        }
        return data;
    }

    public async deleteUserHwidDevice(data: components['schemas']['DeleteUserHwidDeviceRequestDto']) {
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