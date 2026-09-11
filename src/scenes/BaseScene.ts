import * as Phaser from 'phaser';
import { BaseSystem } from '../systems/BaseSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { BUILDINGS } from '../data/buildings';
import { AudioSystem } from '../systems/AudioSystem';

export class BaseScene extends Phaser.Scene {
    private baseSystem: BaseSystem;
    private resourceSystem: ResourceSystem;
    private resText!: Phaser.GameObjects.Text;
    private buildingContainers: Phaser.GameObjects.Container[] = [];

    constructor() {
        super({ key: 'BaseScene' });
        this.baseSystem = BaseSystem.getInstance();
        this.resourceSystem = ResourceSystem.getInstance();
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const GROUND_Y = 430;

        // 1. Serene Valley Sky
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbae6fd, 0xbae6fd, 1);
        bg.fillRect(0, 0, width, height);

        // Distant Mountains
        bg.fillStyle(0x64748b, 0.9);
        bg.beginPath();
        bg.moveTo(0, GROUND_Y);
        bg.lineTo(240, 220);
        bg.lineTo(480, GROUND_Y);
        bg.lineTo(720, 240);
        bg.lineTo(960, GROUND_Y);
        bg.closePath();
        bg.fill();

        // Valley ground
        bg.fillStyle(0x65a30d, 1);
        bg.fillRect(0, GROUND_Y, width, 12);
        bg.fillStyle(0x365314, 1);
        bg.fillRect(0, GROUND_Y + 12, width, 20);
        bg.fillStyle(0x78350f, 1);
        bg.fillRect(0, GROUND_Y + 32, width, height - GROUND_Y - 32);

        // 2. Animated Campfire
        const fire = this.add.circle(480, GROUND_Y - 14, 14, 0xf97316);
        const innerFire = this.add.circle(480, GROUND_Y - 12, 7, 0xfde047);
        this.tweens.add({
            targets: [fire, innerFire],
            scaleX: 1.25,
            scaleY: 1.35,
            yoyo: true,
            repeat: -1,
            duration: 250,
            ease: 'Sine.easeInOut'
        });

        // 3. Main Shelter & Cabin
        const shelterLvl = this.baseSystem.getBuildingLevel('shelter');
        const shelterG = this.add.graphics();
        shelterG.fillStyle(0x78350f, 1);
        shelterG.fillRect(80, GROUND_Y - 130, 180, 130);
        shelterG.fillStyle(0xb45309, 1);
        shelterG.fillTriangle(60, GROUND_Y - 130, 170, GROUND_Y - 200, 280, GROUND_Y - 130);
        shelterG.fillStyle(0xfef08a, 1); // Window
        shelterG.fillRect(145, GROUND_Y - 80, 30, 30);
        this.add.text(170, GROUND_Y - 150, `CABIN (Lv.${shelterLvl})`, { fontSize: '12px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5, 0.5);

        // 4. Workshop
        const workshopLvl = this.baseSystem.getBuildingLevel('workshop');
        if (workshopLvl > 0) {
            const wsG = this.add.graphics();
            wsG.fillStyle(0x92400e, 1);
            wsG.fillRect(300, GROUND_Y - 110, 130, 110);
            wsG.fillStyle(0xb45309, 1);
            wsG.fillTriangle(290, GROUND_Y - 110, 365, GROUND_Y - 160, 440, GROUND_Y - 110);
            this.add.text(365, GROUND_Y - 125, `WORKSHOP (Lv.${workshopLvl})`, { fontSize: '11px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5, 0.5);
        }

        // 5. Farm
        const farmLvl = this.baseSystem.getBuildingLevel('farm');
        if (farmLvl > 0) {
            const farmG = this.add.graphics();
            farmG.fillStyle(0x15803d, 1);
            farmG.fillRect(530, GROUND_Y - 90, 140, 90);
            this.add.text(600, GROUND_Y - 105, `FARM (Lv.${farmLvl})`, { fontSize: '11px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5, 0.5);
        }

        // 6. Characters resting at camp
        this.add.image(220, GROUND_Y - 50, 'char2_sheet').setDisplaySize(48, 96).setOrigin(0.5, 0.5);
        this.add.image(420, GROUND_Y - 48, 'char1_sheet').setDisplaySize(46, 92).setOrigin(0.5, 0.5);

        // Top Resource Bar
        const topBar = this.add.graphics().setDepth(30);
        topBar.fillStyle(0x020617, 0.9);
        topBar.fillRoundedRect(16, 12, 928, 44, 10);
        topBar.lineStyle(1.5, 0x38bdf8, 0.6);
        topBar.strokeRoundedRect(16, 12, 928, 44, 10);

        this.resText = this.add.text(30, 24, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setDepth(31);

        this.updateResourceDisplay();

        // Building Cards Grid in Top Half
        this.renderBuildingCards();

        // Back to Run Button
        const btnRun = this.add.graphics().setDepth(30);
        btnRun.fillStyle(0x7c3aed, 1);
        btnRun.fillRoundedRect(width / 2 - 140, height - 70, 280, 48, 24);
        btnRun.lineStyle(2, 0xa855f7, 0.9);
        btnRun.strokeRoundedRect(width / 2 - 140, height - 70, 280, 48, 24);

        this.add.text(width / 2, height - 46, '▶ START EXPEDITION', {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5).setDepth(31);

        const hitRun = this.add.zone(width / 2, height - 46, 280, 48).setInteractive({ useHandCursor: true }).setDepth(32);
        hitRun.on('pointerdown', () => {
            AudioSystem.getInstance().play('jump');
            this.scene.start('RunScene');
        });
    }

    private updateResourceDisplay(): void {
        const res = this.resourceSystem.getAll();
        this.resText.setText(`🪵 Wood: ${res.wood}   🪨 Stone: ${res.stone}   🌾 Food: ${res.food}   ⚙️ Metal: ${res.metal}   💎 Crystals: ${res.crystals}`);
    }

    private renderBuildingCards(): void {
        this.buildingContainers.forEach(c => c.destroy());
        this.buildingContainers = [];

        const buildings = ['campfire', 'shelter', 'workshop', 'farm', 'watchtower'];
        const cardW = 175;
        const startX = 35;
        const startY = 70;

        buildings.forEach((id, idx) => {
            const config = BUILDINGS[id];
            const lvl = this.baseSystem.getBuildingLevel(id);
            const cost = this.baseSystem.getNextUpgradeCost(id);
            const canAfford = this.baseSystem.canUpgrade(id);

            const container = this.add.container(startX + idx * (cardW + 10), startY).setDepth(30);

            const bg = this.add.graphics();
            bg.fillStyle(0x0b1329, 0.92);
            bg.fillRoundedRect(0, 0, cardW, 140, 8);
            bg.lineStyle(1.5, canAfford ? 0x84cc16 : 0x475569, 0.8);
            bg.strokeRoundedRect(0, 0, cardW, 140, 8);
            container.add(bg);

            const title = this.add.text(cardW / 2, 16, `${config.icon} ${config.name}`, {
                fontSize: '12px',
                fontStyle: 'bold',
                color: '#ffffff'
            }).setOrigin(0.5, 0.5);
            container.add(title);

            const lvlText = this.add.text(cardW / 2, 34, `Level ${lvl} / ${config.maxLevel}`, {
                fontSize: '11px',
                color: '#38bdf8'
            }).setOrigin(0.5, 0.5);
            container.add(lvlText);

            // Cost summary
            let costStr = 'MAX LEVEL';
            if (cost) {
                costStr = Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(', ');
            }
            const costText = this.add.text(cardW / 2, 58, costStr, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#facc15',
                align: 'center',
                wordWrap: { width: cardW - 10 }
            }).setOrigin(0.5, 0.5);
            container.add(costText);

            if (cost) {
                const btnUpgrade = this.add.graphics();
                btnUpgrade.fillStyle(canAfford ? 0x84cc16 : 0x334155, 1);
                btnUpgrade.fillRoundedRect(14, 90, cardW - 28, 34, 6);
                container.add(btnUpgrade);

                const btnText = this.add.text(cardW / 2, 107, canAfford ? 'UPGRADE' : 'LOCKED', {
                    fontSize: '11px',
                    fontStyle: 'bold',
                    color: canAfford ? '#022c22' : '#94a3b8'
                }).setOrigin(0.5, 0.5);
                container.add(btnText);

                if (canAfford) {
                    const hit = this.add.zone(cardW / 2, 107, cardW - 28, 34).setInteractive({ useHandCursor: true });
                    hit.on('pointerdown', () => {
                        if (this.baseSystem.upgradeBuilding(id)) {
                            this.updateResourceDisplay();
                            this.renderBuildingCards();
                        }
                    });
                    container.add(hit);
                }
            }

            this.buildingContainers.push(container);
        });
    }
}
