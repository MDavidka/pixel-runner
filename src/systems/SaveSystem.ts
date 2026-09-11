import { ResourceType } from '../data/items';

export interface PlayerStats {
    speedLevel: number;
    jumpLevel: number;
    dashLevel: number;
    doubleJumpLevel: number;
    magnetLevel: number;
    staminaLevel: number;
}

export interface BaseState {
    campfire: number;
    shelter: number;
    workshop: number;
    farm: number;
    watchtower: number;
}

export interface MissionState {
    id: string;
    title: string;
    type: 'dist' | 'res' | 'jump' | 'build';
    target: number;
    progress: number;
    reward: Partial<Record<ResourceType, number>>;
    done: boolean;
    res?: ResourceType;
    building?: string;
}

export interface SaveDataSchema {
    resources: Record<ResourceType, number>;
    stats: PlayerStats;
    base: BaseState;
    missions: MissionState[];
    highScore: number;
    bestDistance: number;
    totalRuns: number;
    soundEnabled: boolean;
}

const SAVE_KEY = 'valley_runner_phaser_v4';

export class SaveSystem {
    private static instance: SaveSystem;
    private data: SaveDataSchema;

    private constructor() {
        this.data = this.load();
    }

    public static getInstance(): SaveSystem {
        if (!SaveSystem.instance) {
            SaveSystem.instance = new SaveSystem();
        }
        return SaveSystem.instance;
    }

    private getDefaultData(): SaveDataSchema {
        return {
            resources: {
                wood: 80,
                stone: 40,
                food: 35,
                metal: 20,
                crystals: 8,
                herbs: 15,
                artifacts: 1
            },
            stats: {
                speedLevel: 1,
                jumpLevel: 1,
                dashLevel: 0,
                doubleJumpLevel: 0,
                magnetLevel: 1,
                staminaLevel: 1
            },
            base: {
                campfire: 1,
                shelter: 1,
                workshop: 0,
                farm: 0,
                watchtower: 0
            },
            missions: [
                { id: 'm_dist', title: 'Travel 500m across the Valley', type: 'dist', target: 500, progress: 0, reward: { wood: 60, food: 30 }, done: false },
                { id: 'm_wood', title: 'Forage 40 Timber Logs', type: 'res', res: 'wood', target: 40, progress: 0, reward: { crystals: 6, stone: 35 }, done: false },
                { id: 'm_jump', title: 'Execute 15 Perfect Jumps', type: 'jump', target: 15, progress: 0, reward: { metal: 25, herbs: 20 }, done: false },
                { id: 'm_workshop', title: 'Build the Crafting Workshop', type: 'build', building: 'workshop', target: 1, progress: 0, reward: { crystals: 12, wood: 100 }, done: false }
            ],
            highScore: 0,
            bestDistance: 0,
            totalRuns: 0,
            soundEnabled: true
        };
    }

    public load(): SaveDataSchema {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return Object.assign(this.getDefaultData(), parsed);
            }
        } catch (e) {
            console.warn('Could not load save data:', e);
        }
        return this.getDefaultData();
    }

    public save(): void {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not save data:', e);
        }
    }

    public getData(): SaveDataSchema {
        return this.data;
    }

    public reset(): void {
        this.data = this.getDefaultData();
        this.save();
    }
}
