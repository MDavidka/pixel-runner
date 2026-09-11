import * as Phaser from 'phaser';

export class MobileControls {
    private scene: Phaser.Scene;
    public moveInput: number = 0;
    public isJumpPressed: boolean = false;
    public isJumpJustDown: boolean = false;
    public isJumpReleased: boolean = false;
    public isSprint: boolean = false;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW!: Phaser.Input.Keyboard.Key;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private keySpace!: Phaser.Input.Keyboard.Key;
    private keyShift!: Phaser.Input.Keyboard.Key;

    private wasJumpDown: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initKeyboard();
        this.initTouchButtons();
        this.initSwipeGestures();
    }

    private initKeyboard(): void {
        if (!this.scene.input.keyboard) return;
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyShift = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    private initTouchButtons(): void {
        // Left Button
        const btnLeft = this.scene.add.circle(60, 470, 36, 0x0f172a, 0.75)
            .setStrokeStyle(2, 0x38bdf8, 0.6)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(50);
        this.scene.add.text(60, 470, '◀', { fontSize: '20px', color: '#ffffff' })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(51);

        btnLeft.on('pointerdown', () => { this.moveInput = -1; });
        btnLeft.on('pointerup', () => { if (this.moveInput === -1) this.moveInput = 0; });
        btnLeft.on('pointerout', () => { if (this.moveInput === -1) this.moveInput = 0; });

        // Right Button
        const btnRight = this.scene.add.circle(150, 470, 36, 0x0f172a, 0.75)
            .setStrokeStyle(2, 0x38bdf8, 0.6)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(50);
        this.scene.add.text(150, 470, '▶', { fontSize: '20px', color: '#ffffff' })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(51);

        btnRight.on('pointerdown', () => { this.moveInput = 1; });
        btnRight.on('pointerup', () => { if (this.moveInput === 1) this.moveInput = 0; });
        btnRight.on('pointerout', () => { if (this.moveInput === 1) this.moveInput = 0; });

        // Run/Sprint Button
        const btnRun = this.scene.add.circle(810, 470, 36, 0xec4899, 0.75)
            .setStrokeStyle(2, 0xf472b6, 0.7)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(50);
        this.scene.add.text(810, 470, 'RUN', { fontSize: '13px', fontStyle: 'bold', color: '#ffffff' })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(51);

        btnRun.on('pointerdown', () => { this.isSprint = true; });
        btnRun.on('pointerup', () => { this.isSprint = false; });
        btnRun.on('pointerout', () => { this.isSprint = false; });

        // Jump Button
        const btnJump = this.scene.add.circle(900, 470, 38, 0x06b6d4, 0.8)
            .setStrokeStyle(2, 0x22d3ee, 0.8)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(50);
        this.scene.add.text(900, 470, '▲', { fontSize: '24px', fontStyle: 'bold', color: '#ffffff' })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(51);

        btnJump.on('pointerdown', () => { this.isJumpPressed = true; });
        btnJump.on('pointerup', () => { this.isJumpPressed = false; });
        btnJump.on('pointerout', () => { this.isJumpPressed = false; });
    }

    private initSwipeGestures(): void {
        let touchStartY = 0;
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.x > 200 && pointer.x < 750) {
                touchStartY = pointer.y;
            }
        });

        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (pointer.x > 200 && pointer.x < 750) {
                const dy = pointer.y - touchStartY;
                if (dy < -40) {
                    // Swipe up -> Jump
                    this.isJumpPressed = true;
                    setTimeout(() => { this.isJumpPressed = false; }, 180);
                }
            }
        });
    }

    public update(): void {
        // Read Keyboard
        let kMove = 0;
        if (this.cursors.left?.isDown || this.keyA?.isDown) kMove = -1;
        if (this.cursors.right?.isDown || this.keyD?.isDown) kMove = 1;
        if (kMove !== 0) this.moveInput = kMove;

        const kJump = this.cursors.up?.isDown || this.keyW?.isDown || this.keySpace?.isDown;
        const kSprint = this.cursors.shift?.isDown || this.keyShift?.isDown;

        const isJumpCurrent = this.isJumpPressed || kJump;
        this.isJumpJustDown = isJumpCurrent && !this.wasJumpDown;
        this.isJumpReleased = !isJumpCurrent && this.wasJumpDown;
        this.wasJumpDown = isJumpCurrent;

        if (kSprint) this.isSprint = true;
    }
}
