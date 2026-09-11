import * as Phaser from 'phaser';
import { BiomeManager } from './BiomeManager';
import { TerrainGenerator } from './TerrainGenerator';
import { ObstaclesGenerator } from './ObstaclesGenerator';
import { ChunkGenerator } from './ChunkGenerator';
import { JumpValidator } from '../systems/JumpValidator';
import { DayNightSystem } from '../systems/DayNightSystem';

export class WorldGenerator {
    private scene: Phaser.Scene;
    public biomeManager: BiomeManager;
    public terrainGenerator: TerrainGenerator;
    public obstaclesGenerator: ObstaclesGenerator;
    public chunkGenerator: ChunkGenerator;
    private jumpValidator: JumpValidator;

    // Visual Parallax Graphics / Layers
    private skyGraphics: Phaser.GameObjects.Graphics;
    private mountainGraphics: Phaser.GameObjects.Graphics;
    private forestGraphics: Phaser.GameObjects.Graphics;
    private foregroundTerrainGraphics: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.biomeManager = new BiomeManager();
        this.terrainGenerator = new TerrainGenerator(scene);
        this.jumpValidator = new JumpValidator();
        this.obstaclesGenerator = new ObstaclesGenerator(this.jumpValidator);
        this.chunkGenerator = new ChunkGenerator(scene, this.terrainGenerator);

        this.skyGraphics = scene.add.graphics().setDepth(0).setScrollFactor(0);
        this.mountainGraphics = scene.add.graphics().setDepth(1);
        this.forestGraphics = scene.add.graphics().setDepth(2);
        this.foregroundTerrainGraphics = scene.add.graphics().setDepth(8);
    }

    public init(): void {
        this.chunkGenerator.spawnInitialSafeGround(1100);
    }

    public update(dt: number, playerX: number, playerSpeed: number, hasDoubleJump: boolean, difficultyLevel: number, dayNightSystem: DayNightSystem): void {
        const currentBiome = this.biomeManager.updateBiome(playerX);

        // Maintain chunks generating ~1400px ahead of player
        while (this.chunkGenerator.getNextChunkX() < playerX + 1400) {
            const pattern = this.obstaclesGenerator.getNextPattern(difficultyLevel, playerSpeed, hasDoubleJump);
            this.chunkGenerator.spawnChunk(pattern);
        }

        const cameraLeftX = this.scene.cameras.main.scrollX;
        this.chunkGenerator.updateAndRecycle(cameraLeftX);

        // Render Parallax Background & Terrain Visuals
        this.drawParallax(cameraLeftX, currentBiome, dayNightSystem);
    }

    private drawParallax(cameraX: number, biome: any, dayNightSystem: DayNightSystem): void {
        const V_WIDTH = 960;
        const V_HEIGHT = 540;
        const GROUND_Y = 430;

        // 1. Sky Gradient
        const skyColors = this.biomeManager.getSkyColors(dayNightSystem.getTimeOfDay());
        this.skyGraphics.clear();
        this.skyGraphics.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(skyColors[0]).color,
            Phaser.Display.Color.HexStringToColor(skyColors[0]).color,
            Phaser.Display.Color.HexStringToColor(skyColors[2]).color,
            Phaser.Display.Color.HexStringToColor(skyColors[2]).color,
            1
        );
        this.skyGraphics.fillRect(0, 0, V_WIDTH, V_HEIGHT);

        // 2. Distant Mountain Peaks (Moves at 0.15 scroll factor)
        this.mountainGraphics.clear();
        this.mountainGraphics.fillStyle(biome.mountainTint, 0.9);
        const mtnOffset = -(cameraX * 0.15) % 480;
        for (let x = mtnOffset - 480; x < V_WIDTH + 480; x += 320) {
            this.mountainGraphics.beginPath();
            this.mountainGraphics.moveTo(cameraX + x, GROUND_Y);
            this.mountainGraphics.lineTo(cameraX + x + 160, GROUND_Y - 190);
            this.mountainGraphics.lineTo(cameraX + x + 320, GROUND_Y);
            this.mountainGraphics.closePath();
            this.mountainGraphics.fill();
        }

        // 3. Pine Forest Ridge (Moves at 0.45 scroll factor)
        this.forestGraphics.clear();
        this.forestGraphics.fillStyle(biome.forestTint, 0.95);
        const forestOffset = -(cameraX * 0.45) % 120;
        for (let x = forestOffset - 120; x < V_WIDTH + 120; x += 60) {
            this.forestGraphics.fillTriangle(
                cameraX + x, GROUND_Y,
                cameraX + x + 30, GROUND_Y - 95,
                cameraX + x + 60, GROUND_Y
            );
        }

        // 4. Foreground Terrain Pixel Rendering (Solid ground, grass top line, dirt)
        this.foregroundTerrainGraphics.clear();
        this.foregroundTerrainGraphics.fillStyle(biome.grassColor, 1.0);
        this.foregroundTerrainGraphics.fillRect(cameraX - 100, GROUND_Y, V_WIDTH + 200, 12);

        this.foregroundTerrainGraphics.fillStyle(biome.dirtColor, 1.0);
        this.foregroundTerrainGraphics.fillRect(cameraX - 100, GROUND_Y + 12, V_WIDTH + 200, V_HEIGHT - GROUND_Y);
    }
}
