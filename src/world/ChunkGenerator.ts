import * as Phaser from 'phaser';
import { Obstacle } from '../entities/Obstacle';
import { Collectible } from '../entities/Collectible';
import { CuratedPattern } from '../data/obstacles';
import { TerrainGenerator } from './TerrainGenerator';

export interface ActiveChunk {
    startX: number;
    endX: number;
    pattern: CuratedPattern;
    obstacles: Obstacle[];
    collectibles: Collectible[];
    platforms: Phaser.Physics.Arcade.Image[];
    grounds: Phaser.Physics.Arcade.Image[];
}

export class ChunkGenerator {
    private scene: Phaser.Scene;
    private terrainGenerator: TerrainGenerator;
    private obstaclePool: Obstacle[] = [];
    private collectiblePool: Collectible[] = [];
    private activeChunks: ActiveChunk[] = [];
    private nextChunkX: number = 0;
    private groundY: number = 430;

    constructor(scene: Phaser.Scene, terrainGenerator: TerrainGenerator) {
        this.scene = scene;
        this.terrainGenerator = terrainGenerator;
    }

    public getNextChunkX(): number {
        return this.nextChunkX;
    }

    public setNextChunkX(x: number): void {
        this.nextChunkX = x;
    }

    public spawnInitialSafeGround(length: number = 960): void {
        const ground = this.terrainGenerator.createGroundSegment(0, this.groundY, length);
        this.activeChunks.push({
            startX: 0,
            endX: length,
            pattern: {
                id: 'starter_safe',
                name: 'Starter Safe Zone',
                difficulty: 1,
                minPlayerSpeed: 180,
                requiredJumpAbility: 'normal',
                totalWidth: length,
                groundSegments: [{ offsetX: 0, width: length }],
                platforms: [],
                obstacles: [],
                collectibles: []
            },
            obstacles: [],
            collectibles: [],
            platforms: [],
            grounds: [ground]
        });
        this.nextChunkX = length;
    }

    public spawnChunk(pattern: CuratedPattern): ActiveChunk {
        const startX = this.nextChunkX;
        const chunkGrounds: Phaser.Physics.Arcade.Image[] = [];
        const chunkPlatforms: Phaser.Physics.Arcade.Image[] = [];
        const chunkObstacles: Obstacle[] = [];
        const chunkCollectibles: Collectible[] = [];

        // 1. Create Ground Segments
        for (const g of pattern.groundSegments) {
            if (!g.isGap) {
                const ground = this.terrainGenerator.createGroundSegment(startX + g.offsetX, this.groundY, g.width);
                chunkGrounds.push(ground);
            }
        }

        // 2. Create Elevated Platforms
        for (const p of pattern.platforms) {
            const plat = this.terrainGenerator.createPlatform(startX + p.offsetX, this.groundY + p.offsetY, p.width, p.height, p.isWooden);
            chunkPlatforms.push(plat);
        }

        // 3. Create Obstacles
        for (const o of pattern.obstacles) {
            const obs = this.getObstacleFromPool(
                startX + o.offsetX,
                this.groundY + o.offsetY,
                o.type,
                o.width,
                o.height,
                o.hitboxWidth,
                o.hitboxHeight
            );
            chunkObstacles.push(obs);
        }

        // 4. Create Collectibles
        for (const c of pattern.collectibles) {
            const col = this.getCollectibleFromPool(startX + c.offsetX, this.groundY + c.offsetY, c.type);
            chunkCollectibles.push(col);
        }

        const chunk: ActiveChunk = {
            startX,
            endX: startX + pattern.totalWidth,
            pattern,
            obstacles: chunkObstacles,
            collectibles: chunkCollectibles,
            platforms: chunkPlatforms,
            grounds: chunkGrounds
        };

        this.activeChunks.push(chunk);
        this.nextChunkX += pattern.totalWidth;
        return chunk;
    }

    private getObstacleFromPool(x: number, y: number, type: any, w: number, h: number, hitW: number, hitH: number): Obstacle {
        let obs = this.obstaclePool.find(o => !o.active);
        if (obs) {
            obs.reset(x, y, type, w, h, hitW, hitH);
        } else {
            obs = new Obstacle(this.scene, x, y, type, w, h, hitW, hitH);
            this.obstaclePool.push(obs);
        }
        return obs;
    }

    private getCollectibleFromPool(x: number, y: number, type: any): Collectible {
        let col = this.collectiblePool.find(c => !c.active);
        if (col) {
            col.reset(x, y, type);
        } else {
            col = new Collectible(this.scene, x, y, type);
            this.collectiblePool.push(col);
        }
        return col;
    }

    public updateAndRecycle(cameraLeftX: number): void {
        for (let i = this.activeChunks.length - 1; i >= 0; i--) {
            const chunk = this.activeChunks[i];
            if (chunk.endX < cameraLeftX - 300) {
                // Recycle chunk elements
                for (const obs of chunk.obstacles) {
                    obs.setActive(false);
                    obs.setVisible(false);
                }
                for (const col of chunk.collectibles) {
                    col.setActive(false);
                    col.setVisible(false);
                }
                for (const g of chunk.grounds) {
                    g.destroy();
                }
                for (const p of chunk.platforms) {
                    p.destroy();
                }
                this.activeChunks.splice(i, 1);
            }
        }
    }

    public getActiveObstacles(): Obstacle[] {
        return this.obstaclePool.filter(o => o.active);
    }

    public getActiveCollectibles(): Collectible[] {
        return this.collectiblePool.filter(c => c.active);
    }
}
