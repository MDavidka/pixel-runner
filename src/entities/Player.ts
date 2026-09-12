import * as Phaser from 'phaser';
import { JumpController } from '../systems/JumpController';
import { AudioSystem } from '../systems/AudioSystem';
import { BaseSystem } from '../systems/BaseSystem';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public jumpController: JumpController;
    public baseSpeed: number = 240;
    public currentSpeed: number = 240;
    public isInvulnerable: boolean = false;
    private invulnTimer: number = 0;
    private nameplate: Phaser.GameObjects.Text;
    private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private audioSystem: AudioSystem;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'char2_sheet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.audioSystem = AudioSystem.getInstance();

        // Physics body setup
        this.setCollideWorldBounds(false);
        this.setOrigin(0.5, 1.0);
        this.setDisplaySize(48, 96);

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setSize(28, 80);
            body.setOffset(20, 16);
            body.setMaxVelocity(600, 900);
        }

        const perks = BaseSystem.getInstance().getBasePerks();
        this.jumpController = new JumpController(this, {
            jumpVelocity: -520 * (1 + perks.jumpBonus),
            maxJumps: perks.hasDoubleJump ? 2 : 1
        });

        // Jump audio & dust callbacks
        this.jumpController.onJump = () => {
            this.audioSystem.play('jump');
            this.spawnDust();
        };
        this.jumpController.onDoubleJump = () => {
            this.audioSystem.play('double_jump');
            this.spawnDust();
        };
        this.jumpController.onLand = () => {
            this.audioSystem.play('land');
            this.spawnDust();
            // Subtle landing squash
            scene.tweens.add({
                targets: this,
                scaleY: 0.9,
                scaleX: 1.1,
                duration: 60,
                yoyo: true,
                ease: 'Quad.easeInOut'
            });
        };
        this.jumpController.onDash = () => {
            this.audioSystem.play('dash');
        };

        // Nameplate text
        this.nameplate = scene.add.text(x, y - 105, 'Timi', {
            fontSize: '11px',
            fontStyle: 'bold',
            fontFamily: 'monospace',
            color: '#38bdf8',
            backgroundColor: 'rgba(2, 6, 23, 0.75)',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5, 0.5).setDepth(20);

        this.initDustParticles(scene);
    }

    private initDustParticles(scene: Phaser.Scene): void {
        if (!scene.textures.exists('particle_dust')) {
            const rt = scene.add.renderTexture(0, 0, 4, 4);
            const g = scene.add.graphics();
            g.fillStyle(0xd97706, 0.8);
            g.fillCircle(2, 2, 2);
            rt.draw(g);
            rt.saveTexture('particle_dust');
            rt.destroy();
            g.destroy();
        }

        this.dustEmitter = scene.add.particles(0, 0, 'particle_dust', {
            speed: { min: 20, max: 60 },
            angle: { min: 140, max: 220 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 350,
            gravityY: 100,
            emitting: false
        });
        this.dustEmitter.setDepth(15);
    }

    public spawnDust(): void {
        if (this.dustEmitter) {
            this.dustEmitter.emitParticleAt(this.x, this.y - 4, 6);
        }
    }

    public updatePlayer(dt: number, moveInput: number, isJumpPressed: boolean, isJumpJustDown: boolean, isJumpReleased: boolean, isSprint: boolean): void {
        const isGrounded = this.jumpController.getIsGrounded();
        const perks = BaseSystem.getInstance().getBasePerks();

        // Speed calculation
        let speed = this.baseSpeed;
        if (isSprint) speed *= 1.35;
        if (this.jumpController.getIsDashing()) speed *= 1.75;

        // Move horizontally
        let targetVx = speed;
        if (moveInput < 0) targetVx = speed * 0.45; // slowed down when holding left
        if (moveInput > 0) targetVx = speed * 1.15;

        this.setVelocityX(targetVx);
        this.currentSpeed = targetVx;

        // Jump controller update
        this.jumpController.update(dt, isJumpPressed, isJumpJustDown, isJumpReleased);

        // Update Animation
        if (!isGrounded) {
            if (this.anims.currentAnim?.key !== 'char2_jump') {
                this.play('char2_jump', true);
            }
        } else {
            if (this.anims.currentAnim?.key !== 'char2_run') {
                this.play('char2_run', true);
            }
        }

        // Invulnerability flicker
        if (this.isInvulnerable) {
            this.invulnTimer -= dt;
            this.setAlpha(Math.sin(performance.now() * 0.02) * 0.4 + 0.6);
            if (this.invulnTimer <= 0) {
                this.isInvulnerable = false;
                this.setAlpha(1.0);
            }
        }

        // Update nameplate position
        this.nameplate.setPosition(this.x, this.y - 105);
    }

    public hitObstacle(): void {
        if (this.isInvulnerable) return;
        this.isInvulnerable = true;
        this.invulnTimer = 1.2; // 1.2s invulnerability
        this.audioSystem.play('hit');
        this.setVelocityX(this.baseSpeed * 0.4); // brief speed loss
    }

    public destroy(fromScene?: boolean): void {
        this.nameplate.destroy();
        if (this.dustEmitter) this.dustEmitter.destroy();
        super.destroy(fromScene);
    }
}
