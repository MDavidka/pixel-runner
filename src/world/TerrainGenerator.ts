import * as Phaser from 'phaser';

export class TerrainGenerator {
    private scene: Phaser.Scene;
    public groundGroup: Phaser.Physics.Arcade.StaticGroup;
    public platformGroup: Phaser.Physics.Arcade.StaticGroup;
    private groundGraphics: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.groundGroup = scene.physics.add.staticGroup();
        this.platformGroup = scene.physics.add.staticGroup();
        this.groundGraphics = scene.add.graphics().setDepth(8);
    }

    public createGroundSegment(x: number, y: number, width: number, height: number = 120, grassColor: number = 0x84cc16, dirtColor: number = 0x78350f): Phaser.Physics.Arcade.Image {
        // Create an invisible static physics body
        const ground = this.groundGroup.create(x + width / 2, y + height / 2, 'tex_blank') as Phaser.Physics.Arcade.Image;
        ground.setDisplaySize(width, height);
        ground.setVisible(false);
        ground.refreshBody();
        return ground;
    }

    public createPlatform(x: number, y: number, width: number, height: number = 20, isWooden: boolean = true): Phaser.Physics.Arcade.Image {
        const platform = this.platformGroup.create(x + width / 2, y + height / 2, isWooden ? 'tex_bridge' : 'tex_stone') as Phaser.Physics.Arcade.Image;
        platform.setDisplaySize(width, height);
        platform.setVisible(true);
        platform.setDepth(9);
        platform.refreshBody();
        return platform;
    }

    public clear(): void {
        this.groundGroup.clear(true, true);
        this.platformGroup.clear(true, true);
        this.groundGraphics.clear();
    }
}
