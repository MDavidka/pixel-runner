import * as Phaser from 'phaser';

export interface JumpConfig {
    gravity: number;
    jumpVelocity: number;
    coyoteTimeMs: number;
    jumpBufferMs: number;
    maxJumps: number;
    dashDurationMs: number;
    dashSpeed: number;
}

export class JumpController {
    private sprite: Phaser.Physics.Arcade.Sprite;
    private config: JumpConfig;
    
    private coyoteTimer: number = 0;
    private jumpBufferTimer: number = 0;
    private jumpsRemaining: number = 1;
    private wasGrounded: boolean = true;
    private isDashing: boolean = false;
    private dashTimer: number = 0;
    private canDash: boolean = true;

    // Callbacks
    public onJump: (() => void) | null = null;
    public onDoubleJump: (() => void) | null = null;
    public onLand: (() => void) | null = null;
    public onDash: (() => void) | null = null;

    constructor(sprite: Phaser.Physics.Arcade.Sprite, config?: Partial<JumpConfig>) {
        this.sprite = sprite;
        this.config = Object.assign({
            gravity: 1200,
            jumpVelocity: -520,
            coyoteTimeMs: 140,
            jumpBufferMs: 160,
            maxJumps: 1,
            dashDurationMs: 180,
            dashSpeed: 450
        }, config);

        if (this.sprite.body) {
            this.sprite.body.gravity.y = this.config.gravity;
        }
    }

    public setMaxJumps(max: number): void {
        this.config.maxJumps = Math.max(1, max);
    }

    public update(dt: number, isJumpPressed: boolean, isJumpJustDown: boolean, isJumpReleased: boolean): void {
        const isGrounded = this.sprite.body?.blocked.down || this.sprite.body?.touching.down || false;

        // Grounding & Landing state change
        if (isGrounded) {
            this.coyoteTimer = this.config.coyoteTimeMs;
            this.jumpsRemaining = this.config.maxJumps;
            this.canDash = true;

            if (!this.wasGrounded) {
                // Landed this frame
                if (this.onLand) this.onLand();
            }
        } else {
            this.coyoteTimer = Math.max(0, this.coyoteTimer - dt * 1000);
        }

        // Jump buffering
        if (isJumpJustDown) {
            this.jumpBufferTimer = this.config.jumpBufferMs;
        } else {
            this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt * 1000);
        }

        // Execute Jump from buffer if conditions met
        if (this.jumpBufferTimer > 0) {
            if (isGrounded || this.coyoteTimer > 0) {
                this.executeJump(false);
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
            } else if (this.jumpsRemaining > 1) {
                // Mid-air double jump
                this.executeJump(true);
                this.jumpBufferTimer = 0;
            }
        }

        // Variable Jump Height: cut upward velocity if jump key is released early
        if (isJumpReleased && (this.sprite.body?.velocity.y || 0) < -120) {
            this.sprite.setVelocityY((this.sprite.body?.velocity.y || 0) * 0.45);
        }

        // Dash logic
        if (this.isDashing) {
            this.dashTimer -= dt * 1000;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }

        this.wasGrounded = isGrounded;
    }

    private executeJump(isDouble: boolean): void {
        this.sprite.setVelocityY(this.config.jumpVelocity);
        this.jumpsRemaining--;

        if (isDouble) {
            if (this.onDoubleJump) this.onDoubleJump();
        } else {
            if (this.onJump) this.onJump();
        }
    }

    public triggerDash(): boolean {
        if (!this.canDash || this.isDashing) return false;
        this.isDashing = true;
        this.canDash = false;
        this.dashTimer = this.config.dashDurationMs;
        if (this.onDash) this.onDash();
        return true;
    }

    public getIsDashing(): boolean {
        return this.isDashing;
    }

    public getIsGrounded(): boolean {
        return this.wasGrounded;
    }

    public getGravity(): number {
        return this.config.gravity;
    }

    public getJumpVelocity(): number {
        return this.config.jumpVelocity;
    }
}
