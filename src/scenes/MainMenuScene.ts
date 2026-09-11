import * as Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioSystem } from '../systems/AudioSystem';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const save = SaveSystem.getInstance().getData();

        // Serene Mountain Sky Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbbe6fd, 0xbbe6fd, 1);
        bg.fillRect(0, 0, width, height);

        // Distant Mountains
        bg.fillStyle(0x64748b, 0.9);
        bg.beginPath();
        bg.moveTo(0, height - 110);
        bg.lineTo(width * 0.25, height - 260);
        bg.lineTo(width * 0.5, height - 110);
        bg.lineTo(width * 0.75, height - 280);
        bg.lineTo(width, height - 110);
        bg.closePath();
        bg.fill();

        // Valley ground
        bg.fillStyle(0x84cc16, 1);
        bg.fillRect(0, height - 110, width, 14);
        bg.fillStyle(0x78350f, 1);
        bg.fillRect(0, height - 96, width, 96);

        // Characters preview
        this.add.image(width * 0.35, height - 150, 'char2_sheet').setDisplaySize(48, 96).setOrigin(0.5, 0.5);
        this.add.image(width * 0.42, height - 146, 'char1_sheet').setDisplaySize(46, 92).setOrigin(0.5, 0.5);

        // Menu Overlay Container
        const card = this.add.graphics();
        card.fillStyle(0x020617, 0.88);
        card.fillRoundedRect(width / 2 - 270, 45, 540, 380, 16);
        card.lineStyle(2, 0x38bdf8, 0.6);
        card.strokeRoundedRect(width / 2 - 270, 45, 540, 380, 16);

        this.add.text(width / 2, 85, 'VALLEY EXPEDITION', {
            fontSize: '32px',
            fontFamily: 'sans-serif',
            fontStyle: '900',
            color: '#38bdf8'
        }).setOrigin(0.5, 0.5);

        this.add.text(width / 2, 120, 'ESCAPE FROM ENCI', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ef4444'
        }).setOrigin(0.5, 0.5);

        this.add.text(width / 2, 160, 'Forage timber & crystals across 8 valley biomes,\nleap across river gaps, and expand your campsite\nbefore Enci catches you!', {
            fontSize: '13px',
            fontFamily: 'sans-serif',
            color: '#94a3b8',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5, 0.5);

        this.add.text(width / 2, 220, `🏆 Best Score: ${Math.round(save.highScore)}  •  🏔️ Best Dist: ${save.bestDistance}m`, {
            fontSize: '13px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#facc15'
        }).setOrigin(0.5, 0.5);

        // Start Expedition Button
        const btnPlay = this.add.graphics();
        btnPlay.fillStyle(0x7c3aed, 1);
        btnPlay.fillRoundedRect(width / 2 - 160, 260, 320, 50, 25);
        btnPlay.lineStyle(2, 0xa855f7, 0.9);
        btnPlay.strokeRoundedRect(width / 2 - 160, 260, 320, 50, 25);

        const playText = this.add.text(width / 2, 285, '▶ START EXPEDITION', {
            fontSize: '17px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);

        const hitPlay = this.add.zone(width / 2, 285, 320, 50).setInteractive({ useHandCursor: true });
        hitPlay.on('pointerdown', () => {
            AudioSystem.getInstance().init();
            AudioSystem.getInstance().play('jump');
            this.scene.start('RunScene');
        });

        // Campsite Button
        const btnBase = this.add.graphics();
        btnBase.fillStyle(0x1e293b, 0.95);
        btnBase.fillRoundedRect(width / 2 - 160, 330, 320, 48, 24);
        btnBase.lineStyle(1.5, 0x38bdf8, 0.8);
        btnBase.strokeRoundedRect(width / 2 - 160, 330, 320, 48, 24);

        const baseText = this.add.text(width / 2, 354, '🏕️ CAMPSITE & BASE', {
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setOrigin(0.5, 0.5);

        const hitBase = this.add.zone(width / 2, 354, 320, 48).setInteractive({ useHandCursor: true });
        hitBase.on('pointerdown', () => {
            AudioSystem.getInstance().init();
            AudioSystem.getInstance().play('jump');
            this.scene.start('BaseScene');
        });

        // Safe area keyboard hints
        this.add.text(width / 2, height - 25, '[A / D] Move  •  [Space / W] Jump  •  [Shift] Sprint', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.7)'
        }).setOrigin(0.5, 0.5);
    }
}
