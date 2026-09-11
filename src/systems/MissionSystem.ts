import { ResourceType } from '../data/items';
import { SaveSystem, MissionState } from './SaveSystem';
import { ResourceSystem } from './ResourceSystem';

export class MissionSystem {
    private static instance: MissionSystem;
    private saveSystem: SaveSystem;
    private resourceSystem: ResourceSystem;

    private constructor() {
        this.saveSystem = SaveSystem.getInstance();
        this.resourceSystem = ResourceSystem.getInstance();
    }

    public static getInstance(): MissionSystem {
        if (!MissionSystem.instance) {
            MissionSystem.instance = new MissionSystem();
        }
        return MissionSystem.instance;
    }

    public getMissions(): MissionState[] {
        return this.saveSystem.getData().missions;
    }

    public trackProgress(type: 'dist' | 'res' | 'jump' | 'build', amount: number, subtype?: string): MissionState[] {
        const completed: MissionState[] = [];
        const missions = this.saveSystem.getData().missions;

        for (const m of missions) {
            if (m.done) continue;

            if (m.type === type) {
                if (type === 'res' && m.res !== subtype) continue;
                if (type === 'build' && m.building !== subtype) continue;

                m.progress += amount;
                if (m.progress >= m.target) {
                    m.progress = m.target;
                    m.done = true;
                    completed.push(m);
                    this.claimReward(m);
                }
            }
        }

        if (completed.length > 0) {
            this.saveSystem.save();
        }
        return completed;
    }

    private claimReward(mission: MissionState): void {
        for (const [res, count] of Object.entries(mission.reward)) {
            if (count && count > 0) {
                this.resourceSystem.add(res as ResourceType, count);
            }
        }
    }
}
