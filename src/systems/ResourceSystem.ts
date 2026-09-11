import { ResourceType } from '../data/items';
import { SaveSystem } from './SaveSystem';

export class ResourceSystem {
    private static instance: ResourceSystem;
    private saveSystem: SaveSystem;

    private constructor() {
        this.saveSystem = SaveSystem.getInstance();
    }

    public static getInstance(): ResourceSystem {
        if (!ResourceSystem.instance) {
            ResourceSystem.instance = new ResourceSystem();
        }
        return ResourceSystem.instance;
    }

    public getAmount(type: ResourceType): number {
        return this.saveSystem.getData().resources[type] || 0;
    }

    public add(type: ResourceType, amount: number): void {
        const data = this.saveSystem.getData();
        data.resources[type] = (data.resources[type] || 0) + amount;
        this.saveSystem.save();
    }

    public canAfford(cost: Partial<Record<ResourceType, number>>): boolean {
        const data = this.saveSystem.getData();
        for (const [res, needed] of Object.entries(cost)) {
            if ((data.resources[res as ResourceType] || 0) < (needed || 0)) {
                return false;
            }
        }
        return true;
    }

    public deduct(cost: Partial<Record<ResourceType, number>>): boolean {
        if (!this.canAfford(cost)) return false;
        const data = this.saveSystem.getData();
        for (const [res, needed] of Object.entries(cost)) {
            data.resources[res as ResourceType] = (data.resources[res as ResourceType] || 0) - (needed || 0);
        }
        this.saveSystem.save();
        return true;
    }

    public getAll(): Record<ResourceType, number> {
        return { ...this.saveSystem.getData().resources };
    }
}
