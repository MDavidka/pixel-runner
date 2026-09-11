import * as Phaser from 'phaser';

export class HUD {
    private scene: Phaser.Scene;
    private scoreText: Phaser.GameObjects.Text;
    private distText: Phaser.GameObjects.Text;
    private enciMeterText: Phaser.GameObjects.Text;
    private resText: Phaser.GameObjects.Text;
    private threatOverlay: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // Threat overlay for Enci close proximity (<30m)
        this.threatOverlay = scene.add.graphics().setDepth(40).setScrollFactor(0);

        // Top HUD Bar Container
        const hudBg = scene.add.graphics().setDepth(45).setScrollFactor(0);
        hudBg.fillStyle(0x020617, 0.85);
        hudBg.fillRoundedRect(12, 12, 936, 44, 10);
        hudBg.lineStyle(1, 0x38bdf8, 0.4);
        hudBg.strokeRoundedRect(12, 12, 936, 44, 10);

        this.scoreText = scene.add.text(26, 24, 'SCORE: 0', {
            fontSize: '15px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setDepth(46).setScrollFactor(0);

        this.distText = scene.add.text(200, 24, 'DIST: 0m', {
            fontSize: '15px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#facc15'
        }).setDepth(46).setScrollFactor(0);

        this.enciMeterText = scene.add.text(370, 24, 'ENCI: 35m', {
            fontSize: '15px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ef4444'
        }).setDepth(46).setScrollFactor(0);

        this.resText = scene.add.text(560, 24, '🪵0  🪨0  🌾0  💎0', {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setDepth(46).setScrollFactor(0);
    }

    public update(score: number, distMeters: number, enciDistMeters: number, resources: any): void {
        this.scoreText.setText(`SCORE: ${Math.round(score)}`);
        this.distText.setText(`DIST: ${distMeters}m`);
        this.enciMeterText.setText(`ENCI: ${enciDistMeters}m`);
        this.resText.setText(`🪵${resources.wood || 0}  🪨${resources.stone || 0}  🌾${resources.food || 0}  💎${resources.crystals || 0}`);

        // Red flashing threat overlay when Enci is within 30m
        this.threatOverlay.clear();
        if (enciDistMeters < 30) {
            const urgency = (30 - enciDistMeters) / 30.0;
            const flash = (Math.sin(performance.now() * 0.012) * 0.5 + 0.5) * urgency * 0.45;
            this.threatOverlay.fillStyle(0xef4444, flash);
            this.threatOverlay.fillRect(0, 0, 960, 540);
        }
    }
}
