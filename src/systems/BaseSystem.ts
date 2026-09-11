import { BUILDINGS, BuildingConfig } from '../data/buildings';
import { ResourceType } from '../data/items';
import { SaveSystem, BaseState } from './SaveSystem';
import { ResourceSystem } from './ResourceSystem';
import { AudioSystem } from './AudioSystem';

export class BaseSystem {
    private static instance: BaseSystem;
    private saveSystem: SaveSystem;
    private resourceSystem: ResourceSystem;
    private audioSystem: AudioSystem;

    private constructor() {
        this.saveSystem = SaveSystem.getInstance();
        this.resourceSystem = ResourceSystem.getInstance();
        this.audioSystem = AudioSystem.getInstance();
    }

    public static getInstance(): BaseSystem {
        if (!BaseSystem.instance) {
            BaseSystem.instance = new BaseSystem();
        }
        return BaseSystem.instance;
    }

    public getBuildingLevel(id: string): number {
        const base = this.saveSystem.getData().base;
        return (base as unknown as Record<string, number>)[id] || 0;
    }

    public getBuildingConfig(id: string): BuildingConfig | undefined {
        return BUILDINGS[id];
    }

    public getNextUpgradeCost(id: string): Partial<Record<ResourceType, number>> | null {
        const config = BUILDINGS[id];
        if (!config) return null;
        const currentLevel = this.getBuildingLevel(id);
        if (currentLevel >= config.maxLevel) return null; // Maxed out
        return config.costPerLevel[currentLevel] as Partial<Record<ResourceType, number>>;
    }

    public canUpgrade(id: string): boolean {
        const cost = this.getNextUpgradeCost(id);
        if (!cost) return false;
        return this.resourceSystem.canAfford(cost);
    }

    public upgradeBuilding(id: string): boolean {
        const cost = this.getNextUpgradeCost(id);
        if (!cost) return false;

        if (this.resourceSystem.deduct(cost)) {
            const base = this.saveSystem.getData().base;
            (base as unknown as Record<string, number>)[id] = ((base as unknown as Record<string, number>)[id] || 0) + 1;
            this.saveSystem.save();
            this.audioSystem.play('build');
            return true;
        }
        return false;
    }

    public getBasePerks() {
        const base = this.saveSystem.getData().base;
        return {
            hasDoubleJump: (base.workshop || 0) >= 3,
            hasDash: (base.workshop || 0) >= 4,
            magnetRadius: 30 + (base.workshop || 0) * 20,
            jumpBonus: (base.workshop || 0) >= 1 ? 0.08 : 0,
            scoreMultiplier: 1.0 + (base.campfire || 0) * 0.05,
            extraShields: Math.max(0, (base.shelter || 0) - 2),
            enciStartDistance: 35 + (base.watchtower || 0) * 5
        };
    }
}
