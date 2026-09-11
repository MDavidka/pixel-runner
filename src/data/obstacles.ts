import { ResourceType } from './items';

export type ObstacleType = 
    | 'fallen_log' 
    | 'mossy_boulder' 
    | 'tree_stump' 
    | 'wooden_fence' 
    | 'river_spikes' 
    | 'rolling_rock' 
    | 'hanging_branch';

export interface ObstacleElement {
    type: ObstacleType;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    hitboxWidth: number;
    hitboxHeight: number;
    isRolling?: boolean;
}

export interface PlatformElement {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    isWooden?: boolean;
}

export interface CollectibleElement {
    type: ResourceType;
    offsetX: number;
    offsetY: number;
}

export interface GroundSegment {
    offsetX: number;
    width: number;
    isGap?: boolean;
    isBridge?: boolean;
}

export interface CuratedPattern {
    id: string;
    name: string;
    difficulty: number; // 1 to 5
    minPlayerSpeed: number;
    requiredJumpAbility: 'normal' | 'double_jump' | 'dash';
    totalWidth: number;
    groundSegments: GroundSegment[];
    platforms: PlatformElement[];
    obstacles: ObstacleElement[];
    collectibles: CollectibleElement[];
}

export const CURATED_PATTERNS: CuratedPattern[] = [
    // Pattern 1: Basic Starter Meadow Hop
    {
        id: 'p_meadow_basic',
        name: 'Single Log Meadow Hop',
        difficulty: 1,
        minPlayerSpeed: 180,
        requiredJumpAbility: 'normal',
        totalWidth: 480,
        groundSegments: [
            { offsetX: 0, width: 480 }
        ],
        platforms: [],
        obstacles: [
            { type: 'fallen_log', offsetX: 220, offsetY: -32, width: 64, height: 32, hitboxWidth: 48, hitboxHeight: 24 }
        ],
        collectibles: [
            { type: 'wood', offsetX: 120, offsetY: -40 },
            { type: 'wood', offsetX: 220, offsetY: -85 },
            { type: 'wood', offsetX: 320, offsetY: -40 }
        ]
    },
    // Pattern 2: Tree Stump + Foraging Berries
    {
        id: 'p_stump_food',
        name: 'Tree Stump with Food Arc',
        difficulty: 1,
        minPlayerSpeed: 180,
        requiredJumpAbility: 'normal',
        totalWidth: 520,
        groundSegments: [
            { offsetX: 0, width: 520 }
        ],
        platforms: [],
        obstacles: [
            { type: 'tree_stump', offsetX: 240, offsetY: -42, width: 48, height: 42, hitboxWidth: 36, hitboxHeight: 34 }
        ],
        collectibles: [
            { type: 'food', offsetX: 160, offsetY: -35 },
            { type: 'food', offsetX: 240, offsetY: -95 },
            { type: 'food', offsetX: 320, offsetY: -35 }
        ]
    },
    // Pattern 3: Mossy Boulder + Crystal Reward
    {
        id: 'p_boulder_crystal',
        name: 'Mossy Boulder & Crystal',
        difficulty: 2,
        minPlayerSpeed: 200,
        requiredJumpAbility: 'normal',
        totalWidth: 560,
        groundSegments: [
            { offsetX: 0, width: 560 }
        ],
        platforms: [],
        obstacles: [
            { type: 'mossy_boulder', offsetX: 260, offsetY: -50, width: 56, height: 50, hitboxWidth: 42, hitboxHeight: 40 }
        ],
        collectibles: [
            { type: 'stone', offsetX: 160, offsetY: -35 },
            { type: 'crystals', offsetX: 260, offsetY: -105 },
            { type: 'stone', offsetX: 360, offsetY: -35 }
        ]
    },
    // Pattern 4: River Chasm with Wooden Bridge
    {
        id: 'p_river_bridge',
        name: 'River Chasm & Wooden Bridge',
        difficulty: 2,
        minPlayerSpeed: 200,
        requiredJumpAbility: 'normal',
        totalWidth: 640,
        groundSegments: [
            { offsetX: 0, width: 180 },
            { offsetX: 180, width: 280, isGap: true },
            { offsetX: 460, width: 180 }
        ],
        platforms: [
            { offsetX: 220, offsetY: -20, width: 200, height: 20, isWooden: true }
        ],
        obstacles: [
            { type: 'river_spikes', offsetX: 200, offsetY: 40, width: 240, height: 30, hitboxWidth: 240, hitboxHeight: 30 }
        ],
        collectibles: [
            { type: 'wood', offsetX: 260, offsetY: -55 },
            { type: 'metal', offsetX: 320, offsetY: -55 },
            { type: 'wood', offsetX: 380, offsetY: -55 }
        ]
    },
    // Pattern 5: Double Hurdle with Stepping Platform
    {
        id: 'p_double_hurdle_platform',
        name: 'Double Hurdle with High Platform Route',
        difficulty: 3,
        minPlayerSpeed: 220,
        requiredJumpAbility: 'normal',
        totalWidth: 700,
        groundSegments: [
            { offsetX: 0, width: 700 }
        ],
        platforms: [
            { offsetX: 240, offsetY: -75, width: 180, height: 22, isWooden: true }
        ],
        obstacles: [
            { type: 'wooden_fence', offsetX: 180, offsetY: -46, width: 40, height: 46, hitboxWidth: 30, hitboxHeight: 40 },
            { type: 'fallen_log', offsetX: 480, offsetY: -34, width: 60, height: 34, hitboxWidth: 44, hitboxHeight: 26 }
        ],
        collectibles: [
            { type: 'crystals', offsetX: 300, offsetY: -115 },
            { type: 'herbs', offsetX: 360, offsetY: -115 },
            { type: 'wood', offsetX: 560, offsetY: -40 }
        ]
    },
    // Pattern 6: High Risk Chasm Jump
    {
        id: 'p_chasm_jump',
        name: 'Direct Chasm Jump & Ore Cache',
        difficulty: 3,
        minPlayerSpeed: 230,
        requiredJumpAbility: 'normal',
        totalWidth: 600,
        groundSegments: [
            { offsetX: 0, width: 220 },
            { offsetX: 220, width: 150, isGap: true },
            { offsetX: 370, width: 230 }
        ],
        platforms: [],
        obstacles: [
            { type: 'river_spikes', offsetX: 220, offsetY: 50, width: 150, height: 30, hitboxWidth: 150, hitboxHeight: 30 }
        ],
        collectibles: [
            { type: 'metal', offsetX: 260, offsetY: -75 },
            { type: 'metal', offsetX: 330, offsetY: -75 }
        ]
    },
    // Pattern 7: Upper Secret Route with Ancient Relic
    {
        id: 'p_secret_upper_route',
        name: 'Upper Canopy Route & Ancient Relic',
        difficulty: 4,
        minPlayerSpeed: 240,
        requiredJumpAbility: 'normal',
        totalWidth: 800,
        groundSegments: [
            { offsetX: 0, width: 800 }
        ],
        platforms: [
            { offsetX: 200, offsetY: -65, width: 140, height: 20, isWooden: true },
            { offsetX: 400, offsetY: -110, width: 160, height: 20, isWooden: true }
        ],
        obstacles: [
            { type: 'mossy_boulder', offsetX: 250, offsetY: -50, width: 56, height: 50, hitboxWidth: 44, hitboxHeight: 40 },
            { type: 'wooden_fence', offsetX: 450, offsetY: -46, width: 40, height: 46, hitboxWidth: 30, hitboxHeight: 40 },
            { type: 'hanging_branch', offsetX: 620, offsetY: -120, width: 60, height: 30, hitboxWidth: 50, hitboxHeight: 20 }
        ],
        collectibles: [
            { type: 'artifacts', offsetX: 480, offsetY: -150 },
            { type: 'crystals', offsetX: 270, offsetY: -100 },
            { type: 'stone', offsetX: 700, offsetY: -40 }
        ]
    }
];
