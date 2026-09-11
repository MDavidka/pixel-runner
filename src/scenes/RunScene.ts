import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Companion } from '../entities/Companion';
import { Enemy } from '../entities/Enemy';
import { Animal } from '../entities/Animal';
import { WorldGenerator } from '../world/WorldGenerator';
import { DayNightSystem } from '../systems/DayNightSystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { DifficultyDirector } from '../systems/DifficultyDirector';
import { ResourceSystem } from '../systems/ResourceSystem';
import { MissionSystem } from '../systems/MissionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { BaseSystem } from '../systems/BaseSystem';
import { HUD } from '../ui/HUD';
import { MobileControls } from '../ui/MobileControls';
import { ResourceType, ITEMS } from '../data/items';

export class RunScene extends Phaser.Scene {
    private player!: Player;
    private companion!: Companion;
    private enci!: Enemy;
    private animals: Animal[] = [];

    private worldGen!: WorldGenerator;
    private dayNightSystem!: DayNightSystem;
    private weatherSystem!: WeatherSystem;
    private difficultyDirector!: DifficultyDirector;
    private resourceSystem!: ResourceSystem;
    private missionSystem!: MissionSystem;
    private saveSystem!: SaveSystem;
    private audioSystem!: AudioSystem;

    private hud!: HUD;
    private controls!: MobileControls;

    private score: number = 0;
    private comboMultiplier: number = 1.0;
    private gatheredResources: Record<string, number> = {};
    private isGameOver: boolean = false;

    constructor() {
        super({ key: 'RunScene' });
    }

    create(): void {
        this.isGameOver = false;
        this.score = 0;
        this.comboMultiplier = 1.0;
        this.gatheredResources = { wood: 0, stone: 0, food: 0, metal: 0, crystals: 0, herbs: 0, artifacts: 0 };

        // Systems Initialization
        this.saveSystem = SaveSystem.getInstance();
        this.resourceSystem = ResourceSystem.getInstance();
        this.missionSystem = MissionSystem.getInstance();
        this.audioSystem = AudioSystem.getInstance();
        this.difficultyDirector = new DifficultyDirector();
        this.dayNightSystem = new DayNightSystem();
        this.weatherSystem = new WeatherSystem(this);

        // World Generator
        this.worldGen = new WorldGenerator(this);
        this.worldGen.init();

        const perks = BaseSystem.getInstance().getBasePerks();

        // Spawn Characters
        this.player = new Player(this, 300, 420);
        this.companion = new Companion(this, 240, 420);
        this.enci = new Enemy(this, 300 - perks.enciStartDistance * 12, 420);

        // Wildlife
        this.animals = [
            new Animal(this, 600, 420, 'rabbit'),
            new Animal(this, 800, 160, 'bird'),
            new Animal(this, 500, 360, 'butterfly')
        ];

        // Physics Collisions with Ground & Platforms
        this.physics.add.collider(this.player, this.worldGen.terrainGenerator.groundGroup);
        this.physics.add.collider(this.player, this.worldGen.terrainGenerator.platformGroup);

        this.physics.add.collider(this.companion, this.worldGen.terrainGenerator.groundGroup);
        this.physics.add.collider(this.companion, this.worldGen.terrainGenerator.platformGroup);

        this.physics.add.collider(this.enci, this.worldGen.terrainGenerator.groundGroup);
        this.physics.add.collider(this.enci, this.worldGen.terrainGenerator.platformGroup);

        // Overlaps for Obstacles and Collectibles
        this.physics.add.overlap(this.player, this.worldGen.chunkGenerator.getActiveObstacles(), (p, o) => {
            this.handleObstacleHit();
        });

        // Setup HUD & Controls
        this.hud = new HUD(this);
        this.controls = new MobileControls(this);

        // Camera Setup
        this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 540);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -120, 40);

        // Mission tracking start
        this.missionSystem.trackProgress('dist', 0);
    }

    update(time: number, delta: number): void {
        if (this.isGameOver) return;
        const dt = Math.min(delta / 1000, 0.1);

        // 1. Controls & Player update
        this.controls.update();
        this.player.updatePlayer(
            dt,
            this.controls.moveInput,
            this.controls.isJumpPressed,
            this.controls.isJumpJustDown,
            this.controls.isJumpReleased,
            this.controls.isSprint
        );

        // 2. Companion Follow Update
        const isPlayerJumping = (this.player.body?.velocity.y || 0) < -100;
        this.companion.updateCompanion(dt, this.player.x, this.player.y, this.player.currentSpeed, isPlayerJumping);

        // 3. Difficulty & Enci Pursuit Update
        this.difficultyDirector.update(dt, this.player.currentSpeed, this.enci.baseSpeed);
        const enciTargetSpeed = this.difficultyDirector.getEnciSpeed();
        this.enci.updateEnci(dt, enciTargetSpeed, this.player.x, this.player.y, this.worldGen.chunkGenerator.getActiveObstacles());

        const enciDistMeters = this.enci.getDistanceToPlayerMeters(this.player.x);
        this.difficultyDirector.setEnciDistance(enciDistMeters);

        // 4. World, Chunks & Parallax
        const perks = BaseSystem.getInstance().getBasePerks();
        this.worldGen.update(
            dt,
            this.player.x,
            this.player.currentSpeed,
            perks.hasDoubleJump,
            this.difficultyDirector.getDifficultyLevel(),
            this.dayNightSystem
        );

        // 5. Day/Night & Weather
        this.dayNightSystem.update(dt);
        this.weatherSystem.update(dt);

        // 6. Wildlife
        const camX = this.cameras.main.scrollX;
        for (const animal of this.animals) {
            animal.updateAnimal(dt, camX);
        }

        // 7. Collectible Magnet & Collision Check
        const activeCols = this.worldGen.chunkGenerator.getActiveCollectibles();
        for (const col of activeCols) {
            col.updateBob(dt);
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y - 40, col.x, col.y);
            if (dist < perks.magnetRadius) {
                col.attractTowards(this.player.x, this.player.y - 40, 320, dt);
            }
            if (dist < 32) {
                this.collectResource(col);
            }
        }

        // 8. Obstacle Collision Check
        const activeObs = this.worldGen.chunkGenerator.getActiveObstacles();
        for (const obs of activeObs) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), obs.getBounds())) {
                this.handleObstacleHit();
            }
        }

        // 9. Score & Distance accumulation
        this.score += dt * 18 * this.comboMultiplier * perks.scoreMultiplier;
        const distTraveled = this.difficultyDirector.getDistanceTraveled();
        this.missionSystem.trackProgress('dist', Math.round(this.player.currentSpeed * dt / 10));

        // 10. Update HUD
        this.hud.update(this.score, distTraveled, enciDistMeters, this.resourceSystem.getAll());

        // 11. Check Game Over conditions (Enci caught player or fell into void)
        if (enciDistMeters <= 1 || this.player.y > 560) {
            this.triggerGameOver();
        }
    }

    private handleObstacleHit(): void {
        if (this.player.isInvulnerable) return;
        this.player.hitObstacle();
        this.comboMultiplier = 1.0;
        this.cameras.main.shake(150, 0.015);
    }

    private collectResource(col: any): void {
        col.setActive(false);
        col.setVisible(false);

        const type = col.resourceType as ResourceType;
        const cfg = ITEMS[type];
        this.resourceSystem.add(type, 1);
        this.gatheredResources[type] = (this.gatheredResources[type] || 0) + 1;
        this.score += cfg.scoreValue * this.comboMultiplier;
        this.comboMultiplier = Math.min(4.0, this.comboMultiplier + 0.1);

        this.audioSystem.play('pickup');
        this.missionSystem.trackProgress('res', 1, type);

        // Floating reward text
        const ft = this.add.text(col.x, col.y - 10, `+1 ${cfg.icon}`, {
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#facc15'
        }).setOrigin(0.5, 0.5).setDepth(30);

        this.tweens.add({
            targets: ft,
            y: col.y - 45,
            alpha: 0,
            duration: 700,
            ease: 'Cubic.easeOut',
            onComplete: () => ft.destroy()
        });
    }

    private triggerGameOver(): void {
        this.isGameOver = true;
        const save = this.saveSystem.getData();
        const dist = this.difficultyDirector.getDistanceTraveled();
        let isNewHigh = false;

        if (this.score > save.highScore) {
            save.highScore = this.score;
            isNewHigh = true;
        }
        if (dist > save.bestDistance) {
            save.bestDistance = dist;
        }
        save.totalRuns++;
        this.saveSystem.save();

        this.scene.start('GameOverScene', {
            score: this.score,
            distance: dist,
            gatheredResources: this.gatheredResources,
            isNewHighScore: isNewHigh
        });
    }
}
