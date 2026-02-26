import type { CreateUserRequestDto, CreateUserResponseDto, GetExternalSquadsResponseDto, GetInternalSquadsResponseDto, GetUserByUuidResponseDto, UpdateUserRequestDto } from './types.js';

class RemnaWaveService {
    private JWT: string;
    private baseURL: string;
    private squads: { internal: string; external: string; } | null = null;

    constructor(JWT: string, baseURL: string) {
        this.JWT = JWT;
        this.baseURL = baseURL;
    }


    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.JWT}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('RemnaWave API error:', error);
            return undefined as T;
        }

        return await response.json();
    }


    public async createUser(data: CreateUserRequestDto) {
        return this.request<CreateUserResponseDto>('/api/users', {
            method: 'POST',
            body: JSON.stringify({
                ...data
            })
        });
    };

    public async updateUser(data: UpdateUserRequestDto) {
        return this.request('/api/users', {
            method: 'PATCH',
            body: JSON.stringify({
                ...data
            })
        });
    };

    public async getUserByUUID(uuid: string) {
        return this.request<GetUserByUuidResponseDto>(`/api/users/${uuid}`, {
            method: 'GET'
        });
    };

    public async deleteUser(uuid: string) {
        return this.request(`/api/users/${uuid}`, {
            method: 'DELETE'
        });
    };

    public async getInternalSquads() {
        return this.request<GetInternalSquadsResponseDto>('/api/internal-squads', {
            method: 'GET'
        });
    };

    public async getExternalSquads() {
        return this.request<GetExternalSquadsResponseDto>('/api/external-squads', {
            method: 'GET'
        });
    };

    public async getSquadForVPN() {
        if (this.squads) {
            return this.squads;
        }

        const internal = await this.getInternalSquads().then(res => res.response.internalSquads.filter(x => x.name === process.env.REMNAWAVE_INTERNAL_SQUAD)[0]?.uuid);
        const external = await this.getExternalSquads().then(res => res.response.externalSquads.filter(x => x.name === process.env.REMNAWAVE_EXTERNAL_SQUAD)[0]?.uuid);
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
}

export const remnawave = new RemnaWaveService(
    process.env.REMNAWAVE_JWT_SECRET!,
    process.env.REMNAWAVE_URL!
);
