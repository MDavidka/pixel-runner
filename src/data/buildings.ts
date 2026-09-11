import { ResourceType } from './items';

export interface BuildingCost {
    [key: string]: number;
}

export interface BuildingConfig {
    id: string;
    name: string;
    icon: string;
    maxLevel: number;
    description: string;
    costPerLevel: BuildingCost[];
    perkDescription: string[];
}

export const BUILDINGS: Record<string, BuildingConfig> = {
    campfire: {
        id: 'campfire',
        name: 'Campfire',
        icon: '🔥',
        maxLevel: 5,
        description: 'The warm heart of your settlement. Increases expedition morale.',
        costPerLevel: [
            { wood: 20 },
            { wood: 40, stone: 15 },
            { wood: 80, stone: 35, food: 20 },
            { wood: 150, stone: 70, crystals: 5 },
            { wood: 300, stone: 150, crystals: 15 }
        ],
        perkDescription: [
            'Warmth keeps spirits high (+5% Score)',
            'Roasting hearth (+10% Food yield)',
            'Blazing campfire keeps wildlife calm (+15% Score)',
            'Sacred flame enhances speed (+5% Run Speed)',
            'Eternal Hearth (+25% All Resource Gains)'
        ]
    },
    shelter: {
        id: 'shelter',
        name: 'Log Cabin Shelter',
        icon: '🛖',
        maxLevel: 5,
        description: 'Sturdy wooden shelter for Timi and Lina.',
        costPerLevel: [
            { wood: 30, stone: 10 },
            { wood: 60, stone: 30 },
            { wood: 120, stone: 60, metal: 20 },
            { wood: 220, stone: 120, metal: 50, crystals: 5 },
            { wood: 400, stone: 250, metal: 100, crystals: 15 }
        ],
        perkDescription: [
            'Basic roof against weather (+10 Max Stamina)',
            'Insulated walls (+20 Max Stamina)',
            'Reinforced timber framework (+1 Hit Shield per run)',
            'Cozy interior (+2 Hit Shields per run)',
            'Fortified Homestead (+3 Hit Shields & +20% Coyote Time)'
        ]
    },
    workshop: {
        id: 'workshop',
        name: 'Crafting Workshop',
        icon: '🛠️',
        maxLevel: 5,
        description: 'Enables crafting improved running boots, jump springs, and magnets.',
        costPerLevel: [
            { wood: 40, stone: 20 },
            { wood: 80, stone: 40, metal: 25 },
            { wood: 160, stone: 80, metal: 60, crystals: 10 },
            { wood: 300, stone: 160, metal: 120, crystals: 25 },
            { wood: 600, stone: 350, metal: 250, crystals: 50 }
        ],
        perkDescription: [
            'Lightweight boots (+8% Jump Height)',
            'Magnetic harvester (Attracts items within 60px)',
            'Double Jump Mechanism (Enables mid-air Double Jump!)',
            'Aerodynamic mantle (Air Dash ability with [Shift])',
            'Master Engineering (+25% Magnet radius & +15% Speed)'
        ]
    },
    farm: {
        id: 'farm',
        name: 'Valley Farm & Greenhouse',
        icon: '🌾',
        maxLevel: 5,
        description: 'Cultivates crops, medicinal herbs, and fresh provisions.',
        costPerLevel: [
            { wood: 50, food: 25 },
            { wood: 100, stone: 30, food: 50 },
            { wood: 200, stone: 70, food: 100, herbs: 30 },
            { wood: 350, stone: 150, food: 200, herbs: 60, crystals: 10 },
            { wood: 700, stone: 300, food: 400, herbs: 120, crystals: 30 }
        ],
        perkDescription: [
            'Daily forage yields +20 Food after each run',
            'Herb garden yields +15 Herbs after each run',
            'Nutrient-rich snacks (+10% Sprint Duration)',
            'Hydroponic greenhouse (+50 Food & +30 Herbs per run)',
            'Grand Valley Orchard (Double all food and herb pickups in run)'
        ]
    },
    watchtower: {
        id: 'watchtower',
        name: 'Lookout Watchtower',
        icon: '🗼',
        maxLevel: 5,
        description: 'High vantage point to survey Enci and valley terrain.',
        costPerLevel: [
            { stone: 40, crystals: 5 },
            { wood: 80, stone: 80, crystals: 15 },
            { wood: 160, stone: 160, metal: 50, crystals: 30 },
            { wood: 300, stone: 300, metal: 100, crystals: 60 },
            { wood: 600, stone: 600, metal: 200, crystals: 120 }
        ],
        perkDescription: [
            'Spot obstacles further ahead (+10% Camera lead)',
            'Early warning radar (+5m initial distance from Enci)',
            'Eagle-eye scope (Reveals hidden artifact paths)',
            'Siren decoy (+10m initial distance from Enci)',
            'Grand Citadel Watchtower (Enci speed growth slowed by 25%)'
        ]
    }
};
