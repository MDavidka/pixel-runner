export type EnemyState = 'IDLE' | 'PATROL' | 'ALERT' | 'ATTACK' | 'RETREAT' | 'DEAD';

export interface EnemyConfig {
    id: string;
    name: string;
    baseSpeed: number;
    jumpPower: number;
    aggroDistance: number;
    damage: number;
    behavior: 'chaser' | 'patrol' | 'flying' | 'stationary';
}

export const ENEMIES: Record<string, EnemyConfig> = {
    enci: {
        id: 'enci',
        name: 'Enci',
        baseSpeed: 230,
        jumpPower: 480,
        aggroDistance: 9999,
        damage: 100,
        behavior: 'chaser'
    },
    wolf: {
        id: 'wolf',
        name: 'Valley Wolf',
        baseSpeed: 180,
        jumpPower: 350,
        aggroDistance: 300,
        damage: 30,
        behavior: 'patrol'
    },
    hawk: {
        id: 'hawk',
        name: 'Mountain Hawk',
        baseSpeed: 210,
        jumpPower: 0,
        aggroDistance: 400,
        damage: 25,
        behavior: 'flying'
    }
};
