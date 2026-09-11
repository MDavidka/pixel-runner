import * as Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    public isEnci: boolean = true;
    public baseSpeed: number = 220;
    private nameplate: Phaser.GameObjects.Text;
    private auraGlow: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'enci_sheet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 1.0);
        this.setDisplaySize(54, 98);

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setSize(30, 80);
            body.setOffset(20, 16);
            body.gravity.y = 1200;
        }

        this.auraGlow = scene.add.graphics().setDepth(5);

        this.nameplate = scene.add.text(x, y - 105, 'Enci', {
            fontSize: '11px',
            fontStyle: 'bold',
            fontFamily: 'monospace',
            color: '#ef4444',
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5, 0.5).setDepth(20);
    }

    public updateEnci(dt: number, targetSpeed: number, playerX: number, playerY: number, obstacles: Phaser.GameObjects.GameObject[]): void {
        this.setVelocityX(targetSpeed);

        const isGrounded = this.body?.blocked.down || this.body?.touching.down || false;

        // Obstacle hurdle awareness: if obstacle is close ahead (within 80px), jump over it
        for (const obj of obstacles) {
            const obs = obj as Phaser.Physics.Arcade.Sprite;
            if (obs.active && obs.x > this.x && (obs.x - this.x) < 85 && Math.abs(obs.y - this.y) < 40) {
                if (isGrounded) {
                    this.setVelocityY(-490);
                    break;
                }
            }
        }

        // Also jump if player is significantly higher on a platform
        if (isGrounded && playerY < (this.y - 45) && (playerX - this.x) < 140) {
            this.setVelocityY(-510);
        }

        if (this.anims.currentAnim?.key !== 'enci_run') {
            this.play('enci_run', true);
        }

        // Dark red menacing aura
        this.auraGlow.clear();
        this.auraGlow.fillStyle(0xef4444, 0.2 + Math.sin(performance.now() * 0.015) * 0.1);
        this.auraGlow.fillCircle(this.x, this.y - 40, 36);

        this.nameplate.setPosition(this.x, this.y - 105);
    }

    public getDistanceToPlayerMeters(playerX: number): number {
        const distPx = Math.max(0, playerX - this.x);
        return Math.round(distPx / 12);
    }

    public destroy(fromScene?: boolean): void {
        this.nameplate.destroy();
        this.auraGlow.destroy();
        super.destroy(fromScene);
    }
}
