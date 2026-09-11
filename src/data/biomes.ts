export interface BiomeConfig {
    id: string;
    name: string;
    skyColors: {
        morning: [string, string, string];
        day: [string, string, string];
        sunset: [string, string, string];
        night: [string, string, string];
    };
    mountainTint: number;
    forestTint: number;
    grassColor: number;
    dirtColor: number;
    stoneColor: number;
    weatherOptions: ('CLEAR' | 'CLOUDY' | 'RAIN' | 'HEAVY_RAIN' | 'FOG' | 'SNOW')[];
    particleType: 'none' | 'leaves' | 'spores' | 'petals' | 'snow' | 'dust';
    difficultyMultiplier: number;
}

export const BIOMES: BiomeConfig[] = [
    {
        id: 'meadow',
        name: 'Sunlit Meadow',
        skyColors: {
            morning: ['#fdba74', '#fed7aa', '#ffedd5'],
            day: ['#38bdf8', '#7dd3fc', '#bae6fd'],
            sunset: ['#f97316', '#fb923c', '#fde047'],
            night: ['#090d16', '#0f172a', '#1e1b4b']
        },
        mountainTint: 0x64748b,
        forestTint: 0x22c55e,
        grassColor: 0x84cc16,
        dirtColor: 0x78350f,
        stoneColor: 0x475569,
        weatherOptions: ['CLEAR', 'CLOUDY', 'RAIN'],
        particleType: 'petals',
        difficultyMultiplier: 1.0
    },
    {
        id: 'dense_forest',
        name: 'Whispering Pine Forest',
        skyColors: {
            morning: ['#ea580c', '#f97316', '#fed7aa'],
            day: ['#0284c7', '#38bdf8', '#7dd3fc'],
            sunset: ['#c2410c', '#ea580c', '#f97316'],
            night: ['#050811', '#091e24', '#0f291e']
        },
        mountainTint: 0x475569,
        forestTint: 0x15803d,
        grassColor: 0x4d7c0f,
        dirtColor: 0x5c2b09,
        stoneColor: 0x334155,
        weatherOptions: ['CLEAR', 'FOG', 'RAIN'],
        particleType: 'leaves',
        difficultyMultiplier: 1.15
    },
    {
        id: 'river_valley',
        name: 'Cascading River Rapids',
        skyColors: {
            morning: ['#f472b6', '#fbcfe8', '#e0f2fe'],
            day: ['#0ea5e9', '#67e8f9', '#a5f3fc'],
            sunset: ['#e11d48', '#fb7185', '#fed7aa'],
            night: ['#020617', '#0c192c', '#082f49']
        },
        mountainTint: 0x334155,
        forestTint: 0x059669,
        grassColor: 0x65a30d,
        dirtColor: 0x78350f,
        stoneColor: 0x1e293b,
        weatherOptions: ['RAIN', 'HEAVY_RAIN', 'FOG'],
        particleType: 'spores',
        difficultyMultiplier: 1.25
    },
    {
        id: 'mountain_cliffs',
        name: 'Granite Mountain Cliffs',
        skyColors: {
            morning: ['#fb923c', '#fdba74', '#f1f5f9'],
            day: ['#2563eb', '#60a5fa', '#93c5fd'],
            sunset: ['#b91c1c', '#ea580c', '#f59e0b'],
            night: ['#020617', '#0b0f19', '#1e293b']
        },
        mountainTint: 0x94a3b8,
        forestTint: 0x166534,
        grassColor: 0x65a30d,
        dirtColor: 0x57534e,
        stoneColor: 0x64748b,
        weatherOptions: ['CLEAR', 'CLOUDY', 'FOG'],
        particleType: 'dust',
        difficultyMultiplier: 1.35
    },
    {
        id: 'autumn_grove',
        name: 'Golden Autumn Grove',
        skyColors: {
            morning: ['#f97316', '#fdba74', '#ffedd5'],
            day: ['#0284c7', '#7dd3fc', '#bae6fd'],
            sunset: ['#991b1b', '#c2410c', '#ea580c'],
            night: ['#080402', '#1c1008', '#2e1503']
        },
        mountainTint: 0x78350f,
        forestTint: 0xd97706,
        grassColor: 0xb45309,
        dirtColor: 0x713f12,
        stoneColor: 0x57534e,
        weatherOptions: ['CLEAR', 'CLOUDY', 'RAIN'],
        particleType: 'leaves',
        difficultyMultiplier: 1.45
    },
    {
        id: 'snowy_ridge',
        name: 'Frostbite Snowy Ridge',
        skyColors: {
            morning: ['#e0e7ff', '#c7d2fe', '#e0f2fe'],
            day: ['#60a5fa', '#93c5fd', '#e0f2fe'],
            sunset: ['#818cf8', '#a78bfa', '#fbcfe8'],
            night: ['#020617', '#0b132b', '#1c2541']
        },
        mountainTint: 0xe2e8f0,
        forestTint: 0x334155,
        grassColor: 0xf8fafc,
        dirtColor: 0x475569,
        stoneColor: 0x94a3b8,
        weatherOptions: ['SNOW', 'CLOUDY', 'FOG'],
        particleType: 'snow',
        difficultyMultiplier: 1.6
    }
];
