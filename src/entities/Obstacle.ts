import * as Phaser from 'phaser';
import { ObstacleType } from '../data/obstacles';

export class Obstacle extends Phaser.Physics.Arcade.Sprite {
    public obstacleType: ObstacleType;

    constructor(scene: Phaser.Scene, x: number, y: number, type: ObstacleType, width: number, height: number, hitboxW: number, hitboxH: number) {
        super(scene, x, y, `obs_${type}`);
        this.obstacleType = type;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body

        this.setDisplaySize(width, height);
        this.setOrigin(0.5, 1.0);

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.StaticBody;
            body.setSize(hitboxW, hitboxH);
            body.setOffset((width - hitboxW) / 2, height - hitboxH);
        }
    }

    public reset(x: number, y: number, type: ObstacleType, width: number, height: number, hitboxW: number, hitboxH: number): void {
        this.obstacleType = type;
        this.setTexture(`obs_${type}`);
        this.setPosition(x, y);
        this.setDisplaySize(width, height);
        this.setActive(true);
        this.setVisible(true);

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.StaticBody;
            body.setSize(hitboxW, hitboxH);
            body.setOffset((width - hitboxW) / 2, height - hitboxH);
            body.position.x = x - hitboxW / 2;
            body.position.y = y - hitboxH;
        }
    }
}
