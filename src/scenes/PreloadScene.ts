import * as Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Visual loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x0f172a, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);
        progressBox.lineStyle(2, 0x38bdf8, 0.8);
        progressBox.strokeRect(width / 2 - 160, height / 2 - 15, 320, 30);

        const loadingText = this.add.text(width / 2, height / 2 - 35, 'Loading Valley Adventure...', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#38bdf8'
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0x38bdf8, 1);
            progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load Spritesheets & Assets
        const vKey = Date.now();
        this.load.image('char2_sheet', `assets/char2_sheet.png?v=${vKey}`);
        this.load.image('char1_sheet', `assets/char1_sheet.png?v=${vKey}`);
        this.load.image('enci_sheet', `assets/enci_sheet.png?v=${vKey}`);
        this.load.image('background', `assets/background.png?v=${vKey}`);
    }

    create(): void {
        this.createProceduralTextures();
        this.createAnimations();
        this.scene.start('MainMenuScene');
    }

    private createProceduralTextures(): void {
        // 1. Blank texture for invisible physics bodies
        const gBlank = this.add.graphics();
        gBlank.fillStyle(0xffffff, 0);
        gBlank.fillRect(0, 0, 32, 32);
        gBlank.generateTexture('tex_blank', 32, 32);
        gBlank.destroy();

        // 2. Wooden Bridge Platform texture
        const gBridge = this.add.graphics();
        gBridge.fillStyle(0x78350f, 1);
        gBridge.fillRect(0, 0, 64, 18);
        gBridge.fillStyle(0xb45309, 1);
        gBridge.fillRect(2, 2, 60, 6);
        gBridge.fillStyle(0x451a03, 1);
        gBridge.fillRect(14, 0, 4, 18);
        gBridge.fillRect(34, 0, 4, 18);
        gBridge.fillRect(50, 0, 4, 18);
        gBridge.generateTexture('tex_bridge', 64, 18);
        gBridge.destroy();

        // 3. Stone Platform texture
        const gStone = this.add.graphics();
        gStone.fillStyle(0x475569, 1);
        gStone.fillRect(0, 0, 64, 20);
        gStone.fillStyle(0x94a3b8, 1);
        gStone.fillRect(2, 2, 60, 6);
        gStone.generateTexture('tex_stone', 64, 20);
        gStone.destroy();

        // 4. Obstacle Textures (Fallen log, Mossy boulder, Tree stump, Wooden fence, River spikes)
        const gLog = this.add.graphics();
        gLog.fillStyle(0x451a03, 1);
        gLog.fillRoundedRect(0, 4, 64, 24, 6);
        gLog.fillStyle(0x65a30d, 1); // Moss on top
        gLog.fillRect(8, 4, 48, 5);
        gLog.fillStyle(0x78350f, 1);
        gLog.fillRect(4, 10, 56, 12);
        gLog.generateTexture('obs_fallen_log', 64, 32);
        gLog.destroy();

        const gBoulder = this.add.graphics();
        gBoulder.fillStyle(0x334155, 1);
        gBoulder.fillCircle(28, 25, 24);
        gBoulder.fillStyle(0x64748b, 1);
        gBoulder.fillCircle(24, 20, 18);
        gBoulder.fillStyle(0x4d7c0f, 1); // Moss
        gBoulder.fillCircle(20, 12, 10);
        gBoulder.generateTexture('obs_mossy_boulder', 56, 50);
        gBoulder.destroy();

        const gStump = this.add.graphics();
        gStump.fillStyle(0x451a03, 1);
        gStump.fillRect(6, 6, 36, 36);
        gStump.fillStyle(0xb45309, 1);
        gStump.fillEllipse(24, 6, 18, 6); // Tree rings top
        gStump.fillStyle(0x65a30d, 1);
        gStump.fillRect(4, 20, 6, 12);
        gStump.generateTexture('obs_tree_stump', 48, 42);
        gStump.destroy();

        const gFence = this.add.graphics();
        gFence.fillStyle(0x78350f, 1);
        gFence.fillRect(6, 0, 8, 46);
        gFence.fillRect(26, 0, 8, 46);
        gFence.fillStyle(0x92400e, 1);
        gFence.fillRect(0, 10, 40, 6);
        gFence.fillRect(0, 26, 40, 6);
        gFence.generateTexture('obs_wooden_fence', 40, 46);
        gFence.destroy();

        const gSpikes = this.add.graphics();
        gSpikes.fillStyle(0x0284c7, 0.7); // River Water
        gSpikes.fillRect(0, 15, 60, 15);
        gSpikes.fillStyle(0x475569, 1); // Pointed rocks
        for (let x = 4; x < 60; x += 14) {
            gSpikes.fillTriangle(x, 28, x + 6, 4, x + 12, 28);
        }
        gSpikes.generateTexture('obs_river_spikes', 60, 30);
        gSpikes.destroy();

        const gRock = this.add.graphics();
        gRock.fillStyle(0x64748b, 1);
        gRock.fillCircle(18, 18, 16);
        gRock.generateTexture('obs_rolling_rock', 36, 36);
        gRock.destroy();

        const gBranch = this.add.graphics();
        gBranch.fillStyle(0x78350f, 1);
        gBranch.fillRect(0, 0, 60, 10);
        gBranch.fillStyle(0x15803d, 1);
        gBranch.fillCircle(15, 12, 8);
        gBranch.fillCircle(40, 12, 8);
        gBranch.generateTexture('obs_hanging_branch', 60, 30);
        gBranch.destroy();

        // 5. Collectible Textures (Wood, Stone, Food, Metal, Crystals, Herbs, Artifacts)
        const makeColTex = (key: string, color: number, iconChar: string) => {
            const g = this.add.graphics();
            g.fillStyle(color, 0.9);
            g.fillCircle(12, 12, 11);
            g.lineStyle(1.5, 0xffffff, 0.85);
            g.strokeCircle(12, 12, 11);
            g.generateTexture(key, 24, 24);
            g.destroy();
        };

        makeColTex('res_wood', 0xb45309, '🪵');
        makeColTex('res_stone', 0x94a3b8, '🪨');
        makeColTex('res_food', 0x22c55e, '🌾');
        makeColTex('res_metal', 0x38bdf8, '⚙️');
        makeColTex('res_crystals', 0xc084fc, '💎');
        makeColTex('res_herbs', 0x4ade80, '🌿');
        makeColTex('res_artifacts', 0xf59e0b, '🏺');
    }

    private createAnimations(): void {
        // Timi Animations (char2)
        this.anims.create({
            key: 'char2_idle',
            frames: [{ key: 'char2_sheet' }],
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'char2_run',
            frames: [{ key: 'char2_sheet' }],
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: 'char2_jump',
            frames: [{ key: 'char2_sheet' }],
            frameRate: 1,
            repeat: -1
        });

        // Lina Animations (char1)
        this.anims.create({
            key: 'char1_run',
            frames: [{ key: 'char1_sheet' }],
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: 'char1_jump',
            frames: [{ key: 'char1_sheet' }],
            frameRate: 1,
            repeat: -1
        });

        // Enci Animations
        this.anims.create({
            key: 'enci_run',
            frames: [{ key: 'enci_sheet' }],
            frameRate: 12,
            repeat: -1
        });
    }
}
