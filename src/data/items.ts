export type ResourceType = 'wood' | 'stone' | 'food' | 'metal' | 'crystals' | 'herbs' | 'artifacts';

export interface ItemConfig {
    id: ResourceType;
    name: string;
    icon: string;
    color: number;
    scoreValue: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic';
    description: string;
}

export const ITEMS: Record<ResourceType, ItemConfig> = {
    wood: {
        id: 'wood',
        name: 'Timber Log',
        icon: '🪵',
        color: 0xb45309,
        scoreValue: 15,
        rarity: 'common',
        description: 'Hardwood logs for base expansion and crafting.'
    },
    stone: {
        id: 'stone',
        name: 'Granite Chunk',
        icon: '🪨',
        color: 0x94a3b8,
        scoreValue: 20,
        rarity: 'common',
        description: 'Durable stone for solid structures.'
    },
    food: {
        id: 'food',
        name: 'Wild Berries',
        icon: '🌾',
        color: 0x22c55e,
        scoreValue: 25,
        rarity: 'common',
        description: 'Nourishing provisions for expedition stamina.'
    },
    metal: {
        id: 'metal',
        name: 'Iron Ore',
        icon: '⚙️',
        color: 0x38bdf8,
        scoreValue: 35,
        rarity: 'uncommon',
        description: 'Refined ore for advanced workshop tools.'
    },
    crystals: {
        id: 'crystals',
        name: 'Glowing Crystal',
        icon: '💎',
        color: 0xc084fc,
        scoreValue: 50,
        rarity: 'rare',
        description: 'Rare dimensional mineral pulsing with energy.'
    },
    herbs: {
        id: 'herbs',
        name: 'Medicinal Herb',
        icon: '🌿',
        color: 0x4ade80,
        scoreValue: 30,
        rarity: 'uncommon',
        description: 'Forest flora used in crafting potions.'
    },
    artifacts: {
        id: 'artifacts',
        name: 'Ancient Relic',
        icon: '🏺',
        color: 0xf59e0b,
        scoreValue: 100,
        rarity: 'epic',
        description: 'Priceless antiquity from forgotten ruins.'
    }
};
