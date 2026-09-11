// Pixel Runner Game Engine
// Ultra lightweight HTML5 Canvas Engine with Sprite Animation & Mobile Controls

(function() {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Disable smoothing for sharp pixel art
    ctx.imageSmoothingEnabled = false;

    // Viewport Virtual Dimensions (16:9 pixel art native resolution)
    const V_WIDTH = 960;
    const V_HEIGHT = 540;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(canvas.width / V_WIDTH, canvas.height / V_HEIGHT);
        ctx.imageSmoothingEnabled = false;
    }
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    // Asset Loader
    const assets = {
        background: new Image(),
        char1_sheet: new Image(),
        char2_sheet: new Image()
    };

    assets.background.src = '/assets/background.png';
    assets.char1_sheet.src = '/assets/char1_sheet.png';
    assets.char2_sheet.src = '/assets/char2_sheet.png';

    // Animation Definitions
    const CHARACTERS = {
        1: {
            name: "Lina (Glasses)",
            sheet: assets.char1_sheet,
            scale: 0.9,
            // Frame bounding boxes: [x, y, w, h]
            animations: {
                idle: [
                    [10, 35, 75, 160], [85, 35, 75, 160], [160, 35, 75, 160], [235, 35, 75, 160]
                ],
                walk: [
                    [320, 35, 70, 160], [389, 35, 70, 160], [458, 35, 70, 160], [527, 35, 70, 160],
                    [596, 35, 70, 160], [665, 35, 75, 160], [740, 35, 70, 160], [810, 35, 70, 160],
                    [880, 35, 70, 160], [950, 35, 70, 160]
                ],
                run: [
                    [10, 220, 100, 165], [108, 220, 100, 165], [206, 220, 100, 165], [304, 220, 100, 165],
                    [402, 220, 100, 165], [500, 220, 100, 165], [598, 220, 100, 165], [696, 220, 100, 165],
                    [794, 220, 100, 165], [892, 220, 100, 165]
                ],
                jump: [
                    [10, 410, 75, 145], [85, 410, 75, 145], [155, 400, 80, 155],
                    [235, 400, 80, 155], [315, 415, 70, 140], [385, 415, 75, 140]
                ],
                hurt: [
                    [685, 560, 90, 120], [780, 560, 90, 120], [875, 560, 90, 120]
                ],
                dead: [
                    [555, 415, 75, 140], [630, 415, 120, 140], [745, 450, 130, 105], [870, 450, 130, 105]
                ]
            }
        },
        2: {
            name: "Maya (Bucket Hat)",
            sheet: assets.char2_sheet,
            scale: 0.9,
            animations: {
                idle: [
                    [25, 35, 85, 160], [140, 35, 85, 160], [255, 35, 85, 160], [370, 35, 85, 160]
                ],
                walk: [
                    [15, 200, 110, 160], [140, 200, 110, 160], [265, 200, 110, 160], [390, 200, 110, 160],
                    [515, 200, 110, 160], [640, 200, 110, 160], [765, 200, 110, 160], [890, 200, 110, 160]
                ],
                run: [
                    [10, 370, 125, 160], [135, 370, 125, 160], [260, 370, 125, 160], [385, 370, 125, 160],
                    [510, 370, 125, 160], [635, 370, 125, 160], [760, 370, 125, 160], [885, 370, 125, 160]
                ],
                jump: [
                    [510, 370, 125, 160], [635, 370, 125, 160]
                ],
                hurt: [
                    [10, 370, 125, 160]
                ],
                dead: [
                    [20, 545, 120, 130], [145, 545, 130, 130], [275, 550, 140, 125],
                    [420, 570, 140, 105], [565, 570, 150, 105], [730, 575, 180, 100]
                ]
            }
        }
    };

    // Sound Synthesizer via Web Audio API (Zero audio assets required, ultra-lightweight)
    let audioCtx = null;
    function playSound(type) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            const now = audioCtx.currentTime;
            if (type === 'jump') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'coin') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(1200, now + 0.08);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'hurt') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            }
        } catch(e) {}
    }

    // Input Management (Keyboard + Touch D-Pad)
    const input = {
        left: false,
        right: false,
        jump: false,
        run: false
    };

    window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = true;
        if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = true;
        if (e.code === 'ArrowUp' || e.code === 'Space' || e.key === 'w' || e.key === 'W') {
            if (!input.jump) {
                player.requestJump();
            }
            input.jump = true;
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'j' || e.key === 'J') input.run = true;
        if (e.key === '1') switchCharacter(1);
        if (e.key === '2') switchCharacter(2);
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = false;
        if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = false;
        if (e.code === 'ArrowUp' || e.code === 'Space' || e.key === 'w' || e.key === 'W') input.jump = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'j' || e.key === 'J') input.run = false;
    });

    // Mobile Virtual Touch Setup
    function setupTouchControls() {
        const bindBtn = (id, key, isTap = false) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                input[key] = true;
                if (isTap && key === 'jump') player.requestJump();
                el.classList.add('active');
            }, { passive: false });
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                input[key] = false;
                el.classList.remove('active');
            }, { passive: false });
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input[key] = true;
                if (isTap && key === 'jump') player.requestJump();
                el.classList.add('active');
            });
            el.addEventListener('mouseup', (e) => {
                e.preventDefault();
                input[key] = false;
                el.classList.remove('active');
            });
        };

        bindBtn('btn-left', 'left');
        bindBtn('btn-right', 'right');
        bindBtn('btn-jump', 'jump', true);
        bindBtn('btn-run', 'run');
    }

    // World & Level Geometry
    const GROUND_Y = 425; // Surface of the grass line in background image
    const WORLD_WIDTH = 3072; // 3 screens wide loopable area

    // Floating Platforms & Coins
    const platforms = [
        { x: 280, y: 320, w: 140, h: 20 },
        { x: 520, y: 240, w: 160, h: 20 },
        { x: 780, y: 310, w: 150, h: 20 },
        { x: 1100, y: 260, w: 160, h: 20 },
        { x: 1350, y: 330, w: 130, h: 20 },
        { x: 1600, y: 230, w: 180, h: 20 },
        { x: 1900, y: 300, w: 150, h: 20 },
        { x: 2200, y: 240, w: 170, h: 20 },
        { x: 2500, y: 310, w: 160, h: 20 },
        { x: 2800, y: 250, w: 140, h: 20 }
    ];

    // Collectible Gems / Stars
    let collectibles = [];
    function resetCollectibles() {
        collectibles = [
            { x: 340, y: 270, collected: false },
            { x: 590, y: 190, collected: false },
            { x: 840, y: 260, collected: false },
            { x: 1170, y: 210, collected: false },
            { x: 1400, y: 280, collected: false },
            { x: 1680, y: 180, collected: false },
            { x: 1960, y: 250, collected: false },
            { x: 2270, y: 190, collected: false },
            { x: 2570, y: 260, collected: false },
            { x: 2860, y: 200, collected: false },
            // Ground coins
            { x: 400, y: GROUND_Y - 20, collected: false },
            { x: 950, y: GROUND_Y - 20, collected: false },
            { x: 1500, y: GROUND_Y - 20, collected: false },
            { x: 2050, y: GROUND_Y - 20, collected: false }
        ];
    }
    resetCollectibles();

    // Player State
    let selectedCharId = 1;
    let score = 0;

    const player = {
        x: 100,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        width: 48,
        height: 90,
        grounded: true,
        facing: 1, // 1 = right, -1 = left
        currentAnim: 'idle',
        frameIndex: 0,
        frameTimer: 0,
        frameSpeed: 0.1, // seconds per frame

        requestJump() {
            if (this.grounded) {
                this.vy = -13.5;
                this.grounded = false;
                playSound('jump');
            }
        },

        update(dt) {
            // Horizontal Physics
            const moveSpeed = input.run ? 340 : 200;
            const accel = 1800;
            const friction = 1400;

            if (input.left) {
                this.vx = Math.max(this.vx - accel * dt, -moveSpeed);
                this.facing = -1;
            } else if (input.right) {
                this.vx = Math.min(this.vx + accel * dt, moveSpeed);
                this.facing = 1;
            } else {
                if (this.vx > 0) this.vx = Math.max(0, this.vx - friction * dt);
                else if (this.vx < 0) this.vx = Math.min(0, this.vx + friction * dt);
            }

            // Gravity & Vertical Physics
            const gravity = 32;
            this.vy += gravity * dt * 60;
            if (this.vy > 18) this.vy = 18;

            this.x += this.vx * dt;
            this.y += this.vy;

            // Platform and Ground Collisions
            this.grounded = false;

            // Ground plane
            if (this.y >= GROUND_Y) {
                this.y = GROUND_Y;
                this.vy = 0;
                this.grounded = true;
            }

            // Check Floating Platforms (one-way pass-through from below)
            const feetX = this.x;
            const feetY = this.y;
            const prevFeetY = this.y - this.vy;

            for (const p of platforms) {
                if (feetX + 20 > p.x && feetX - 20 < p.x + p.w) {
                    if (prevFeetY <= p.y + 4 && feetY >= p.y && this.vy >= 0) {
                        this.y = p.y;
                        this.vy = 0;
                        this.grounded = true;
                    }
                }
            }

            // Seamless World Looping
            if (this.x < 0) this.x += WORLD_WIDTH;
            if (this.x >= WORLD_WIDTH) this.x -= WORLD_WIDTH;

            // Collectibles Check
            for (const item of collectibles) {
                if (!item.collected) {
                    const dx = Math.abs(this.x - item.x);
                    const dy = Math.abs((this.y - this.height / 2) - item.y);
                    if (dx < 35 && dy < 45) {
                        item.collected = true;
                        score += 100;
                        playSound('coin');
                        document.getElementById('score-display').innerText = score;
                    }
                }
            }

            // Determine Animation State
            let targetAnim = 'idle';
            if (!this.grounded) {
                targetAnim = 'jump';
            } else if (Math.abs(this.vx) > 10) {
                targetAnim = input.run ? 'run' : 'walk';
            }

            if (targetAnim !== this.currentAnim) {
                this.currentAnim = targetAnim;
                this.frameIndex = 0;
                this.frameTimer = 0;
            }

            // Advance Frame
            const animFrames = CHARACTERS[selectedCharId].animations[this.currentAnim] || CHARACTERS[selectedCharId].animations.idle;
            const speedMultiplier = this.currentAnim === 'run' ? 0.06 : (this.currentAnim === 'walk' ? 0.08 : 0.16);

            this.frameTimer += dt;
            if (this.frameTimer >= speedMultiplier) {
                this.frameTimer = 0;
                this.frameIndex = (this.frameIndex + 1) % animFrames.length;
            }
        },

        render(cameraX) {
            const charData = CHARACTERS[selectedCharId];
            const anim = charData.animations[this.currentAnim] || charData.animations.idle;
            const frame = anim[this.frameIndex % anim.length];
            if (!frame) return;

            const [fx, fy, fw, fh] = frame;
            const renderW = fw * 0.7;
            const renderH = fh * 0.7;

            ctx.save();
            // Translate to player feet position relative to camera
            ctx.translate(this.x - cameraX, this.y);
            if (this.facing === -1) {
                ctx.scale(-1, 1);
            }

            // Draw Sprite anchored at bottom center
            ctx.drawImage(
                charData.sheet,
                fx, fy, fw, fh,
                -renderW / 2, -renderH,
                renderW, renderH
            );

            ctx.restore();
        }
    };

    function switchCharacter(id) {
        if (!CHARACTERS[id]) return;
        selectedCharId = id;
        document.querySelectorAll('.char-select-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.id) === id);
        });
        document.getElementById('char-name-tag').innerText = CHARACTERS[id].name;
    }
    window.switchCharacter = switchCharacter;

    // Camera
    let cameraX = 0;

    // Render loop
    let lastTime = performance.now();

    function drawParallaxBackground(camX) {
        if (!assets.background.complete) return;
        const bgW = 1024;
        const bgH = 512;
        
        // Loop background infinitely
        const startX = Math.floor(camX / bgW) * bgW - bgW;
        for (let x = startX; x < camX + V_WIDTH + bgW; x += bgW) {
            ctx.drawImage(assets.background, x - camX, 0, bgW, V_HEIGHT);
        }
    }

    function drawPlatformsAndProps(camX) {
        // Draw wood style pixel platforms
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#2b1704';
        ctx.lineWidth = 3;

        for (const p of platforms) {
            if (p.x + p.w >= camX && p.x <= camX + V_WIDTH) {
                // Platform base
                ctx.fillStyle = '#5c3a21';
                ctx.fillRect(p.x - camX, p.y, p.w, p.h);
                // Grass top on platform
                ctx.fillStyle = '#68b13c';
                ctx.fillRect(p.x - camX, p.y, p.w, 4);
                // Outline
                ctx.strokeRect(p.x - camX, p.y, p.w, p.h);
            }
        }

        // Draw Collectible Gems
        for (const item of collectibles) {
            if (!item.collected && item.x >= camX - 30 && item.x <= camX + V_WIDTH + 30) {
                const bounce = Math.sin(performance.now() * 0.005 + item.x) * 4;
                const rx = item.x - camX;
                const ry = item.y + bounce;

                // Glowing diamond crystal
                ctx.save();
                ctx.translate(rx, ry);
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(10, 0);
                ctx.lineTo(0, 12);
                ctx.lineTo(-10, 0);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    function gameLoop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // Update
        player.update(dt);

        // Smooth camera follow
        const targetCamX = player.x - V_WIDTH / 2;
        cameraX += (targetCamX - cameraX) * 0.1;

        // Clear canvas
        ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

        // Draw Layers
        drawParallaxBackground(cameraX);
        drawPlatformsAndProps(cameraX);
        player.render(cameraX);

        requestAnimationFrame(gameLoop);
    }

    // Init
    window.addEventListener('DOMContentLoaded', () => {
        resizeCanvas();
        setupTouchControls();
        document.querySelectorAll('.char-select-btn').forEach(b => {
            b.addEventListener('click', () => switchCharacter(parseInt(b.dataset.id)));
        });
        requestAnimationFrame(gameLoop);
    });

})();
