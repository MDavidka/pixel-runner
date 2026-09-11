import * as Phaser from 'phaser';

export type AnimalType = 'rabbit' | 'bird' | 'butterfly';

export class Animal extends Phaser.GameObjects.Graphics {
    public animalType: AnimalType;
    private vx: number = 0;
    private vy: number = 0;
    private animTime: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, type: AnimalType) {
        super(scene, { x, y });
        this.animalType = type;
        scene.add.existing(this);
        this.setDepth(12);

        if (type === 'rabbit') {
            this.vx = 40 + Math.random() * 30;
        } else if (type === 'bird') {
            this.vx = 140 + Math.random() * 60;
            this.vy = -10 + Math.random() * 20;
        } else if (type === 'butterfly') {
            this.vx = 30 + Math.random() * 20;
        }
    }

    public updateAnimal(dt: number, cameraX: number): void {
        this.animTime += dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.clear();

        if (this.animalType === 'rabbit') {
            const hop = Math.abs(Math.sin(this.animTime * 8)) * 10;
            this.fillStyle(0xe2e8f0, 1.0);
            this.fillEllipse(0, -hop, 8, 6);
            this.fillCircle(5, -hop - 3, 3); // Head
            this.fillRect(4, -hop - 9, 2, 6); // Ear
        } else if (this.animalType === 'bird') {
            const flap = Math.sin(this.animTime * 14) * 5;
            this.fillStyle(0x334155, 1.0);
            this.fillTriangle(-6, flap, 0, 0, 6, flap);
        } else if (this.animalType === 'butterfly') {
            const flutter = Math.sin(this.animTime * 18) * 4;
            this.fillStyle(0xf472b6, 0.9);
            this.fillCircle(-2, flutter, 3);
            this.fillCircle(2, flutter, 3);
        }

        // Recycle if far behind camera
        if (this.x < cameraX - 200) {
            this.x = cameraX + 1100 + Math.random() * 300;
        }
    }
}
