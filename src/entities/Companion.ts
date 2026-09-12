import * as Phaser from 'phaser';

export class Companion extends Phaser.Physics.Arcade.Sprite {
    private nameplate: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'char1_sheet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 1.0);
        this.setDisplaySize(48, 96);

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setSize(26, 78);
            body.setOffset(20, 16);
            body.gravity.y = 1200;
        }

        this.nameplate = scene.add.text(x, y - 105, 'Lina', {
            fontSize: '11px',
            fontStyle: 'bold',
            fontFamily: 'monospace',
            color: '#a855f7',
            backgroundColor: 'rgba(2, 6, 23, 0.75)',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5, 0.5).setDepth(20);
    }

    public updateCompanion(dt: number, playerX: number, playerY: number, playerVx: number, isPlayerJumping: boolean): void {
        const targetX = playerX - 56;
        const dx = targetX - this.x;
        const targetVx = playerVx + dx * 3.5;

        this.setVelocityX(targetVx);

        const isGrounded = this.body?.blocked.down || this.body?.touching.down || false;

        // Follow player jumps
        if (isPlayerJumping && isGrounded && dx > -80) {
            this.setVelocityY(-500);
        }

        if (!isGrounded) {
            if (this.anims.currentAnim?.key !== 'char1_jump') {
                this.play('char1_jump', true);
            }
        } else {
            if (this.anims.currentAnim?.key !== 'char1_run') {
                this.play('char1_run', true);
            }
        }

        this.nameplate.setPosition(this.x, this.y - 105);
    }

    public destroy(fromScene?: boolean): void {
        this.nameplate.destroy();
        super.destroy(fromScene);
    }
}
