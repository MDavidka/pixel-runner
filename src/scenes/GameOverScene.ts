import * as Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioSystem } from '../systems/AudioSystem';

export interface GameOverData {
    score: number;
    distance: number;
    gatheredResources: Record<string, number>;
    isNewHighScore: boolean;
}

export class GameOverScene extends Phaser.Scene {
    private summaryData!: GameOverData;

    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data: GameOverData): void {
        this.summaryData = data;
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        AudioSystem.getInstance().play('gameover');

        // Dark dim backdrop
        const bg = this.add.graphics();
        bg.fillStyle(0x020617, 0.92);
        bg.fillRect(0, 0, width, height);

        // Summary Card
        const card = this.add.graphics();
        card.fillStyle(0x0f172a, 0.95);
        card.fillRoundedRect(width / 2 - 240, 50, 480, 380, 16);
        card.lineStyle(2, 0xef4444, 0.7);
        card.strokeRoundedRect(width / 2 - 240, 50, 480, 380, 16);

        this.add.text(width / 2, 85, 'EXPEDITION CONCLUDED', {
            fontSize: '26px',
            fontFamily: 'sans-serif',
            fontStyle: '900',
            color: '#ef4444'
        }).setOrigin(0.5, 0.5);

        this.add.text(width / 2, 115, 'Enci caught up with the expedition party!', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#94a3b8'
        }).setOrigin(0.5, 0.5);

        if (this.summaryData.isNewHighScore) {
            this.add.text(width / 2, 145, '⭐ NEW HIGH SCORE! ⭐', {
                fontSize: '15px',
                fontStyle: 'bold',
                color: '#facc15'
            }).setOrigin(0.5, 0.5);
        }

        // Stats Display
        this.add.text(width / 2, 185, `Final Score: ${Math.round(this.summaryData.score)}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setOrigin(0.5, 0.5);

        this.add.text(width / 2, 218, `Distance Traveled: ${this.summaryData.distance}m`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#facc15'
        }).setOrigin(0.5, 0.5);

        // Foraged Resources Breakdown
        let resSummary = 'Foraged: ';
        for (const [k, v] of Object.entries(this.summaryData.gatheredResources)) {
            if (v > 0) resSummary += `+${v} ${k}  `;
        }
        this.add.text(width / 2, 260, resSummary, {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#4ade80'
        }).setOrigin(0.5, 0.5);

        // Buttons
        const btnRetry = this.add.graphics();
        btnRetry.fillStyle(0x7c3aed, 1);
        btnRetry.fillRoundedRect(width / 2 - 160, 300, 320, 46, 23);
        btnRetry.lineStyle(1.5, 0xa855f7, 0.8);
        btnRetry.strokeRoundedRect(width / 2 - 160, 300, 320, 46, 23);

        this.add.text(width / 2, 323, '▶ TRY EXPEDITION AGAIN', {
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);

        const hitRetry = this.add.zone(width / 2, 323, 320, 46).setInteractive({ useHandCursor: true });
        hitRetry.on('pointerdown', () => {
            AudioSystem.getInstance().play('jump');
            this.scene.start('RunScene');
        });

        const btnBase = this.add.graphics();
        btnBase.fillStyle(0x1e293b, 1);
        btnBase.fillRoundedRect(width / 2 - 160, 360, 320, 44, 22);
        btnBase.lineStyle(1.5, 0x38bdf8, 0.8);
        btnBase.strokeRoundedRect(width / 2 - 160, 360, 320, 44, 22);

        this.add.text(width / 2, 382, '🏕️ RETURN TO CAMPSITE', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setOrigin(0.5, 0.5);

        const hitBase = this.add.zone(width / 2, 382, 320, 44).setInteractive({ useHandCursor: true });
        hitBase.on('pointerdown', () => {
            AudioSystem.getInstance().play('jump');
            this.scene.start('BaseScene');
        });
    }
}
