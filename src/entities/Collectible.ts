import * as Phaser from 'phaser';
import { ResourceType, ITEMS } from '../data/items';

export class Collectible extends Phaser.Physics.Arcade.Sprite {
    public resourceType: ResourceType = 'wood';
    private initialY: number = 0;
    private bobTime: number = 0;
    private isCollected: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, type: ResourceType) {
        super(scene, x, y, `res_${type}`);
        this.resourceType = type;
        this.initialY = y;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static trigger body

        this.setDisplaySize(24, 24);
        this.setOrigin(0.5, 0.5);

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.StaticBody;
            body.setSize(26, 26);
            body.setOffset(-1, -1);
        }
    }

    public reset(x: number, y: number, type: ResourceType): void {
        this.resourceType = type;
        this.initialY = y;
        this.setTexture(`res_${type}`);
        this.setPosition(x, y);
        this.setDisplaySize(24, 24);
        this.setActive(true);
        this.setVisible(true);
        this.isCollected = false;
        this.bobTime = Math.random() * Math.PI * 2;

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.StaticBody;
            body.position.x = x - 13;
            body.position.y = y - 13;
        }
    }

    public updateBob(dt: number): void {
        if (!this.active || this.isCollected) return;
        this.bobTime += dt * 3;
        this.y = this.initialY + Math.sin(this.bobTime) * 6;
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.StaticBody).position.y = this.y - 13;
        }
    }

    public attractTowards(targetX: number, targetY: number, speed: number, dt: number): void {
        if (!this.active || this.isCollected) return;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            this.x += (dx / dist) * speed * dt;
            this.y += (dy / dist) * speed * dt;
            this.initialY = this.y;
            if (this.body) {
                (this.body as Phaser.Physics.Arcade.StaticBody).position.x = this.x - 13;
                (this.body as Phaser.Physics.Arcade.StaticBody).position.y = this.y - 13;
            }
        }
    }
}
