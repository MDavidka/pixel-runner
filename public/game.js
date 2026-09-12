// ============================================================================
// VALLEY EXPEDITION: 2D ADVENTURE RUNNER & CABIN HOMESTEAD ENGINE
// A Cohesive Pixel-Art Valley Adventure, Foraging, Upgrade & Survival Platformer
// ============================================================================

(function() {
    "use strict";

    let canvas, ctx;
    let V_WIDTH = 960;
    const V_HEIGHT = 540;
    const GROUND_Y = 430;

    function resizeCanvas() {
        if (!canvas) canvas = document.getElementById("gameCanvas");
        if (!canvas) return;
        ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        
        // Dynamically match aspect ratio so canvas fits wide mobile screens without black voids
        if (rect.height > 0) {
            V_WIDTH = Math.max(960, Math.round(V_HEIGHT * (rect.width / rect.height)));
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(canvas.width / V_WIDTH, canvas.height / V_HEIGHT);
        ctx.imageSmoothingEnabled = false;
    }
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 120));

    // ============================================================================
    // 1. PERSISTENT SAVE & GAME STATE SYSTEM
    // ============================================================================
    const SAVE_KEY = "valley_runner_save_v8";

    const DEFAULT_SAVE = {
        resources: {
            coins: 150
        },
        player: {
            level: 1,
            xp: 0,
            xpNext: 100,
            energy: 100,
            maxEnergy: 100
        },
        upgrades: {
            speedLevel: 1,
            jumpLevel: 1,
            staminaLevel: 1,
            magnetLevel: 1,
            axeLevel: 1,
            pickLevel: 1,
            backpackLevel: 1,
            workshop: 0,
            farm: 0,
            watchtower: 0
        },
        quests: [
            { id: "q_wood", title: "Valley Woodsman", desc: "Chop trees to gather 40 timber wood", target: 40, progress: 0, rewardCoins: 120, rewardXp: 50, done: false, claimed: false },
            { id: "q_stone", title: "Granite Miner", desc: "Mine boulders to gather 30 stone", target: 30, progress: 0, rewardCoins: 140, rewardXp: 60, done: false, claimed: false },
            { id: "q_dist", title: "Valley Trailblazer", desc: "Travel 500m across the valley biomes", target: 500, progress: 0, rewardCoins: 200, rewardXp: 100, done: false, claimed: false },
            { id: "q_upgrade", title: "Homestead Craftsman", desc: "Upgrade any tool or stat at the Cabin", target: 1, progress: 0, rewardCoins: 250, rewardXp: 120, done: false, claimed: false }
        ],
        settings: {
            muted: false
        },
        eventHistory: {},
        highScore: 0,
        bestDistance: 0,
        totalRuns: 0
    };

    let SaveData = loadGame();

    function loadGame() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return Object.assign({}, DEFAULT_SAVE, parsed, {
                    resources: Object.assign({}, DEFAULT_SAVE.resources, parsed.resources),
                    player: Object.assign({}, DEFAULT_SAVE.player, parsed.player),
                    upgrades: Object.assign({}, DEFAULT_SAVE.upgrades, parsed.upgrades),
                    settings: Object.assign({}, DEFAULT_SAVE.settings, parsed.settings)
                });
            }
        } catch(e) {}
        return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    }

    function saveGame() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(SaveData));
        } catch(e) {}
    }

    // ============================================================================
    // 2. AUDIO SYNTHESIZER (Pure Web Audio API)
    // ============================================================================
    let audioCtx = null;
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function playSound(type) {
        if (SaveData.settings.muted) return;
        try {
            if (!audioCtx) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === "jump") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === "coin" || type === "pickup") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.setValueAtTime(900, now + 0.08);
                osc.frequency.setValueAtTime(1200, now + 0.14);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === "crystal") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === "chop") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === "mine") {
                osc.type = "square";
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (type === "chest") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(660, now + 0.09);
                osc.frequency.setValueAtTime(880, now + 0.18);
                osc.frequency.setValueAtTime(1320, now + 0.28);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === "door") {
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.linearRampToValueAtTime(240, now + 0.18);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === "upgrade") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.setValueAtTime(520, now + 0.1);
                osc.frequency.setValueAtTime(700, now + 0.2);
                osc.frequency.setValueAtTime(1050, now + 0.3);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === "levelup") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554, now + 0.12);
                osc.frequency.setValueAtTime(659, now + 0.24);
                osc.frequency.setValueAtTime(880, now + 0.36);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
            } else if (type === "roar") {
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(30, now + 0.8);
                gain.gain.setValueAtTime(0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
            } else if (type === "hit") {
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === "rocket") {
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(70, now);
                osc.frequency.exponentialRampToValueAtTime(360, now + 1.2);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 1.4);
                osc.start(now);
                osc.stop(now + 1.4);
            } else if (type === "train_whistle") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(587, now);
                osc.frequency.linearRampToValueAtTime(659, now + 0.35);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === "electric_flicker") {
                osc.type = "square";
                osc.frequency.setValueAtTime(120, now);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === "ladder") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(90, now + 0.06);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.06);
            }
        } catch(e) {}
    }

    function toggleAudio() {
        SaveData.settings.muted = !SaveData.settings.muted;
        saveGame();
        updateAudioIcon();
    }

    function updateAudioIcon() {
        const svg = document.getElementById("svg-audio-icon");
        if (svg) {
            if (SaveData.settings.muted) {
                svg.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
            } else {
                svg.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
            }
        }
        const img = document.getElementById("img-audio-icon");
        if (img) {
            img.src = SaveData.settings.muted ? "assets/ui/btn_mute.png" : "assets/ui/btn_sound.png";
        }
        const toggleBtn = document.getElementById("setting-toggle-audio");
        if (toggleBtn) {
            toggleBtn.classList.toggle("active", !SaveData.settings.muted);
            toggleBtn.innerText = SaveData.settings.muted ? "OFF" : "ON";
        }
    }

        // ============================================================================
    // 3. SPRITES & ANIMATION MATRICES
    // ============================================================================
    const vKey = "1.3.2";
    const assets = {
        school_start: new Image(),
        kaufland: new Image(),
        modern_bridge: new Image(),
        tree_oak_lush: new Image(),
        tree_pine_lush: new Image(),
        tree_slender: new Image(),
        valley_panorama: new Image(),
        // Timi (char2)
        char2_idle: [],
        char2_walk: [],
        char2_run: [],
        char2_jump: [],
        char2_hurt: [],
        char2_dead: [],
        // Márta (char1)
        char1_idle: [],
        char1_walk: [],
        char1_run: [],
        char1_dead: [],
        // Enci
        enci_idle: [],
        enci_walk: [],
        enci_run: [],
        enci_jump: [],
        enci_hurt: [],
        enci_dead: []
    };

    assets.school_start.src = "assets/buildings/school_start.png?v=" + vKey;
    assets.kaufland.src = "assets/buildings/kaufland.png?v=" + vKey;
    assets.modern_bridge.src = "assets/buildings/modern_bridge.png?v=" + vKey;
    assets.tree_oak_lush.src = "assets/buildings/tree_oak_lush.png?v=" + vKey;
    assets.tree_pine_lush.src = "assets/buildings/tree_pine_lush.png?v=" + vKey;
    assets.tree_slender.src = "assets/buildings/tree_slender.png?v=" + vKey;
    assets.valley_panorama.src = "assets/valley_panorama.png?v=" + vKey;

    function loadAnimFrames(targetArr, prefix, count) {
        for (let i = 0; i < count; i++) {
            const img = new Image();
            img.src = "assets/sprites/" + prefix + "_" + i + ".png?v=" + vKey;
            targetArr.push(img);
        }
    }

    loadAnimFrames(assets.char2_idle, "char2_idle", 4);
    loadAnimFrames(assets.char2_walk, "char2_walk", 10);
    loadAnimFrames(assets.char2_run, "char2_run", 10);
    loadAnimFrames(assets.char2_jump, "char2_jump", 7);
    loadAnimFrames(assets.char2_hurt, "char2_hurt", 3);
    loadAnimFrames(assets.char2_dead, "char2_dead", 4);

    loadAnimFrames(assets.char1_idle, "char1_idle", 4);
    loadAnimFrames(assets.char1_walk, "char1_walk", 8);
    loadAnimFrames(assets.char1_run, "char1_run", 8);
    loadAnimFrames(assets.char1_dead, "char1_dead", 6);

    loadAnimFrames(assets.enci_idle, "enci_idle", 8);
    loadAnimFrames(assets.enci_walk, "enci_walk", 8);
    loadAnimFrames(assets.enci_run, "enci_run", 8);
    loadAnimFrames(assets.enci_jump, "enci_jump", 4);
    loadAnimFrames(assets.enci_hurt, "enci_hurt", 4);
    loadAnimFrames(assets.enci_dead, "enci_dead", 6);

// ============================================================================
    // 4. PRE-RENDERED VECTOR/PIXEL ASSET LIBRARY (EnvLibrary)
    // ============================================================================
    const EnvLibrary = {
        canvases: {},

        createCanvas(w, h) {
            const c = document.createElement("canvas");
            c.width = w;
            c.height = h;
            const cctx = c.getContext("2d");
            cctx.imageSmoothingEnabled = false;
            return { canvas: c, ctx: cctx };
        },

        init() {
            this.buildTrees();
            this.buildFoliage();
            this.buildRocks();
            this.buildStructures();
            this.buildInteractables();
            this.buildAtmosphere();
        },

        buildTrees() {
            // 1. Giant Mountain Pine Tree (w: 100, h: 220)
            const giantPine = this.createCanvas(100, 220);
            const gpctx = giantPine.ctx;
            gpctx.fillStyle = "#381502";
            gpctx.fillRect(44, 110, 14, 110);
            gpctx.fillStyle = "#652b0a";
            gpctx.fillRect(47, 110, 5, 110);
            const gTiers = [
                { y: 130, w: 94, h: 46, col: "#0f3a1e", high: "#14532d" },
                { y: 95, w: 82, h: 42, col: "#14532d", high: "#166534" },
                { y: 65, w: 68, h: 38, col: "#166534", high: "#15803d" },
                { y: 38, w: 52, h: 34, col: "#15803d", high: "#22c55e" },
                { y: 12, w: 36, h: 30, col: "#16a34a", high: "#4ade80" }
            ];
            for (const t of gTiers) {
                gpctx.fillStyle = t.col;
                gpctx.beginPath();
                gpctx.moveTo(50 - t.w / 2, t.y + t.h);
                gpctx.lineTo(50, t.y);
                gpctx.lineTo(50 + t.w / 2, t.y + t.h);
                gpctx.closePath();
                gpctx.fill();
                gpctx.fillStyle = t.high;
                gpctx.beginPath();
                gpctx.moveTo(50 - t.w / 2, t.y + t.h);
                gpctx.lineTo(50, t.y);
                gpctx.lineTo(50, t.y + t.h);
                gpctx.closePath();
                gpctx.fill();
            }
            this.canvases["tree_pine_giant"] = giantPine.canvas;

            // 2. Ancient Great Oak Tree (w: 130, h: 190)
            const ancientOak = this.createCanvas(130, 190);
            const aoctx = ancientOak.ctx;
            aoctx.fillStyle = "#3e1c07";
            aoctx.fillRect(56, 100, 18, 90);
            aoctx.fillStyle = "#5c2b09";
            aoctx.fillRect(60, 100, 8, 90);
            aoctx.fillStyle = "#14532d";
            aoctx.beginPath();
            aoctx.arc(65, 75, 55, 0, Math.PI * 2);
            aoctx.arc(38, 70, 36, 0, Math.PI * 2);
            aoctx.arc(92, 70, 36, 0, Math.PI * 2);
            aoctx.arc(65, 40, 38, 0, Math.PI * 2);
            aoctx.fill();
            aoctx.fillStyle = "#22c55e";
            aoctx.beginPath();
            aoctx.arc(58, 65, 42, 0, Math.PI * 2);
            aoctx.arc(36, 60, 26, 0, Math.PI * 2);
            aoctx.arc(65, 34, 28, 0, Math.PI * 2);
            aoctx.fill();
            this.canvases["tree_oak_ancient"] = ancientOak.canvas;

            // 3. Autumn Golden Oak
            const autumnOak = this.createCanvas(80, 130);
            const atctx = autumnOak.ctx;
            atctx.fillStyle = "#451a03";
            atctx.fillRect(34, 70, 12, 60);
            atctx.fillStyle = "#c2410c";
            atctx.beginPath();
            atctx.arc(40, 50, 36, 0, Math.PI * 2);
            atctx.arc(24, 45, 24, 0, Math.PI * 2);
            atctx.arc(56, 45, 24, 0, Math.PI * 2);
            atctx.fill();
            atctx.fillStyle = "#f59e0b";
            atctx.beginPath();
            atctx.arc(36, 42, 28, 0, Math.PI * 2);
            atctx.fill();
            this.canvases["tree_oak_autumn"] = autumnOak.canvas;

            // 4. Lush Valley Oak (w: 110, h: 175)
            const oakLush = this.createCanvas(110, 175);
            const olctx = oakLush.ctx;
            olctx.fillStyle = "#3e1c07";
            olctx.fillRect(48, 90, 16, 85);
            olctx.fillStyle = "#5c2b09";
            olctx.fillRect(52, 90, 6, 85);
            olctx.fillStyle = "#15803d";
            olctx.beginPath();
            olctx.arc(55, 65, 48, 0, Math.PI * 2);
            olctx.arc(32, 60, 30, 0, Math.PI * 2);
            olctx.arc(78, 60, 30, 0, Math.PI * 2);
            olctx.arc(55, 35, 32, 0, Math.PI * 2);
            olctx.fill();
            olctx.fillStyle = "#22c55e";
            olctx.beginPath();
            olctx.arc(48, 55, 34, 0, Math.PI * 2);
            olctx.arc(30, 50, 20, 0, Math.PI * 2);
            olctx.arc(70, 50, 20, 0, Math.PI * 2);
            olctx.arc(55, 30, 22, 0, Math.PI * 2);
            olctx.fill();
            this.canvases["tree_oak_lush"] = oakLush.canvas;

            // 5. Lush Valley Pine (w: 95, h: 180)
            const pineLush = this.createCanvas(95, 180);
            const plctx = pineLush.ctx;
            plctx.fillStyle = "#381502";
            plctx.fillRect(42, 95, 12, 85);
            plctx.fillStyle = "#652b0a";
            plctx.fillRect(45, 95, 4, 85);
            const plTiers = [
                { y: 105, w: 86, h: 40, col: "#14532d", high: "#166534" },
                { y: 75, w: 74, h: 36, col: "#166534", high: "#15803d" },
                { y: 48, w: 60, h: 32, col: "#15803d", high: "#22c55e" },
                { y: 22, w: 44, h: 28, col: "#16a34a", high: "#4ade80" },
                { y: 6, w: 26, h: 22, col: "#22c55e", high: "#86efac" }
            ];
            for (const t of plTiers) {
                plctx.fillStyle = t.col;
                plctx.beginPath();
                plctx.moveTo(48 - t.w / 2, t.y + t.h);
                plctx.lineTo(48, t.y);
                plctx.lineTo(48 + t.w / 2, t.y + t.h);
                plctx.closePath();
                plctx.fill();
                plctx.fillStyle = t.high;
                plctx.beginPath();
                plctx.moveTo(48 - t.w / 2, t.y + t.h);
                plctx.lineTo(48, t.y);
                plctx.lineTo(48, t.y + t.h);
                plctx.closePath();
                plctx.fill();
            }
            this.canvases["tree_pine_lush"] = pineLush.canvas;

            // 6. Slender Birch (w: 85, h: 155)
            const slender = this.createCanvas(85, 155);
            const slctx = slender.ctx;
            slctx.fillStyle = "#e2e8f0";
            slctx.fillRect(38, 70, 8, 85);
            slctx.fillStyle = "#334155";
            slctx.fillRect(38, 85, 4, 3);
            slctx.fillRect(42, 105, 4, 3);
            slctx.fillRect(38, 125, 4, 3);
            slctx.fillStyle = "#15803d";
            slctx.beginPath();
            slctx.ellipse(42, 50, 30, 42, 0, 0, Math.PI * 2);
            slctx.fill();
            slctx.fillStyle = "#4ade80";
            slctx.beginPath();
            slctx.ellipse(38, 44, 22, 32, 0, 0, Math.PI * 2);
            slctx.fill();
            this.canvases["tree_slender"] = slender.canvas;
        },

        buildFoliage() {
            // Wildflowers
            const flowers = this.createCanvas(32, 20);
            const flctx = flowers.ctx;
            flctx.fillStyle = "#65a30d";
            flctx.fillRect(4, 6, 2, 14);
            flctx.fillRect(14, 4, 2, 16);
            flctx.fillRect(24, 8, 2, 12);
            flctx.fillStyle = "#f43f5e";
            flctx.fillRect(3, 4, 4, 4);
            flctx.fillStyle = "#38bdf8";
            flctx.fillRect(13, 2, 4, 4);
            flctx.fillStyle = "#facc15";
            flctx.fillRect(23, 6, 4, 4);
            this.canvases["wildflowers"] = flowers.canvas;

            // Berry Bush
            const bush = this.createCanvas(36, 26);
            const bctx = bush.ctx;
            bctx.fillStyle = "#166534";
            bctx.beginPath();
            bctx.arc(18, 14, 12, 0, Math.PI * 2);
            bctx.arc(10, 16, 9, 0, Math.PI * 2);
            bctx.arc(26, 16, 9, 0, Math.PI * 2);
            bctx.fill();
            bctx.fillStyle = "#22c55e";
            bctx.beginPath();
            bctx.arc(16, 12, 9, 0, Math.PI * 2);
            bctx.fill();
            bctx.fillStyle = "#ef4444";
            bctx.fillRect(12, 10, 3, 3);
            bctx.fillRect(20, 8, 3, 3);
            bctx.fillRect(24, 15, 3, 3);
            this.canvases["bush_berry"] = bush.canvas;
        },

        buildRocks() {
            // Mossy Boulder
            const mossBoulder = this.createCanvas(56, 44);
            const mbctx = mossBoulder.ctx;
            mbctx.fillStyle = "#1e293b";
            mbctx.beginPath();
            mbctx.arc(28, 26, 22, 0, Math.PI * 2);
            mbctx.fill();
            mbctx.fillStyle = "#475569";
            mbctx.beginPath();
            mbctx.arc(26, 22, 18, 0, Math.PI * 2);
            mbctx.fill();
            mbctx.fillStyle = "#65a30d";
            mbctx.beginPath();
            mbctx.arc(26, 14, 14, Math.PI, Math.PI * 2);
            mbctx.fill();
            mbctx.fillStyle = "#a3e635";
            mbctx.fillRect(20, 10, 10, 3);
            this.canvases["boulder_mossy"] = mossBoulder.canvas;

            // Fallen Log
            const log = this.createCanvas(64, 32);
            const lctx = log.ctx;
            lctx.fillStyle = "#451a03";
            lctx.beginPath();
            lctx.roundRect(0, 6, 64, 24, 6);
            lctx.fill();
            lctx.fillStyle = "#78350f";
            lctx.fillRect(4, 10, 56, 16);
            lctx.fillStyle = "#65a30d";
            lctx.fillRect(12, 6, 28, 4);
            this.canvases["log_fallen"] = log.canvas;
        },

        buildStructures() {
            // School Start (w: 460, h: 260)
            const school = this.createCanvas(460, 260);
            const skctx = school.ctx;
            skctx.fillStyle = "#991b1b";
            skctx.fillRect(40, 90, 380, 170);
            skctx.fillStyle = "#7f1d1d";
            for (let y = 95; y < 260; y += 14) {
                skctx.fillRect(40, y, 380, 2);
            }
            skctx.fillStyle = "#b91c1c";
            skctx.fillRect(190, 20, 80, 160);
            skctx.fillStyle = "#1e293b";
            skctx.beginPath();
            skctx.moveTo(180, 30);
            skctx.lineTo(230, 0);
            skctx.lineTo(280, 30);
            skctx.closePath();
            skctx.fill();
            skctx.fillStyle = "#fef08a";
            skctx.beginPath();
            skctx.arc(230, 55, 18, 0, Math.PI * 2);
            skctx.fill();
            skctx.strokeStyle = "#78350f";
            skctx.lineWidth = 2;
            skctx.stroke();
            skctx.fillStyle = "#78350f";
            skctx.fillRect(229, 44, 2, 12);
            skctx.fillRect(229, 55, 8, 2);
            skctx.fillStyle = "#1e1b4b";
            skctx.fillRect(110, 105, 240, 24);
            skctx.strokeStyle = "#fbbf24";
            skctx.lineWidth = 1.5;
            skctx.strokeRect(110, 105, 240, 24);
            skctx.fillStyle = "#facc15";
            skctx.font = "bold 11px sans-serif";
            skctx.textAlign = "center";
            skctx.fillText("KÓS KÁROLY ELEMENTARY", 230, 121);
            skctx.fillStyle = "#38bdf8";
            for (let wx = 65; wx <= 365; wx += 50) {
                if (wx >= 180 && wx <= 250) continue;
                skctx.fillRect(wx, 145, 26, 36);
                skctx.fillStyle = "#0284c7";
                skctx.fillRect(wx + 12, 145, 2, 36);
                skctx.fillRect(wx, 162, 26, 2);
                skctx.fillStyle = "#38bdf8";
            }
            skctx.fillStyle = "#451a03";
            skctx.fillRect(205, 195, 50, 65);
            skctx.fillStyle = "#fbbf24";
            skctx.fillRect(218, 225, 4, 4);
            skctx.fillRect(238, 225, 4, 4);
            this.canvases["school_start"] = school.canvas;

            // Kaufland Supermarket (w: 480, h: 240)
            const kaufland = this.createCanvas(480, 240);
            const kfctx = kaufland.ctx;
            kfctx.fillStyle = "#f8fafc";
            kfctx.fillRect(20, 60, 440, 180);
            kfctx.fillStyle = "#e2e8f0";
            kfctx.fillRect(20, 60, 440, 8);
            kfctx.fillStyle = "#dc2626";
            kfctx.fillRect(40, 70, 400, 42);
            kfctx.strokeStyle = "#ffffff";
            kfctx.lineWidth = 2;
            kfctx.strokeRect(40, 70, 400, 42);
            kfctx.fillStyle = "#ffffff";
            kfctx.font = "bold 20px sans-serif";
            kfctx.textAlign = "center";
            kfctx.fillText("KAUFLAND", 240, 99);
            kfctx.fillStyle = "rgba(56, 189, 248, 0.4)";
            kfctx.fillRect(50, 125, 380, 105);
            kfctx.fillStyle = "#334155";
            for (let gx = 50; gx <= 430; gx += 45) {
                kfctx.fillRect(gx, 125, 3, 105);
            }
            kfctx.fillStyle = "#ef4444";
            kfctx.fillRect(205, 155, 70, 85);
            kfctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            kfctx.font = "bold 10px sans-serif";
            kfctx.fillText("BEJÁRAT / ENTER", 240, 195);
            this.canvases["kaufland"] = kaufland.canvas;

            // Modern Bridge (w: 600, h: 180)
            const bridge = this.createCanvas(600, 180);
            const bctx = bridge.ctx;
            bctx.fillStyle = "#64748b";
            bctx.fillRect(0, 120, 600, 36);
            bctx.fillStyle = "#475569";
            bctx.fillRect(0, 148, 600, 8);
            bctx.fillStyle = "#334155";
            bctx.fillRect(0, 95, 600, 6);
            for (let rx = 10; rx < 600; rx += 20) {
                bctx.fillRect(rx, 95, 3, 25);
            }
            bctx.fillStyle = "#334155";
            bctx.fillRect(60, 156, 40, 24);
            bctx.fillRect(280, 156, 40, 24);
            bctx.fillRect(500, 156, 40, 24);
            this.canvases["modern_bridge"] = bridge.canvas;

            // Resized Grand Cabin (w: 160, h: 125)
            const cabin = this.createCanvas(160, 125);
            const cctx = cabin.ctx;
            cctx.fillStyle = "#451a03";
            cctx.fillRect(18, 45, 124, 80);
            cctx.fillStyle = "#78350f";
            for (let y = 50; y < 125; y += 12) {
                cctx.fillRect(18, y, 124, 10);
            }
            cctx.fillStyle = "#9a3412";
            cctx.beginPath();
            cctx.moveTo(6, 45);
            cctx.lineTo(80, 8);
            cctx.lineTo(154, 45);
            cctx.closePath();
            cctx.fill();
            cctx.fillStyle = "#ea580c";
            cctx.fillRect(18, 42, 124, 4);
            cctx.fillStyle = "#334155";
            cctx.fillRect(115, 10, 20, 42);
            cctx.fillStyle = "#fef08a";
            cctx.fillRect(52, 65, 34, 34);
            cctx.fillStyle = "#78350f";
            cctx.fillRect(68, 65, 3, 34);
            cctx.fillRect(52, 81, 34, 3);
            cctx.fillStyle = "#271003";
            cctx.fillRect(100, 75, 26, 50);
            this.canvases["cabin_rustic"] = cabin.canvas;

            // Signpost
            const sign = this.createCanvas(30, 44);
            const sctx = sign.ctx;
            sctx.fillStyle = "#451a03";
            sctx.fillRect(12, 10, 6, 34);
            sctx.fillStyle = "#b45309";
            sctx.fillRect(2, 6, 26, 14);
            sctx.fillStyle = "#fde047";
            sctx.fillRect(6, 9, 18, 2);
            sctx.fillRect(6, 14, 14, 2);
            this.canvases["signpost"] = sign.canvas;
        },

        buildInteractables() {
            // Treasure Chest
            const chest = this.createCanvas(36, 28);
            const chctx = chest.ctx;
            chctx.fillStyle = "#78350f";
            chctx.fillRect(2, 6, 32, 22);
            chctx.fillStyle = "#b45309";
            chctx.fillRect(4, 8, 28, 8);
            chctx.fillStyle = "#facc15";
            chctx.fillRect(2, 12, 32, 3);
            chctx.fillRect(16, 11, 4, 6);
            this.canvases["treasure_chest"] = chest.canvas;

            // Campfire
            const fire = this.createCanvas(36, 28);
            const fctx = fire.ctx;
            fctx.fillStyle = "#451a03";
            fctx.fillRect(4, 22, 28, 6);
            fctx.fillStyle = "#f97316";
            fctx.beginPath();
            fctx.arc(18, 14, 10, 0, Math.PI * 2);
            fctx.fill();
            fctx.fillStyle = "#fde047";
            fctx.beginPath();
            fctx.arc(18, 16, 5, 0, Math.PI * 2);
            fctx.fill();
            this.canvases["campfire_node"] = fire.canvas;
        },

        buildAtmosphere() {
            const cloud1 = this.createCanvas(120, 48);
            const cctx1 = cloud1.ctx;
            cctx1.fillStyle = "rgba(255, 255, 255, 0.85)";
            cctx1.beginPath();
            cctx1.arc(36, 30, 18, 0, Math.PI * 2);
            cctx1.arc(60, 22, 22, 0, Math.PI * 2);
            cctx1.arc(84, 28, 16, 0, Math.PI * 2);
            cctx1.fill();
            this.canvases["cloud_puffy_1"] = cloud1.canvas;

            const cloud2 = this.createCanvas(150, 54);
            const cctx2 = cloud2.ctx;
            cctx2.fillStyle = "rgba(255, 255, 255, 0.75)";
            cctx2.beginPath();
            cctx2.arc(36, 34, 20, 0, Math.PI * 2);
            cctx2.arc(75, 25, 25, 0, Math.PI * 2);
            cctx2.arc(114, 32, 18, 0, Math.PI * 2);
            cctx2.fill();
            this.canvases["cloud_puffy_2"] = cloud2.canvas;
        },

        buildSketchFeatures() {
            // 1. CAVE ENTRANCE / 5102 (from Sketch Zone 5102)
            const cave = this.createCanvas(180, 140);
            const cvctx = cave.ctx;
            // Mountain cliff rock around entrance
            cvctx.fillStyle = "#1e1b4b";
            cvctx.beginPath();
            cvctx.moveTo(0, 140);
            cvctx.lineTo(10, 30);
            cvctx.lineTo(50, 10);
            cvctx.lineTo(130, 8);
            cvctx.lineTo(175, 25);
            cvctx.lineTo(180, 140);
            cvctx.closePath();
            cvctx.fill();
            // Rocky highlight rim
            cvctx.fillStyle = "#312e81";
            cvctx.fillRect(15, 35, 150, 6);
            // Deep cavern tunnel interior (Dark gradient void)
            const caveGrad = cvctx.createLinearGradient(90, 40, 90, 140);
            caveGrad.addColorStop(0, "#05050c");
            caveGrad.addColorStop(1, "#000000");
            cvctx.fillStyle = caveGrad;
            cvctx.beginPath();
            cvctx.arc(90, 95, 55, Math.PI, 0);
            cvctx.lineTo(145, 140);
            cvctx.lineTo(35, 140);
            cvctx.closePath();
            cvctx.fill();
            // Heavy wooden mine tunnel timber beam archway
            cvctx.fillStyle = "#451a03";
            cvctx.fillRect(30, 45, 14, 95); // Left post
            cvctx.fillRect(136, 45, 14, 95); // Right post
            cvctx.fillRect(24, 38, 132, 16); // Crossbeam lintel
            cvctx.fillStyle = "#78350f";
            cvctx.fillRect(26, 41, 128, 4);
            // Golden iron bolts on beams
            cvctx.fillStyle = "#fbbf24";
            cvctx.fillRect(28, 42, 4, 4);
            cvctx.fillRect(146, 42, 4, 4);
            // Signboard matching sketch: "CAVE ENTRANCE / 5102"
            cvctx.fillStyle = "#1e293b";
            cvctx.fillRect(48, 18, 84, 18);
            cvctx.strokeStyle = "#fbbf24";
            cvctx.lineWidth = 1.5;
            cvctx.strokeRect(48, 18, 84, 18);
            cvctx.fillStyle = "#facc15";
            cvctx.font = "bold 9px monospace";
            cvctx.textAlign = "center";
            cvctx.fillText("CAVE 5102", 90, 30);
            this.canvases["cave_entrance"] = cave.canvas;

            // 2. HANGING MINE LAMP (with cord, iron cage & warm filament)
            const lamp = this.createCanvas(26, 46);
            const lpctx = lamp.ctx;
            // Ceiling wire / chain links
            lpctx.fillStyle = "#64748b";
            for (let y = 0; y < 20; y += 4) {
                lpctx.fillRect(12, y, 2, 3);
            }
            // Iron lamp socket
            lpctx.fillStyle = "#334155";
            lpctx.fillRect(7, 20, 12, 6);
            // Glass bulb with glowing warm yellow filament
            lpctx.fillStyle = "#fef08a";
            lpctx.beginPath();
            lpctx.arc(13, 31, 8, 0, Math.PI * 2);
            lpctx.fill();
            lpctx.fillStyle = "#f59e0b";
            lpctx.fillRect(11, 28, 4, 6);
            // Protective wire cage
            lpctx.strokeStyle = "#475569";
            lpctx.lineWidth = 1.5;
            lpctx.strokeRect(7, 25, 12, 14);
            this.canvases["mine_light_hanging"] = lamp.canvas;

            // 3. TALL MINE LADDER (from Sketch 5102 end)
            const ladder = this.createCanvas(32, 220);
            const ldctx = ladder.ctx;
            // Left & Right iron stiles
            ldctx.fillStyle = "#78350f";
            ldctx.fillRect(4, 0, 6, 220);
            ldctx.fillRect(22, 0, 6, 220);
            ldctx.fillStyle = "#451a03";
            ldctx.fillRect(4, 0, 2, 220);
            ldctx.fillRect(22, 0, 2, 220);
            // 15 Rungs
            for (let y = 14; y < 215; y += 14) {
                ldctx.fillStyle = "#92400e";
                ldctx.fillRect(4, y, 24, 5);
                ldctx.fillStyle = "#fbbf24";
                ldctx.fillRect(5, y + 1, 2, 2);
                ldctx.fillRect(23, y + 1, 2, 2);
            }
            this.canvases["mine_ladder"] = ladder.canvas;

            // 4. MINE CART WITH GOLD & CRYSTALS
            const cart = this.createCanvas(64, 42);
            const crtctx = cart.ctx;
            // Wooden railroad sleepers
            crtctx.fillStyle = "#451a03";
            crtctx.fillRect(4, 38, 56, 4);
            crtctx.fillStyle = "#64748b";
            crtctx.fillRect(0, 36, 64, 2); // Steel rail
            // 4 Iron flanged wheels
            crtctx.fillStyle = "#1e293b";
            crtctx.beginPath();
            crtctx.arc(16, 34, 7, 0, Math.PI * 2);
            crtctx.arc(48, 34, 7, 0, Math.PI * 2);
            crtctx.fill();
            crtctx.fillStyle = "#64748b";
            crtctx.beginPath();
            crtctx.arc(16, 34, 3, 0, Math.PI * 2);
            crtctx.arc(48, 34, 3, 0, Math.PI * 2);
            crtctx.fill();
            // Cart hopper body
            crtctx.fillStyle = "#334155";
            crtctx.beginPath();
            crtctx.moveTo(8, 14);
            crtctx.lineTo(56, 14);
            crtctx.lineTo(50, 32);
            crtctx.lineTo(14, 32);
            crtctx.closePath();
            crtctx.fill();
            crtctx.fillStyle = "#475569";
            crtctx.fillRect(10, 16, 44, 4);
            // Ore: Sparkling Gold & Amethyst
            crtctx.fillStyle = "#facc15";
            crtctx.fillRect(16, 8, 10, 7);
            crtctx.fillRect(34, 9, 8, 6);
            crtctx.fillStyle = "#a855f7";
            crtctx.beginPath();
            crtctx.moveTo(26, 6);
            crtctx.lineTo(32, 14);
            crtctx.lineTo(24, 14);
            crtctx.closePath();
            crtctx.fill();
            this.canvases["mine_cart"] = cart.canvas;

            // 5. MINE GENERATOR & FUSE BOX (Interactive power switch)
            const gen = this.createCanvas(48, 44);
            const gnctx = gen.ctx;
            // Cabinet housing
            gnctx.fillStyle = "#1e293b";
            gnctx.fillRect(4, 6, 40, 36);
            gnctx.strokeStyle = "#475569";
            gnctx.lineWidth = 2;
            gnctx.strokeRect(4, 6, 40, 36);
            // Caution stripes along top
            for (let x = 6; x < 42; x += 8) {
                gnctx.fillStyle = "#facc15";
                gnctx.fillRect(x, 8, 4, 6);
                gnctx.fillStyle = "#0f172a";
                gnctx.fillRect(x + 4, 8, 4, 6);
            }
            // Voltage meter
            gnctx.fillStyle = "#f8fafc";
            gnctx.fillRect(10, 18, 14, 12);
            gnctx.fillStyle = "#ef4444";
            gnctx.fillRect(16, 20, 2, 8); // Meter needle
            // Red / Green status pilot lights
            gnctx.fillStyle = "#ef4444";
            gnctx.beginPath();
            gnctx.arc(32, 22, 4, 0, Math.PI * 2);
            gnctx.fill();
            // Heavy knife switch lever
            gnctx.fillStyle = "#b45309";
            gnctx.fillRect(28, 30, 14, 5);
            gnctx.fillStyle = "#ef4444";
            gnctx.fillRect(38, 27, 5, 11);
            this.canvases["mine_generator"] = gen.canvas;

            // 6. LEVITATING RUNIC PARKOUR BLOCK (from Sketch 5103)
            const levBlock = this.createCanvas(80, 36);
            const lbctx = levBlock.ctx;
            // Ancient carved stone block body
            lbctx.fillStyle = "#1e293b";
            lbctx.beginPath();
            lbctx.roundRect(4, 4, 72, 24, 5);
            lbctx.fill();
            lbctx.strokeStyle = "#38bdf8";
            lbctx.lineWidth = 1.5;
            lbctx.stroke();
            // Beveled stone highlights
            lbctx.fillStyle = "#334155";
            lbctx.fillRect(8, 7, 64, 4);
            // Carved glowing cyan magical runes
            lbctx.fillStyle = "#38bdf8";
            lbctx.fillRect(18, 14, 3, 8);
            lbctx.fillRect(15, 17, 9, 2);
            lbctx.fillRect(36, 14, 8, 2);
            lbctx.fillRect(40, 14, 2, 8);
            lbctx.fillRect(56, 14, 7, 7);
            lbctx.fillStyle = "#0ea5e9";
            lbctx.fillRect(58, 16, 3, 3);
            // Lower anti-gravity plasma emitter nodes
            lbctx.fillStyle = "#0284c7";
            lbctx.fillRect(20, 28, 12, 3);
            lbctx.fillRect(48, 28, 12, 3);
            lbctx.fillStyle = "#38bdf8";
            lbctx.fillRect(23, 29, 6, 2);
            lbctx.fillRect(51, 29, 6, 2);
            this.canvases["levitating_block"] = levBlock.canvas;

            // 7. FREIGHT TRAIN LOCOMOTIVE ENGINE (for Train Parkour)
            const loco = this.createCanvas(190, 95);
            const lcoctx = loco.ctx;
            // Steel wheels
            lcoctx.fillStyle = "#0f172a";
            for (let wx = 35; wx < 175; wx += 35) {
                lcoctx.beginPath();
                lcoctx.arc(wx, 82, 12, 0, Math.PI * 2);
                lcoctx.fill();
                lcoctx.fillStyle = "#64748b";
                lcoctx.beginPath();
                lcoctx.arc(wx, 82, 5, 0, Math.PI * 2);
                lcoctx.fill();
                lcoctx.fillStyle = "#0f172a";
            }
            // Connecting rod
            lcoctx.fillStyle = "#94a3b8";
            lcoctx.fillRect(30, 80, 125, 4);
            // Heavy iron cowcatcher grill
            lcoctx.fillStyle = "#b45309";
            lcoctx.beginPath();
            lcoctx.moveTo(170, 85);
            lcoctx.lineTo(190, 85);
            lcoctx.lineTo(178, 55);
            lcoctx.closePath();
            lcoctx.fill();
            // Boiler body
            lcoctx.fillStyle = "#1e293b";
            lcoctx.fillRect(50, 32, 124, 44);
            // Gold boiler bands
            lcoctx.fillStyle = "#fbbf24";
            lcoctx.fillRect(75, 32, 4, 44);
            lcoctx.fillRect(115, 32, 4, 44);
            lcoctx.fillRect(150, 32, 4, 44);
            // Driver cabin
            lcoctx.fillStyle = "#0f172a";
            lcoctx.fillRect(10, 18, 48, 58);
            lcoctx.fillStyle = "#334155";
            lcoctx.fillRect(6, 14, 56, 6); // Cabin roof
            // Glowing cabin window
            lcoctx.fillStyle = "#fde047";
            lcoctx.fillRect(18, 28, 16, 16);
            // Smokestack
            lcoctx.fillStyle = "#0f172a";
            lcoctx.fillRect(145, 10, 16, 24);
            lcoctx.fillStyle = "#334155";
            lcoctx.fillRect(141, 6, 24, 6);
            // Front glowing headlamp beam
            lcoctx.fillStyle = "#fef08a";
            lcoctx.beginPath();
            lcoctx.arc(176, 45, 7, 0, Math.PI * 2);
            lcoctx.fill();
            this.canvases["train_locomotive"] = loco.canvas;

            // 8. FREIGHT TRAIN CONTAINER CAR (Red Corrugated Steel)
            const carCont = this.createCanvas(170, 75);
            const ccctx = carCont.ctx;
            // Wheels
            ccctx.fillStyle = "#0f172a";
            ccctx.beginPath();
            ccctx.arc(28, 64, 10, 0, Math.PI * 2);
            ccctx.arc(52, 64, 10, 0, Math.PI * 2);
            ccctx.arc(118, 64, 10, 0, Math.PI * 2);
            ccctx.arc(142, 64, 10, 0, Math.PI * 2);
            ccctx.fill();
            // Container body (Red)
            ccctx.fillStyle = "#dc2626";
            ccctx.fillRect(6, 12, 158, 46);
            // Corrugated vertical ribs
            ccctx.fillStyle = "#991b1b";
            for (let rx = 14; rx < 160; rx += 14) {
                ccctx.fillRect(rx, 14, 3, 42);
            }
            // Steel parkour walkway roof
            ccctx.fillStyle = "#475569";
            ccctx.fillRect(2, 6, 166, 7);
            ccctx.fillStyle = "#cbd5e1";
            ccctx.fillRect(4, 7, 162, 2);
            // End ladder
            ccctx.fillStyle = "#facc15";
            ccctx.fillRect(160, 12, 3, 44);
            this.canvases["train_car_container"] = carCont.canvas;

            // 9. FREIGHT TRAIN TANKER CAR (Blue Cylindrical)
            const carTank = this.createCanvas(170, 70);
            const ctctx = carTank.ctx;
            // Wheels
            ctctx.fillStyle = "#0f172a";
            ctctx.beginPath();
            ctctx.arc(28, 60, 9, 0, Math.PI * 2);
            ctctx.arc(52, 60, 9, 0, Math.PI * 2);
            ctctx.arc(118, 60, 9, 0, Math.PI * 2);
            ctctx.arc(142, 60, 9, 0, Math.PI * 2);
            ctctx.fill();
            // Cylindrical Tank (Blue)
            ctctx.fillStyle = "#0284c7";
            ctctx.beginPath();
            ctctx.roundRect(8, 14, 154, 40, 16);
            ctctx.fill();
            ctctx.fillStyle = "#38bdf8";
            ctctx.fillRect(16, 18, 138, 4);
            // Top safety railing & walkway
            ctctx.fillStyle = "#334155";
            ctctx.fillRect(20, 8, 130, 6);
            this.canvases["train_car_tanker"] = carTank.canvas;

            // 10. ORBITAL MOON ROCKET & LAUNCH GANTRY (from Sketch 5103)
            const rocket = this.createCanvas(80, 180);
            const rkctx = rocket.ctx;
            // Launch gantry scaffolding (Red Steel)
            rkctx.strokeStyle = "#ef4444";
            rkctx.lineWidth = 2;
            rkctx.strokeRect(6, 40, 18, 135);
            // Scaffolding diagonal trusses
            for (let gy = 40; gy < 170; gy += 25) {
                rkctx.beginPath();
                rkctx.moveTo(6, gy);
                rkctx.lineTo(24, gy + 25);
                rkctx.moveTo(24, gy);
                rkctx.lineTo(6, gy + 25);
                rkctx.stroke();
            }
            // Launch gantry swing arm
            rkctx.fillStyle = "#dc2626";
            rkctx.fillRect(20, 65, 20, 6);
            rkctx.fillRect(20, 115, 20, 6);
            // Rocket Fuselage (White Metallic)
            rkctx.fillStyle = "#f8fafc";
            rkctx.beginPath();
            rkctx.moveTo(52, 10); // Nosecone apex
            rkctx.lineTo(66, 45);
            rkctx.lineTo(66, 155);
            rkctx.lineTo(38, 155);
            rkctx.lineTo(38, 45);
            rkctx.closePath();
            rkctx.fill();
            // Black aerodynamic roll stripes
            rkctx.fillStyle = "#0f172a";
            rkctx.fillRect(38, 55, 28, 12);
            rkctx.fillRect(38, 110, 28, 8);
            // Red accent nosecone tip
            rkctx.fillStyle = "#ef4444";
            rkctx.beginPath();
            rkctx.moveTo(52, 10);
            rkctx.lineTo(58, 25);
            rkctx.lineTo(46, 25);
            rkctx.closePath();
            rkctx.fill();
            // Astronaut capsule circular port window
            rkctx.fillStyle = "#38bdf8";
            rkctx.beginPath();
            rkctx.arc(52, 78, 5, 0, Math.PI * 2);
            rkctx.fill();
            rkctx.strokeStyle = "#1e293b";
            rkctx.lineWidth = 1.5;
            rkctx.stroke();
            // Aerodynamic delta fins
            rkctx.fillStyle = "#dc2626";
            rkctx.beginPath();
            rkctx.moveTo(38, 130);
            rkctx.lineTo(26, 160);
            rkctx.lineTo(38, 156);
            rkctx.closePath();
            rkctx.fill();
            rkctx.beginPath();
            rkctx.moveTo(66, 130);
            rkctx.lineTo(78, 160);
            rkctx.lineTo(66, 156);
            rkctx.closePath();
            rkctx.fill();
            // Rocket engine bell nozzles
            rkctx.fillStyle = "#334155";
            rkctx.beginPath();
            rkctx.moveTo(42, 155);
            rkctx.lineTo(40, 166);
            rkctx.lineTo(48, 166);
            rkctx.lineTo(46, 155);
            rkctx.closePath();
            rkctx.fill();
            rkctx.beginPath();
            rkctx.moveTo(56, 155);
            rkctx.lineTo(54, 166);
            rkctx.lineTo(62, 166);
            rkctx.lineTo(60, 155);
            rkctx.closePath();
            rkctx.fill();
            this.canvases["rocket_ship"] = rocket.canvas;

            // 11. LAUNCHPAD BARRIER SPIKES (from Sketch 5103: /\ /\ [Rocket] /\ /\)
            const spikes = this.createCanvas(60, 25);
            const spkctx = spikes.ctx;
            spkctx.fillStyle = "#475569";
            for (let sx = 0; sx < 60; sx += 15) {
                spkctx.beginPath();
                spkctx.moveTo(sx, 25);
                spkctx.lineTo(sx + 7.5, 4);
                spkctx.lineTo(sx + 15, 25);
                spkctx.closePath();
                spkctx.fill();
                spkctx.fillStyle = "#94a3b8";
                spkctx.fillRect(sx + 6, 6, 3, 19);
                spkctx.fillStyle = "#475569";
            }
            this.canvases["rocket_spikes"] = spikes.canvas;

            // 12. APOLLO MOON FLAG (Planted in Moon Regolith)
            const flag = this.createCanvas(40, 55);
            const fgctx = flag.ctx;
            // Steel pole
            fgctx.fillStyle = "#cbd5e1";
            fgctx.fillRect(8, 6, 3, 48);
            // Flag cloth
            fgctx.fillStyle = "#2563eb";
            fgctx.fillRect(11, 7, 10, 8);
            fgctx.fillStyle = "#ef4444";
            for (let fy = 7; fy < 23; fy += 4) {
                fgctx.fillRect(11, fy, 26, 2);
            }
            fgctx.fillStyle = "#ffffff";
            for (let fy = 9; fy < 23; fy += 4) {
                fgctx.fillRect(11, fy, 26, 2);
            }
            // Lunar regolith dust mound
            fgctx.fillStyle = "#64748b";
            fgctx.beginPath();
            fgctx.ellipse(9, 52, 9, 3, 0, 0, Math.PI * 2);
            fgctx.fill();
            this.canvases["moon_flag"] = flag.canvas;

            // 13. LUNAR ROVER BUGGY
            const rover = this.createCanvas(76, 44);
            const rvctx = rover.ctx;
            // 4 Mesh wire wheels
            rvctx.fillStyle = "#94a3b8";
            rvctx.beginPath();
            rvctx.arc(16, 34, 9, 0, Math.PI * 2);
            rvctx.arc(60, 34, 9, 0, Math.PI * 2);
            rvctx.fill();
            rvctx.fillStyle = "#0f172a";
            rvctx.beginPath();
            rvctx.arc(16, 34, 5, 0, Math.PI * 2);
            rvctx.arc(60, 34, 5, 0, Math.PI * 2);
            rvctx.fill();
            // Chassis frame
            rvctx.fillStyle = "#cbd5e1";
            rvctx.fillRect(8, 26, 60, 6);
            // Seats & control console
            rvctx.fillStyle = "#475569";
            rvctx.fillRect(28, 16, 16, 12);
            // Parabolic high-gain antenna dish
            rvctx.strokeStyle = "#cbd5e1";
            rvctx.lineWidth = 1.5;
            rvctx.beginPath();
            rvctx.arc(55, 12, 10, Math.PI * 0.7, Math.PI * 1.6);
            rvctx.stroke();
            rvctx.fillStyle = "#38bdf8";
            rvctx.fillRect(52, 11, 4, 4);
            this.canvases["moon_rover"] = rover.canvas;

            // 14. ALIEN MOON CRYSTAL CLUSTER
            const mcryst = this.createCanvas(32, 36);
            const mcctx = mcryst.ctx;
            mcctx.fillStyle = "#38bdf8";
            mcctx.beginPath();
            mcctx.moveTo(16, 2);
            mcctx.lineTo(24, 32);
            mcctx.lineTo(8, 32);
            mcctx.closePath();
            mcctx.fill();
            mcctx.fillStyle = "#a855f7";
            mcctx.beginPath();
            mcctx.moveTo(25, 12);
            mcctx.lineTo(31, 32);
            mcctx.lineTo(19, 32);
            mcctx.closePath();
            mcctx.fill();
            mcctx.fillStyle = "#e0f2fe";
            mcctx.beginPath();
            mcctx.moveTo(16, 2);
            mcctx.lineTo(19, 30);
            mcctx.lineTo(14, 30);
            mcctx.closePath();
            mcctx.fill();
            this.canvases["moon_crystal"] = mcryst.canvas;

            // 15. MOON CRATER DEPRESSION
            const crater = this.createCanvas(90, 26);
            const crctx = crater.ctx;
            crctx.fillStyle = "#334155";
            crctx.beginPath();
            crctx.ellipse(45, 13, 42, 11, 0, 0, Math.PI * 2);
            crctx.fill();
            crctx.fillStyle = "#1e293b";
            crctx.beginPath();
            crctx.ellipse(45, 14, 36, 8, 0, 0, Math.PI * 2);
            crctx.fill();
            crctx.fillStyle = "#64748b";
            crctx.beginPath();
            crctx.ellipse(45, 10, 40, 2, 0, 0, Math.PI * 2);
            crctx.fill();
            this.canvases["moon_crater"] = crater.canvas;
        }
    };

    EnvLibrary.init = function() {
        this.buildTrees();
        this.buildFoliage();
        this.buildRocks();
        this.buildStructures();
        this.buildInteractables();
        this.buildAtmosphere();
        this.buildSketchFeatures();
    };
    EnvLibrary.init();

    // ============================================================================
    // 5. VALLEY BIOMES CONFIGURATION & ATMOSPHERE
    // ============================================================================
    // ============================================================================
    // 5. VALLEY BIOMES CONFIGURATION & ATMOSPHERE (STORYLINE & EXTENDED RUN)
    // ============================================================================
    const VALLEY_BIOMES = [
        // 0: Surface Trail 5101 (from Sketch: Pit gap with floating block, Oak 5101, Cave Entrance)
        {
            id: "surface_5101",
            name: "Zone 5101: Valley Surface Trail",
            sky: ["#38bdf8", "#7dd3fc", "#bae6fd"],
            mtnFar: "#64748b",
            mtnMid: "#475569",
            grassTop: "#84cc16",
            grassSub: "#4d7c0f",
            dirt: "#78350f",
            groundY: 430,
            gravity: 1200,
            speedMult: 1.0
        },
        // 1: Subterranean Deep Mine 5102 (from Sketch: Cave tunnel, hanging lights that turn off, generator, ladder)
        {
            id: "mine_5102",
            name: "Zone 5102: Deep Cavern Mine",
            sky: ["#050508", "#121118", "#1a1824"],
            mtnFar: "#1e1b4b",
            mtnMid: "#312e81",
            grassTop: "#7e22ce",
            grassSub: "#581c87",
            dirt: "#18181b",
            groundY: 450,
            gravity: 1200,
            speedMult: 1.05,
            hasRoof: true,
            isMine: true
        },
        // 2: Levitating Blocks Sky Parkour 5103 (from Sketch: Stepped floating blocks over abyss/spikes)
        {
            id: "levitating_5103",
            name: "Zone 5103: Levitating Blocks Parkour",
            sky: ["#1e1b4b", "#312e81", "#4338ca"],
            mtnFar: "#4338ca",
            mtnMid: "#6366f1",
            grassTop: "#38bdf8",
            grassSub: "#0284c7",
            dirt: "#0f172a",
            groundY: 430,
            gravity: 1050,
            speedMult: 1.15
        },
        // 3: High-Speed Freight Train Parkour (Parkour on Train)
        {
            id: "train_parkour",
            name: "Subfloor: Speeding Train Parkour (2x Speed!)",
            sky: ["#0f172a", "#1e293b", "#334155"],
            mtnFar: "#b45309",
            mtnMid: "#78350f",
            grassTop: "#f59e0b",
            grassSub: "#b45309",
            dirt: "#451a03",
            groundY: 430,
            gravity: 1200,
            speedMult: 2.0, // 2X SPEED!
            isTrain: true
        },
        // 4: Orbital Rocket Launchpad (Launch to Moon)
        {
            id: "rocket_launchpad",
            name: "Subfloor: Orbital Rocket Launchpad",
            sky: ["#1e293b", "#0f172a", "#020617"],
            mtnFar: "#dc2626",
            mtnMid: "#991b1b",
            grassTop: "#475569",
            grassSub: "#334155",
            dirt: "#1e293b",
            groundY: 430,
            gravity: 1200,
            speedMult: 1.0
        },
        // 5: Lunar Surface ('M') - Low Gravity
        {
            id: "moon_surface",
            name: "The Lunar Surface ('M') - Low Gravity",
            sky: ["#000002", "#020208", "#050510"],
            mtnFar: "#334155",
            mtnMid: "#475569",
            grassTop: "#94a3b8",
            grassSub: "#64748b",
            dirt: "#334155",
            groundY: 430,
            gravity: 340, // Low gravity floaty jumps!
            speedMult: 1.25,
            isMoon: true
        },
        // 6: Glacial Ice Age (Extended procedural progression)
        {
            id: "ice_age",
            name: "Subfloor: Glacial Ice Age",
            sky: ["#e0f2fe", "#bae6fd", "#7dd3fc"],
            mtnFar: "#93c5fd",
            mtnMid: "#60a5fa",
            grassTop: "#f8fafc",
            grassSub: "#e2e8f0",
            dirt: "#94a3b8",
            groundY: 430,
            gravity: 1200,
            speedMult: 1.35
        },
        // 7: Sunscorched Sahara Dunes
        {
            id: "sahara",
            name: "Subfloor: Sunscorched Sahara Dunes",
            sky: ["#f59e0b", "#fbbf24", "#fef08a"],
            mtnFar: "#b45309",
            mtnMid: "#92400e",
            grassTop: "#fde047",
            grassSub: "#eab308",
            dirt: "#ca8a04",
            groundY: 430,
            gravity: 1200,
            speedMult: 0.95
        }
    ];

    function getBiomeForX(x) {
        const totalCycleX = 16800; // 14 chunks per full narrative cycle
        const cycleX = ((x % totalCycleX) + totalCycleX) % totalCycleX;
        if (cycleX < 4800) return VALLEY_BIOMES[0]; // surface_5101
        if (cycleX < 8400) return VALLEY_BIOMES[1]; // mine_5102
        if (cycleX < 10800) return VALLEY_BIOMES[2]; // levitating_5103
        if (cycleX < 13200) return VALLEY_BIOMES[3]; // train_parkour
        if (cycleX < 14400) return VALLEY_BIOMES[4]; // rocket_launchpad
        return VALLEY_BIOMES[5]; // moon_surface
    }

    // Interactive Mine Lighting System (Flashing lights that sometimes shut off)
    const MineState = {
        lightsOn: true,
        flickerTimer: 0,
        cycleTimer: 18.0,
        outageTimer: 0,
        flickering: false,
        toggle() {
            this.lightsOn = true;
            this.outageTimer = 0;
            this.cycleTimer = 24.0;
            this.flickering = false;
            playSound("door");
            playSound("levelup");
            showFloatingText(player.x, player.y - 40, "⚡ MINE GENERATOR RESET! LIGHTS RESTORED! (+50 XP)", "#fde047");
            spawnParticles(player.x, player.y - 20, "#fbbf24", 25);
            addXp(50);
            addResource("coins", 40);
        },
        update(dt, currentBiomeId) {
            if (currentBiomeId !== "mine_5102") {
                this.lightsOn = true;
                return;
            }
            this.cycleTimer -= dt;
            if (this.cycleTimer <= 3.5 && this.cycleTimer > 0) {
                this.flickering = true;
                this.flickerTimer += dt;
                if (Math.random() < 0.22) {
                    this.lightsOn = !this.lightsOn;
                    playSound("electric_flicker");
                }
            } else if (this.cycleTimer <= 0) {
                this.lightsOn = false;
                this.flickering = false;
                this.outageTimer += dt;
                if (this.outageTimer >= 8.0) {
                    this.lightsOn = true;
                    this.cycleTimer = 20.0;
                    this.outageTimer = 0;
                    playSound("door");
                }
            } else {
                this.lightsOn = true;
                this.flickering = false;
            }
        }
    };

    // Rocket Launch & Moon Transit System
    const RocketState = {
        state: "IDLE", // "IDLE", "COUNTDOWN", "LAUNCHING", "SPACE_TRANSIT", "MOON_LANDED"
        timer: 0,
        rocketX: 0,
        rocketY: 0,
        rocketVy: 0,
        startLaunch(rx, ry) {
            if (this.state !== "IDLE" && this.state !== "MOON_LANDED") return;
            this.state = "COUNTDOWN";
            this.timer = 3.0;
            this.rocketX = rx;
            this.rocketY = ry;
            this.rocketVy = 0;
            playSound("door");
            showFloatingText(rx, ry - 60, "🚀 3... 2... 1... IGNITION!", "#fbbf24");
        },
        update(dt) {
            if (this.state === "COUNTDOWN") {
                this.timer -= dt;
                spawnParticles(this.rocketX, this.rocketY + 10, "#e2e8f0", 4);
                if (Math.random() < 0.25) playSound("mine");
                if (this.timer <= 0) {
                    this.state = "LAUNCHING";
                    this.timer = 4.0;
                    playSound("rocket");
                }
            } else if (this.state === "LAUNCHING") {
                this.timer -= dt;
                this.rocketVy += 440 * dt;
                this.rocketY -= this.rocketVy * dt;
                player.x = this.rocketX;
                player.y = this.rocketY;
                player.vy = 0;
                spawnParticles(this.rocketX, this.rocketY + 25, "#f97316", 12);
                spawnParticles(this.rocketX + (Math.random() - 0.5) * 20, this.rocketY + 35, "#fde047", 10);
                if (this.timer <= 0) {
                    this.state = "SPACE_TRANSIT";
                    this.timer = 3.2;
                    playSound("levelup");
                }
            } else if (this.state === "SPACE_TRANSIT") {
                this.timer -= dt;
                player.x += 700 * dt;
                player.y = GROUND_Y;
                if (this.timer <= 0) {
                    this.state = "MOON_LANDED";
                    showFloatingText(player.x, player.y - 50, "🌕 TOUCHDOWN ON THE MOON! LOW GRAVITY!", "#38bdf8");
                    playSound("chest");
                    addXp(100);
                }
            }
        }
    };

    const clouds = [
        { x: 60, y: 45, key: "cloud_puffy_1", speed: 0.08 },
        { x: 380, y: 30, key: "cloud_puffy_2", speed: 0.12 },
        { x: 740, y: 60, key: "cloud_puffy_1", speed: 0.09 },
        { x: 1080, y: 40, key: "cloud_puffy_2", speed: 0.13 }
    ];

    const weatherParticles = [];
    for (let i = 0; i < 70; i++) {
        weatherParticles.push({
            x: Math.random() * V_WIDTH,
            y: Math.random() * V_HEIGHT,
            vx: -1.0 + Math.random() * 2.0,
            vy: 2.0 + Math.random() * 3.5,
            size: Math.random() * 2.5 + 1.0
        });
    }

    const wildlife = [
        { type: "bird", x: 140, y: 90, vx: 1.8, flap: 0 },
        { type: "bird", x: 320, y: 70, vx: 2.2, flap: 0.4 },
        { type: "butterfly", x: 480, y: 370, vx: 0.7, timer: 0 }
    ];

    // ============================================================================
    // 6. FX, PARTICLES & FLOATING FEEDBACK
    // ============================================================================
    const floatingTexts = [];
    function showFloatingText(x, y, text, color = "#38bdf8") {
        floatingTexts.push({ x, y, text, color, alpha: 1.0, vy: -1.8 });
    }

    const particles = [];
    function spawnParticles(x, y, color = "#84cc16", count = 8) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.7) * 6,
                size: Math.random() * 3 + 2,
                color,
                life: 1.0
            });
        }
    }

    // ============================================================================
    // 7. INPUT & CONTROLS (NO AUTO-SPRINT)
    // ============================================================================
    const input = { left: false, right: false, up: false, down: false, jump: false, run: false, interact: false };
    let isHoldingJump = false;

    window.addEventListener("keydown", (e) => {
        if (e.code === "ArrowLeft" || e.key === "a" || e.key === "A") input.left = true;
        if (e.code === "ArrowRight" || e.key === "d" || e.key === "D") input.right = true;
        if (e.code === "ArrowUp" || e.key === "w" || e.key === "W") input.up = true;
        if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") input.down = true;
        if (e.code === "ArrowUp" || e.code === "Space" || e.key === "w" || e.key === "W") {
            if (!isHoldingJump) {
                player.queueJump();
                isHoldingJump = true;
            }
            input.jump = true;
        }
        if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.key === "j" || e.key === "J") input.run = true;
        if (e.key === "e" || e.key === "E") triggerInteraction();
        if (isQuickEventActive) {
            if (e.key === "1") QuickEventManager.handleChoiceClick(0);
            if (e.key === "2") QuickEventManager.handleChoiceClick(1);
            if (e.key === "3") QuickEventManager.handleChoiceClick(2);
        }
        if (e.key === "i" || e.key === "I") openInventory();
        if (e.key === "q" || e.key === "Q") openQuests();
    });

    window.addEventListener("keyup", (e) => {
        if (e.code === "ArrowLeft" || e.key === "a" || e.key === "A") input.left = false;
        if (e.code === "ArrowRight" || e.key === "d" || e.key === "D") input.right = false;
        if (e.code === "ArrowUp" || e.key === "w" || e.key === "W") input.up = false;
        if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") input.down = false;
        if (e.code === "ArrowUp" || e.code === "Space" || e.key === "w" || e.key === "W") {
            input.jump = false;
            isHoldingJump = false;
        }
        if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.key === "j" || e.key === "J") input.run = false;
    });

    function setupTouchControls() {
        const bindTouch = (id, onDown, onUp) => {
            const el = document.getElementById(id);
            if (!el) return;
            const start = (e) => { e.preventDefault(); el.classList.add("active"); onDown(); };
            const end = (e) => { e.preventDefault(); el.classList.remove("active"); onUp(); };
            el.addEventListener("touchstart", start, { passive: false });
            el.addEventListener("touchend", end, { passive: false });
            el.addEventListener("mousedown", start);
            el.addEventListener("mouseup", end);
            el.addEventListener("mouseleave", end);
        };

        bindTouch("btn-left", () => { input.left = true; }, () => { input.left = false; });
        bindTouch("btn-right", () => { input.right = true; }, () => { input.right = false; });
        bindTouch("btn-run", () => { input.run = true; }, () => { input.run = false; });
        bindTouch("btn-jump", () => { player.queueJump(); input.jump = true; }, () => { input.jump = false; });
        
        const interactBtn = document.getElementById("btn-interact");
        if (interactBtn) {
            interactBtn.addEventListener("click", (e) => {
                e.preventDefault();
                triggerInteraction();
            });
        }
    }

    // ============================================================================
    // 8. PROGRESSION, XP & QUEST SYSTEM
    // ============================================================================
    function addXp(amount) {
        SaveData.player.xp += amount;
        showFloatingText(player.x, player.y - 40, "+" + amount + " XP", "#fbbf24");
        if (SaveData.player.xp >= SaveData.player.xpNext) {
            SaveData.player.xp -= SaveData.player.xpNext;
            SaveData.player.level += 1;
            SaveData.player.xpNext = Math.round(SaveData.player.xpNext * 1.45);
            SaveData.resources.coins += 50 * SaveData.player.level;
            playSound("levelup");
            showFloatingText(player.x, player.y - 70, "LEVEL UP! LVL " + SaveData.player.level, "#4ade80");
            spawnParticles(player.x, player.y - 30, "#fbbf24", 25);
        }
        updateHUD();
        saveGame();
    }

    function addResource(type, amt) {
        if (type === "xp") {
            addXp(amt);
            return;
        }
        SaveData.resources.coins = (SaveData.resources.coins || 0) + amt;
        showFloatingText(player.x, player.y - 30, "+" + amt + " GOLD", "#facc15");
        playSound("coin");
        updateHUD();
        saveGame();
    }

    function completeQuest(q) {
        q.done = true;
        SaveData.resources.coins += q.rewardCoins;
        addXp(q.rewardXp);
        playSound("upgrade");
        showFloatingText(player.x, player.y - 60, "QUEST COMPLETE: " + q.title + "!", "#fbbf24");
        spawnParticles(player.x, player.y - 20, "#fbbf24", 20);
    }

    function updateHUD() {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setVal("hud-coins", SaveData.resources.coins || 0);
        setVal("hud-energy", Math.round(SaveData.player.energy) + "/" + SaveData.player.maxEnergy);

        setVal("player-level-text", "LVL " + SaveData.player.level);
        setVal("player-xp-text", SaveData.player.xp + "/" + SaveData.player.xpNext + " XP");
        const xpBar = document.getElementById("player-xp-bar");
        if (xpBar) {
            const pct = Math.min(100, Math.max(0, (SaveData.player.xp / SaveData.player.xpNext) * 100));
            xpBar.style.width = pct + "%";
        }
    }

    // ============================================================================
    // 9. PROCEDURAL WORLD CHUNKS & INTERACTIVE NODES
    // ============================================================================
    const CHUNK_WIDTH = 1200;
    let activeChunks = [];
    let worldGeneratedUpToX = 0;
    let nearestInteractiveNode = null;

    const CHUNK_PRESETS = [
        // Preset 0: School Start Zone
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [{ x: 560, y: 310, w: 240, h: 38 }],
            scenery: [
                { x: 20, y: GROUND_Y + 4, key: "school_start", layer: "midground", w: 460, h: 260 },
                { x: 520, y: GROUND_Y + 4, key: "tree_oak_lush", layer: "midground", w: 110, h: 175 },
                { x: 650, y: GROUND_Y + 4, key: "tree_slender", layer: "midground", w: 85, h: 155 },
                { x: 780, y: GROUND_Y + 4, key: "tree_pine_lush", layer: "midground", w: 95, h: 180 },
                { x: 930, y: GROUND_Y + 4, key: "tree_oak_lush", layer: "midground", w: 110, h: 175 },
                { x: 1070, y: GROUND_Y + 4, key: "tree_slender", layer: "midground", w: 85, h: 155 }
            ],
            interactables: [
                { x: 240, y: GROUND_Y - 20, type: "school", label: "Kós Károly School" },
                { x: 620, y: GROUND_Y - 20, type: "tree", hp: 1, res: "coins", amt: 30, label: "Oak Tree" }
            ],
            pickups: [
                { x: 620, y: 260, type: "coins", amt: 25 },
                { x: 700, y: 260, type: "xp", amt: 35 },
                { x: 950, y: 390, type: "coins", amt: 20 }
            ]
        },
        // Preset 1: Surface 5101 (Ditch pit with chunky Levitating Block & Great Tree 5101)
        {
            ground: [{ x: 0, w: 320 }, { x: 720, w: 480 }],
            waterGaps: [{ x: 320, w: 400 }],
            bridges: [],
            platforms: [
                { x: 400, y: 340, w: 240, h: 42, isLevitating: true } // Chunky Floating block over ditch!
            ],
            scenery: [
                { x: 60, y: GROUND_Y + 4, key: "tree_pine_lush", layer: "midground", w: 95, h: 180 },
                { x: 860, y: GROUND_Y + 4, key: "tree_oak_ancient", layer: "midground", w: 130, h: 190 }, // "Tree 5101"
                { x: 1040, y: GROUND_Y + 4, key: "signpost", layer: "midground", w: 30, h: 44 }
            ],
            interactables: [
                { x: 860, y: GROUND_Y - 20, type: "tree", hp: 2, maxHp: 2, amt: 40, label: "Tree 5101" },
                { x: 1040, y: GROUND_Y - 20, type: "sign", label: "Read 5101 Sign", text: "Valley Trail 5101 • Cave 5102 Ahead" }
            ],
            pickups: [
                { x: 520, y: 290, type: "coins", amt: 40 },
                { x: 520, y: 230, type: "xp", amt: 50 },
                { x: 800, y: 390, type: "coins", amt: 25 }
            ]
        },
        // Preset 2: Kaufland Supermarket & Valley Road
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [{ x: 660, y: 310, w: 240, h: 38 }],
            scenery: [
                { x: 30, y: GROUND_Y + 4, key: "tree_pine_lush", layer: "midground", w: 95, h: 180 },
                { x: 160, y: GROUND_Y + 4, key: "kaufland", layer: "midground", w: 480, h: 240 },
                { x: 660, y: GROUND_Y + 4, key: "tree_oak_lush", layer: "midground", w: 110, h: 175 },
                { x: 800, y: GROUND_Y + 4, key: "tree_slender", layer: "midground", w: 85, h: 155 },
                { x: 940, y: GROUND_Y + 4, key: "tree_pine_lush", layer: "midground", w: 95, h: 180 },
                { x: 1080, y: GROUND_Y + 4, key: "tree_oak_lush", layer: "midground", w: 110, h: 175 }
            ],
            interactables: [
                { x: 400, y: GROUND_Y - 20, type: "kaufland_store", label: "Kaufland Supermarket" },
                { x: 760, y: GROUND_Y - 20, type: "chest", opened: false, label: "Treasure Chest" }
            ],
            pickups: [
                { x: 320, y: 390, type: "coins", amt: 25 },
                { x: 720, y: 260, type: "xp", amt: 35 },
                { x: 1020, y: 390, type: "coins", amt: 20 }
            ]
        },
        // Preset 3: Surface Cliff with Cross Sign & Cave Entrance 5102
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [{ x: 740, y: 270, w: 320, h: 42 }], // High mountain cliff
            scenery: [
                { x: 80, y: GROUND_Y + 4, key: "tree_slender", layer: "midground", w: 85, h: 155 },
                { x: 440, y: GROUND_Y + 4, key: "cave_entrance", layer: "midground", w: 180, h: 140 }, // CAVE ENTRANCE 5102
                { x: 780, y: 270, key: "signpost", layer: "midground", w: 30, h: 44 } // Mountain First-Aid Cross Sign
            ],
            interactables: [
                { x: 530, y: GROUND_Y - 20, type: "sign", label: "Enter Cave 5102", text: "⚠️ CAVE ENTRANCE 5102 • Deep Caverns Below!" },
                { x: 810, y: 230, type: "campfire", label: "Ridge Aid Station" },
                { x: 960, y: 230, type: "chest", opened: false, label: "Summit Cache" }
            ],
            pickups: [
                { x: 320, y: 390, type: "coins", amt: 30 },
                { x: 530, y: 360, type: "xp", amt: 40 },
                { x: 880, y: 220, type: "coins", amt: 50 }
            ]
        },
        // Preset 4: Mine 5102 (Cave Tunnel & Hanging Ceiling Lamps)
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [{ x: 300, y: 330, w: 260, h: 38 }, { x: 720, y: 310, w: 260, h: 38 }],
            scenery: [
                { x: 180, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 440, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 700, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 960, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 540, y: GROUND_Y + 4, key: "mine_cart", layer: "midground", w: 64, h: 42 }
            ],
            interactables: [
                { x: 320, y: GROUND_Y - 20, type: "rock", hp: 3, maxHp: 3, amt: 35, label: "Amethyst Ore" },
                { x: 780, y: GROUND_Y - 20, type: "chest", opened: false, label: "Miner Stash" }
            ],
            pickups: [
                { x: 350, y: 280, type: "coins", amt: 45 },
                { x: 540, y: 390, type: "xp", amt: 50 },
                { x: 780, y: 260, type: "coins", amt: 40 }
            ]
        },
        // Preset 5: Mine 5102 (Interactive Flashing Lights & Generator Box)
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [{ x: 220, y: 320, w: 260, h: 38 }, { x: 660, y: 300, w: 280, h: 38 }],
            scenery: [
                { x: 160, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 420, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 680, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 940, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 820, y: GROUND_Y + 4, key: "mine_cart", layer: "midground", w: 64, h: 42 }
            ],
            interactables: [
                { x: 500, y: GROUND_Y - 20, type: "mine_generator", label: "Reset Power Generator" },
                { x: 860, y: GROUND_Y - 20, type: "rock", hp: 3, maxHp: 3, amt: 40, label: "Gold Vein" }
            ],
            pickups: [
                { x: 280, y: 270, type: "coins", amt: 45 },
                { x: 500, y: 350, type: "xp", amt: 60 },
                { x: 720, y: 250, type: "coins", amt: 50 }
            ]
        },
        // Preset 6: Mine 5102 (Giant Mine Ladder Shaft back up to surface)
        {
            ground: [{ x: 0, w: 660 }],
            waterGaps: [],
            bridges: [],
            platforms: [
                { x: 700, y: 210, w: 500, h: 44 } // Surface cliff platform at top of ladder
            ],
            ladders: [
                { x: 670, y: 210, w: 38, h: 240 } // TALL LADDER CONNECTING MINE FLOOR TO CLIFF
            ],
            scenery: [
                { x: 200, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 480, y: 185, key: "mine_light_hanging", layer: "midground", w: 26, h: 46 },
                { x: 670, y: 450, key: "mine_ladder", layer: "midground", w: 38, h: 240 }
            ],
            interactables: [
                { x: 380, y: GROUND_Y - 20, type: "chest", opened: false, label: "Mine Treasure" },
                { x: 880, y: 170, type: "campfire", label: "Summit Campfire" }
            ],
            pickups: [
                { x: 380, y: 390, type: "coins", amt: 40 },
                { x: 670, y: 310, type: "xp", amt: 55 },
                { x: 920, y: 150, type: "coins", amt: 50 }
            ]
        },
        // Preset 7: Levitating Blocks Parkour 5103 (Stepped floating blocks wave over spikes)
        {
            ground: [{ x: 0, w: 140 }, { x: 1040, w: 160 }],
            waterGaps: [{ x: 140, w: 900 }], // Deep void chasm
            bridges: [],
            platforms: [
                // Ascending stepped floating blocks (w: 140-180, h: 40):
                { x: 160, y: 370, w: 140, h: 40, isLevitating: true },
                { x: 320, y: 310, w: 140, h: 40, isLevitating: true },
                { x: 480, y: 250, w: 150, h: 42, isLevitating: true },
                // Apex floating block:
                { x: 650, y: 190, w: 180, h: 44, isLevitating: true },
                // Descending stepped floating blocks:
                { x: 850, y: 270, w: 150, h: 40, isLevitating: true },
                { x: 980, y: 350, w: 140, h: 40, isLevitating: true }
            ],
            scenery: [
                { x: 240, y: GROUND_Y + 4, key: "rocket_spikes", layer: "midground", w: 60, h: 25 },
                { x: 450, y: GROUND_Y + 4, key: "rocket_spikes", layer: "midground", w: 60, h: 25 },
                { x: 660, y: GROUND_Y + 4, key: "rocket_spikes", layer: "midground", w: 60, h: 25 },
                { x: 870, y: GROUND_Y + 4, key: "rocket_spikes", layer: "midground", w: 60, h: 25 }
            ],
            interactables: [
                { x: 740, y: 150, type: "chest", opened: false, label: "Apex Sky Cache" }
            ],
            pickups: [
                { x: 230, y: 320, type: "coins", amt: 40 },
                { x: 390, y: 260, type: "xp", amt: 45 },
                { x: 740, y: 130, type: "coins", amt: 70 },
                { x: 920, y: 220, type: "xp", amt: 45 }
            ]
        },
        // Preset 8: Levitating Sky Islands (High Runic Parkour)
        {
            ground: [{ x: 0, w: 200 }, { x: 1000, w: 200 }],
            waterGaps: [{ x: 200, w: 800 }],
            bridges: [],
            platforms: [
                { x: 220, y: 330, w: 170, h: 40, isLevitating: true },
                { x: 430, y: 250, w: 180, h: 40, isLevitating: true },
                { x: 650, y: 180, w: 200, h: 44, isLevitating: true },
                { x: 880, y: 270, w: 170, h: 40, isLevitating: true }
            ],
            scenery: [
                { x: 40, y: GROUND_Y + 4, key: "tree_slender", layer: "midground", w: 85, h: 155 },
                { x: 1080, y: GROUND_Y + 4, key: "tree_pine_lush", layer: "midground", w: 95, h: 180 }
            ],
            interactables: [
                { x: 750, y: 140, type: "chest", opened: false, label: "Cloud Treasure" }
            ],
            pickups: [
                { x: 300, y: 280, type: "coins", amt: 45 },
                { x: 520, y: 200, type: "xp", amt: 50 },
                { x: 750, y: 130, type: "coins", amt: 80 }
            ]
        },
        // Preset 9: Speeding Freight Train Parkour (Locomotive & First Container Car)
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [
                // Train car rooftops as parkour platforms:
                { x: 390, y: 340, w: 220, h: 38, isTrainCar: true },
                { x: 630, y: 340, w: 220, h: 38, isTrainCar: true },
                { x: 870, y: 345, w: 220, h: 38, isTrainCar: true }
            ],
            scenery: [
                { x: 160, y: GROUND_Y + 4, key: "train_locomotive", layer: "midground", w: 190, h: 95 },
                { x: 410, y: GROUND_Y + 4, key: "train_car_container", layer: "midground", w: 170, h: 75 },
                { x: 630, y: GROUND_Y + 4, key: "train_car_container", layer: "midground", w: 170, h: 75 },
                { x: 850, y: GROUND_Y + 4, key: "train_car_tanker", layer: "midground", w: 160, h: 70 }
            ],
            interactables: [
                { x: 500, y: 300, type: "chest", opened: false, label: "Cargo Loot" },
                { x: 920, y: 300, type: "chest", opened: false, label: "Tanker Cache" }
            ],
            pickups: [
                { x: 490, y: 280, type: "coins", amt: 50 },
                { x: 710, y: 280, type: "xp", amt: 60 },
                { x: 920, y: 290, type: "coins", amt: 50 }
            ]
        },
        // Preset 10: Speeding Freight Train Parkour 2 (Tankers, Flatbeds & Couplings)
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [
                { x: 100, y: 345, w: 220, h: 38, isTrainCar: true },
                { x: 340, y: 340, w: 220, h: 38, isTrainCar: true },
                { x: 580, y: 345, w: 220, h: 38, isTrainCar: true },
                { x: 820, y: 340, w: 240, h: 38, isTrainCar: true }
            ],
            scenery: [
                { x: 120, y: GROUND_Y + 4, key: "train_car_tanker", layer: "midground", w: 170, h: 70 },
                { x: 350, y: GROUND_Y + 4, key: "train_car_container", layer: "midground", w: 170, h: 75 },
                { x: 580, y: GROUND_Y + 4, key: "train_car_tanker", layer: "midground", w: 170, h: 70 },
                { x: 820, y: GROUND_Y + 4, key: "train_car_container", layer: "midground", w: 180, h: 75 }
            ],
            interactables: [
                { x: 430, y: 300, type: "chest", opened: false, label: "Fast Freight Box" }
            ],
            pickups: [
                { x: 200, y: 290, type: "coins", amt: 50 },
                { x: 430, y: 280, type: "xp", amt: 60 },
                { x: 660, y: 290, type: "coins", amt: 50 },
                { x: 900, y: 280, type: "xp", amt: 60 }
            ]
        },
        // Preset 11: Orbital Rocket Launchpad
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [{ x: 180, y: 310, w: 260, h: 40 }],
            scenery: [
                { x: 360, y: GROUND_Y + 4, key: "rocket_spikes", layer: "midground", w: 60, h: 25 },
                { x: 540, y: GROUND_Y + 4, key: "rocket_ship", layer: "midground", w: 80, h: 180 }, // ORBITAL ROCKET
                { x: 720, y: GROUND_Y + 4, key: "rocket_spikes", layer: "midground", w: 60, h: 25 },
                { x: 960, y: GROUND_Y + 4, key: "signpost", layer: "midground", w: 30, h: 44 }
            ],
            interactables: [
                { x: 580, y: GROUND_Y - 20, type: "rocket_ship", label: "BOARD ROCKET TO MOON" },
                { x: 280, y: 270, type: "chest", opened: false, label: "Gantry Supply" }
            ],
            pickups: [
                { x: 280, y: 250, type: "coins", amt: 60 },
                { x: 580, y: 240, type: "xp", amt: 100 },
                { x: 860, y: 390, type: "coins", amt: 50 }
            ]
        },
        // Preset 12: The Lunar Surface 'M' (Moon Craters & Apollo Flag)
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [{ x: 340, y: 300, w: 240, h: 38 }, { x: 720, y: 280, w: 250, h: 38 }],
            scenery: [
                { x: 240, y: GROUND_Y + 4, key: "moon_crater", layer: "midground", w: 90, h: 26 },
                { x: 480, y: GROUND_Y + 4, key: "moon_flag", layer: "midground", w: 40, h: 55 }, // APOLLO MOON FLAG
                { x: 820, y: GROUND_Y + 4, key: "moon_crater", layer: "midground", w: 90, h: 26 }
            ],
            interactables: [
                { x: 500, y: GROUND_Y - 20, type: "moon_flag", label: "Plant Apollo Moon Flag" },
                { x: 880, y: GROUND_Y - 20, type: "moon_crystal", hp: 3, maxHp: 3, amt: 60, label: "Lunar Crystal" }
            ],
            pickups: [
                { x: 300, y: 370, type: "coins", amt: 70 },
                { x: 500, y: 250, type: "xp", amt: 80 },
                { x: 820, y: 230, type: "coins", amt: 70 }
            ]
        },
        // Preset 13: The Lunar Surface 'M' (Lunar Rover Buggy & Alien Cosmic Gems)
        {
            ground: [{ x: 0, w: 1200 }],
            waterGaps: [],
            bridges: [],
            platforms: [{ x: 240, y: 310, w: 260, h: 38 }, { x: 680, y: 280, w: 280, h: 38 }],
            scenery: [
                { x: 420, y: GROUND_Y + 4, key: "moon_rover", layer: "midground", w: 76, h: 44 },
                { x: 760, y: GROUND_Y + 4, key: "moon_crater", layer: "midground", w: 90, h: 26 },
                { x: 980, y: GROUND_Y + 4, key: "moon_crystal", layer: "midground", w: 32, h: 36 }
            ],
            interactables: [
                { x: 460, y: GROUND_Y - 20, type: "moon_rover", label: "Inspect Lunar Rover" },
                { x: 800, y: GROUND_Y - 20, type: "chest", opened: false, label: "Lunar Cache" },
                { x: 990, y: GROUND_Y - 20, type: "moon_crystal", hp: 3, maxHp: 3, amt: 75, label: "Alien Crystals" }
            ],
            pickups: [
                { x: 320, y: 260, type: "coins", amt: 75 },
                { x: 560, y: 390, type: "coins", amt: 80 },
                { x: 780, y: 230, type: "xp", amt: 90 }
            ]
        }
    ];

    function spawnChunk(originX) {
        const chunkIdx = Math.floor(originX / CHUNK_WIDTH);
        let template;
        if (chunkIdx < CHUNK_PRESETS.length) {
            template = CHUNK_PRESETS[chunkIdx];
        } else {
            // Extended run: loop presets 1 to 13 seamlessly
            const cycleIdx = 1 + ((chunkIdx - CHUNK_PRESETS.length) % (CHUNK_PRESETS.length - 1));
            template = CHUNK_PRESETS[cycleIdx];
        }

        const chunk = {
            x: originX,
            w: CHUNK_WIDTH,
            ground: template.ground.map(g => ({ x: originX + g.x, w: g.w })),
            waterGaps: template.waterGaps.map(w => ({ x: originX + w.x, w: w.w })),
            bridges: template.bridges.map(b => ({ x: originX + b.x, y: b.y, w: b.w, h: b.h, key: b.key })),
            platforms: template.platforms.map(p => ({
                x: originX + p.x,
                y: p.y,
                w: p.w,
                h: p.h,
                isLevitating: p.isLevitating || false,
                isTrainCar: p.isTrainCar || false,
                initY: p.y
            })),
            ladders: (template.ladders || []).map(l => ({
                x: originX + l.x,
                y: l.y,
                w: l.w || 32,
                h: l.h || 220
            })),
            scenery: template.scenery.map(s => ({ x: originX + s.x, y: s.y, key: s.key, layer: s.layer, w: s.w, h: s.h })),
            interactables: template.interactables.map(i => ({
                x: originX + i.x,
                y: i.y,
                type: i.type,
                label: i.label || "Interact",
                hp: i.hp || 1,
                maxHp: i.maxHp || (i.hp || 1),
                amt: i.amt || 30,
                res: i.res || "coins",
                text: i.text || "",
                opened: false,
                depleted: false
            })),
            pickups: template.pickups.map(p => ({
                x: originX + p.x,
                y: p.y,
                type: p.type,
                amt: p.amt,
                collected: false
            }))
        };
        activeChunks.push(chunk);
        worldGeneratedUpToX = originX + CHUNK_WIDTH;
    }

    function initWorld() {
        activeChunks = [];
        worldGeneratedUpToX = 0;
        // Spawn first 4 chunks
        for (let i = 0; i < 4; i++) {
            spawnChunk(worldGeneratedUpToX);
        }
    }

    // ============================================================================
    // 10. INTERACTION TRIGGER & HANDLING
    // ============================================================================
    function triggerInteraction() {
        initAudio();
        if (!nearestInteractiveNode) return;
        const node = nearestInteractiveNode;

        if (node.type === "tree") {
            node.hp -= 1;
            playSound("chop");
            spawnParticles(node.x, node.y, "#b45309", 8);
            if (node.hp <= 0) {
                node.depleted = true;
                const bonus = (SaveData.upgrades.axeLevel - 1) * 4;
                addResource("wood", node.amt + bonus);
                addXp(15);
            } else {
                showFloatingText(node.x, node.y - 20, "CHOP (" + node.hp + "/" + node.maxHp + ")", "#facc15");
            }
        } else if (node.type === "rock") {
            node.hp -= 1;
            playSound("mine");
            spawnParticles(node.x, node.y, "#94a3b8", 8);
            if (node.hp <= 0) {
                node.depleted = true;
                const bonus = (SaveData.upgrades.pickLevel - 1) * 3;
                addResource("stone", node.amt + bonus);
                if (Math.random() < 0.35) addResource("crystals", 1);
                addXp(20);
            } else {
                showFloatingText(node.x, node.y - 20, "MINE (" + node.hp + "/" + node.maxHp + ")", "#facc15");
            }
        } else if (node.type === "chest") {
            if (!node.opened) {
                node.opened = true;
                node.depleted = true;
                playSound("chest");
                spawnParticles(node.x, node.y, "#facc15", 20);
                addResource("coins", 45);
                addResource("crystals", 2);
                addXp(35);
            }
        } else if (node.type === "campfire") {
            SaveData.player.energy = SaveData.player.maxEnergy;
            playSound("door");
            showFloatingText(node.x, node.y - 30, "🔥 RESTED! STAMINA 100%", "#4ade80");
            updateHUD();
        } else if (node.type === "cabin") {
            enterCabinInterior();
        } else if (node.type === "kaufland_store") {
            KauflandShop.open();
        } else if (node.type === "school") {
            showFloatingText(node.x, node.y - 30, "🏫 Kós Károly Elementary - Start Point!", "#38bdf8");
            playSound("pickup");
        } else if (node.type === "sign") {
            showFloatingText(node.x, node.y - 30, node.text || "Valley Trail Ahead", "#38bdf8");
            playSound("pickup");
        } else if (node.type === "mine_generator") {
            MineState.toggle();
            node.depleted = false;
        } else if (node.type === "rocket_ship") {
            RocketState.startLaunch(node.x, node.y);
        } else if (node.type === "moon_flag") {
            if (!node.opened) {
                node.opened = true;
                node.depleted = true;
                playSound("levelup");
                spawnParticles(node.x, node.y - 20, "#38bdf8", 30);
                showFloatingText(node.x, node.y - 45, "🇺🇸 APOLLO FLAG PLANTED ON THE MOON! (+120 XP)", "#38bdf8");
                addXp(120);
                addResource("crystals", 4);
                addResource("coins", 80);
            }
        } else if (node.type === "moon_rover") {
            if (!node.opened) {
                node.opened = true;
                playSound("chest");
                spawnParticles(node.x, node.y - 15, "#fbbf24", 20);
                showFloatingText(node.x, node.y - 40, "🚀 LUNAR ROVER INSPECTED! (+80 XP)", "#fbbf24");
                addXp(80);
                addResource("coins", 75);
                addResource("crystals", 2);
            }
        } else if (node.type === "moon_crystal") {
            node.hp -= 1;
            playSound("mine");
            spawnParticles(node.x, node.y - 15, "#c084fc", 12);
            if (node.hp <= 0) {
                node.depleted = true;
                addResource("crystals", 5);
                addXp(45);
                playSound("levelup");
                showFloatingText(node.x, node.y - 30, "💎 +5 ALIEN CRYSTALS! (+45 XP)", "#c084fc");
            } else {
                showFloatingText(node.x, node.y - 20, "MINE CRYSTAL (" + node.hp + "/" + node.maxHp + ")", "#c084fc");
            }
        }
    }

    // ============================================================================
    // 11. CABIN HOMESTEAD INTERIOR MODAL & TABS
    // ============================================================================
    function enterCabinInterior() {
        initAudio();
        playSound("door");
        const modal = document.getElementById("cabin-modal");
        if (modal) modal.classList.remove("hidden");
        const startModal = document.getElementById("start-modal");
        if (startModal) startModal.classList.add("hidden");
        switchCabinTab("upgrades");
    }

    function exitCabinInterior() {
        initAudio();
        playSound("door");
        const modal = document.getElementById("cabin-modal");
        if (modal) modal.classList.add("hidden");
        if (gameState === "MENU") {
            const startModal = document.getElementById("start-modal");
            if (startModal) startModal.classList.remove("hidden");
        }
    }

    function switchCabinTab(tab) {
        const tabs = ["upgrades", "inventory", "quests", "marta"];
        for (const t of tabs) {
            const btn = document.getElementById("tab-" + t);
            const content = document.getElementById("cabin-tab-content-" + t);
            if (btn) btn.classList.toggle("active", t === tab);
            if (content) content.classList.toggle("hidden", t !== tab);
        }

        if (tab === "upgrades") renderUpgradesUI();
        if (tab === "inventory") renderInventoryUI("cabin-tab-content-inventory");
        if (tab === "quests") renderQuestsUI("cabin-tab-content-quests");
    }

    function renderUpgradesUI() {
        const container = document.getElementById("cabin-tab-content-upgrades");
        if (!container) return;

        let html = "";
        for (const up of upgradeDefs) {
            const curLvl = SaveData.upgrades[up.key] || 1;
            const costCoins = up.coins * curLvl;

            html += `
            <div class="upgrade-card">
                <div class="upgrade-card-header">
                    <span>${up.name}</span>
                    <span style="color:#fbbf24; font-size:12px;">LVL ${curLvl}</span>
                </div>
                <div class="upgrade-card-desc">${up.desc}</div>
                <div class="upgrade-card-cost">Cost: 🪙 ${costCoins} Gold</div>
                <button class="btn-upgrade" onclick="buyUpgrade('${up.key}', ${costCoins})">
                    UPGRADE (LVL ${curLvl + 1})
                </button>
            </div>`;
        }
        container.innerHTML = html;
    }

    function buyUpgrade(key, costCoins) {
        initAudio();
        const r = SaveData.resources;
        if ((r.coins || 0) >= costCoins) {
            r.coins -= costCoins;
            SaveData.upgrades[key] = (SaveData.upgrades[key] || 1) + 1;
            playSound("upgrade");
            addXp(35);
            saveGame();
            updateHUD();
            renderUpgradesUI();
            showFloatingText(player.x, player.y - 30, "UPGRADE UNLOCKED!", "#4ade80");
        } else {
            playSound("hit");
            showFloatingText(player.x, player.y - 30, "NOT ENOUGH GOLD!", "#ef4444");
        }
    }

    function renderInventoryUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const items = [
            { name: "Gold Coins", qty: SaveData.resources.coins, icon: "🪙", color: "#facc15" },
            { name: "Timber Logs", qty: SaveData.resources.wood, icon: "🪵", color: "#b45309" },
            { name: "Granite Stone", qty: SaveData.resources.stone, icon: "🪨", color: "#94a3b8" },
            { name: "Valley Crystals", qty: SaveData.resources.crystals, icon: "💎", color: "#c084fc" },
            { name: "Wild Herbs", qty: SaveData.resources.herbs, icon: "🌿", color: "#4ade80" },
            { name: "Camp Food", qty: SaveData.resources.food, icon: "🌾", color: "#fbbf24" }
        ];

        let html = "";
        for (const it of items) {
            html += `
            <div class="inventory-slot">
                <div style="font-size:24px;">${it.icon}</div>
                <div class="inventory-slot-name">${it.name}</div>
                <div class="inventory-slot-qty">${it.qty}</div>
            </div>`;
        }
        container.innerHTML = html;
    }

    function renderQuestsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = "";
        for (const q of SaveData.quests) {
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
            html += `
            <div class="upgrade-card">
                <div class="upgrade-card-header">
                    <span>${q.title}</span>
                    <span style="color:${q.done ? '#4ade80' : '#fbbf24'}; font-size:12px;">${q.done ? 'COMPLETED' : pct + '%'}</span>
                </div>
                <div class="upgrade-card-desc">${q.desc} (${q.progress}/${q.target})</div>
                <div class="xp-bar-container" style="margin-top:6px;">
                    <div class="xp-bar-fill" style="width:${pct}%; background:${q.done ? '#4ade80' : '#fbbf24'};"></div>
                </div>
                <div class="upgrade-card-cost">Reward: +${q.rewardCoins} Coins &bull; +${q.rewardXp} XP</div>
            </div>`;
        }
        container.innerHTML = html;
    }

    function restAtHearth() {
        SaveData.player.energy = SaveData.player.maxEnergy;
        playSound("door");
        showFloatingText(player.x, player.y - 30, "🔥 STAMINA RESTORED 100%!", "#4ade80");
        updateHUD();
        saveGame();
    }

    function openInventory() {
        initAudio();
        renderInventoryUI("quick-inventory-grid");
        const modal = document.getElementById("inventory-modal");
        if (modal) modal.classList.remove("hidden");
    }

    function closeInventory() {
        const modal = document.getElementById("inventory-modal");
        if (modal) modal.classList.add("hidden");
    }

    function openQuests() {
        initAudio();
        renderQuestsUI("quick-quests-list");
        const modal = document.getElementById("quests-modal");
        if (modal) modal.classList.remove("hidden");
    }

    function closeQuests() {
        const modal = document.getElementById("quests-modal");
        if (modal) modal.classList.add("hidden");
    }

    function openSettings() {
        initAudio();
        const modal = document.getElementById("settings-modal");
        if (modal) modal.classList.remove("hidden");
        updateAudioIcon();
    }

    function closeSettings() {
        const modal = document.getElementById("settings-modal");
        if (modal) modal.classList.add("hidden");
    }

    function toggleAudioSetting() {
        toggleAudio();
    }

    function setControlsScale(scale) {
        initAudio();
        playSound("coin");
        const mc = document.querySelector(".mobile-controls");
        if (mc) {
            mc.style.transform = `scale(${scale})`;
            mc.style.transformOrigin = "bottom center";
        }
        showFloatingText(player.x, player.y - 30, `Controls Scale: ${Math.round(scale * 100)}%`, "#facc15");
    }

    let isHighContrast = true;
    function toggleHighContrast() {
        initAudio();
        playSound("coin");
        isHighContrast = !isHighContrast;
        const mc = document.querySelector(".mobile-controls");
        const btn = document.getElementById("setting-high-contrast");
        if (mc) {
            if (isHighContrast) {
                mc.style.filter = "drop-shadow(0 0 10px rgba(250, 204, 21, 0.6)) contrast(1.15)";
            } else {
                mc.style.filter = "none";
            }
        }
        if (btn) {
            btn.classList.toggle("active", isHighContrast);
            btn.innerText = isHighContrast ? "HIGH" : "NORMAL";
        }
    }

    function toggleFullscreen() {
        initAudio();
        playSound("coin");
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }

    window.enterCabinInterior = enterCabinInterior;
    window.exitCabinInterior = exitCabinInterior;
    window.switchCabinTab = switchCabinTab;
    window.buyUpgrade = buyUpgrade;
    window.restAtHearth = restAtHearth;
    window.openInventory = openInventory;
    window.closeInventory = closeInventory;
    window.openQuests = openQuests;
    window.closeQuests = closeQuests;
    window.toggleAudio = toggleAudio;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    window.toggleAudioSetting = toggleAudioSetting;
    window.setControlsScale = setControlsScale;
    window.toggleHighContrast = toggleHighContrast;
    window.toggleFullscreen = toggleFullscreen;

    // ============================================================================
    // 11B. KAUFLAND SUPERMARKET SHOP SYSTEM
    // ============================================================================
    const KAUFLAND_PRODUCTS = [
        // Category: Food & Snacks
        {
            id: "red_bull",
            name: "Red Bull",
            cat: "drinks",
            price: 250,
            iconImg: "assets/items/red_bull.png",
            buff: "⚡ +60 Max Energy & Sprint",
            type: "energy",
            energyBoost: 60,
            speedBoost: 30
        },
        {
            id: "coca_cola",
            name: "Coca Cola",
            cat: "drinks",
            price: 120,
            iconImg: "assets/items/coca_cola.png",
            buff: "⚡ +30 Energy",
            type: "energy",
            energyBoost: 30
        },
        {
            id: "pepsi",
            name: "Pepsi",
            cat: "drinks",
            price: 120,
            iconImg: "assets/items/pepsi.png",
            buff: "⚡ +30 Energy",
            type: "energy",
            energyBoost: 30
        },
        {
            id: "sprite",
            name: "Sprite",
            cat: "drinks",
            price: 120,
            iconImg: "assets/items/sprite.png",
            buff: "⚡ +30 Energy Refresh",
            type: "energy",
            energyBoost: 30
        },
        {
            id: "milka",
            name: "Milka",
            cat: "food",
            price: 180,
            iconImg: "assets/items/milka.png",
            buff: "✨ +50 Player XP",
            type: "xp",
            xpBoost: 50
        },
        {
            id: "snickers",
            name: "Snickers",
            cat: "snacks",
            price: 160,
            iconImg: "assets/items/snickers.png",
            buff: "⚡ +45 Energy & Stamina",
            type: "energy",
            energyBoost: 45
        },
        {
            id: "kitkat",
            name: "KitKat",
            cat: "snacks",
            price: 160,
            iconImg: "assets/items/kitkat.png",
            buff: "⚡ +40 Energy",
            type: "energy",
            energyBoost: 40
        },
        {
            id: "bounty",
            name: "Bounty",
            cat: "snacks",
            price: 160,
            iconImg: "assets/items/bounty.png",
            buff: "✨ +40 Player XP",
            type: "xp",
            xpBoost: 40
        },
        {
            id: "kinder_bueno",
            name: "Kinder Bueno",
            cat: "snacks",
            price: 180,
            iconImg: "assets/items/kinder_bueno.png",
            buff: "⚡ +50 Energy Boost",
            type: "energy",
            energyBoost: 50
        },
        {
            id: "lays",
            name: "Lay's",
            cat: "snacks",
            price: 150,
            iconImg: "assets/items/lays.png",
            buff: "💨 +20 Sprint Speed",
            type: "speed",
            speedBoost: 20
        },
        // Category: Other
        {
            id: "kaufland_bag",
            name: "Kaufland Eco Bag",
            cat: "other",
            price: 90,
            iconImg: "assets/items/lays.png",
            buff: "🎒 +1 Extra Backpack Capacity",
            type: "backpack"
        },
        {
            id: "fresh_apple",
            name: "Fresh Valley Fruit",
            cat: "food",
            price: 75,
            iconImg: "assets/items/sprite.png",
            buff: "🍎 +25 Energy Refresh",
            type: "energy",
            energyBoost: 25
        }
    ];

    let currentKauflandCategory = "food";
    let purchasedCartCount = 0;

    const KauflandShop = {
        open() {
            initAudio();
            playSound("door");
            timeScale = 0; // Pause game during shopping
            currentKauflandCategory = "food";
            this.render();
            const modal = document.getElementById("kaufland-modal");
            if (modal) modal.classList.remove("hidden");
        },

        close() {
            initAudio();
            playSound("door");
            timeScale = 1.0; // Resume expedition
            const modal = document.getElementById("kaufland-modal");
            if (modal) modal.classList.add("hidden");
        },

        switchCategory(cat) {
            initAudio();
            currentKauflandCategory = cat;
            const catTabs = ["food", "drinks", "snacks", "other"];
            for (const c of catTabs) {
                const btn = document.getElementById("ktab-" + c);
                if (btn) btn.classList.toggle("active", c === cat);
            }
            this.render();
        },

        render() {
            const coinsEl = document.getElementById("kaufland-coins-display");
            if (coinsEl) coinsEl.innerText = (SaveData.resources.coins || 0).toLocaleString();

            const cartCountEl = document.getElementById("kaufland-cart-count");
            if (cartCountEl) cartCountEl.innerText = purchasedCartCount;

            const grid = document.getElementById("kaufland-grid");
            if (!grid) return;

            // Filter by category or show all for "food" (default shows both food & all popular items)
            let items = KAUFLAND_PRODUCTS;
            if (currentKauflandCategory === "drinks") {
                items = KAUFLAND_PRODUCTS.filter(p => p.cat === "drinks");
            } else if (currentKauflandCategory === "snacks") {
                items = KAUFLAND_PRODUCTS.filter(p => p.cat === "snacks");
            } else if (currentKauflandCategory === "other") {
                items = KAUFLAND_PRODUCTS.filter(p => p.cat === "other");
            } else {
                // "food" category shows the full main 10-item supermarket showcase as in the user reference
                items = KAUFLAND_PRODUCTS.slice(0, 10);
            }

            let html = "";
            for (const item of items) {
                html += `
                <div class="kaufland-item-card">
                    <div class="kaufland-item-img-wrap">
                        <img src="${item.iconImg}" alt="${item.name}" class="kaufland-item-img" onerror="this.style.display='none'">
                    </div>
                    <div class="kaufland-item-name">${item.name}</div>
                    <div class="kaufland-item-buff">${item.buff}</div>
                    <div class="kaufland-item-price">🪙 ${item.price}</div>
                    <button class="kaufland-buy-btn" onclick="KauflandShop.buy('${item.id}')">Buy</button>
                </div>`;
            }
            grid.innerHTML = html;
        },

        buy(productId) {
            initAudio();
            const product = KAUFLAND_PRODUCTS.find(p => p.id === productId);
            if (!product) return;

            const r = SaveData.resources;
            if ((r.coins || 0) >= product.price) {
                r.coins -= product.price;
                purchasedCartCount++;
                playSound("pickup");

                // Apply buff
                if (product.energyBoost) {
                    SaveData.player.energy = Math.min(SaveData.player.maxEnergy + 30, SaveData.player.energy + product.energyBoost);
                }
                if (product.xpBoost) {
                    addXp(product.xpBoost);
                }
                if (product.speedBoost) {
                    player.vx += 30;
                }

                saveGame();
                updateHUD();
                this.render();
                showFloatingText(player.x, player.y - 30, `🛒 BOUGHT ${product.name}! ${product.buff}`, "#4ade80");
            } else {
                playSound("hit");
                showFloatingText(player.x, player.y - 30, "NOT ENOUGH GOLD COINS!", "#ef4444");
            }
        },

        showCartInfo() {
            showFloatingText(player.x, player.y - 30, `🛒 ${purchasedCartCount} Kaufland items purchased this run!`, "#facc15");
        }
    };

    window.KauflandShop = KauflandShop;

    // ============================================================================
    // 12. ENTITIES: TIMI (PLAYER), MÁRTA (COMPANION), ENCI (PURSUER)
    // ============================================================================
    let gameState = "MENU"; // MENU, PLAYING, GAMEOVER
    let gameTime = 0;
    let score = 0;
    let startCutsceneTimer = 0;

    const player = {
        x: 300,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        grounded: true,
        climbing: false,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
        facing: 1,
        state: "idle",
        frameIndex: 0,
        frameTimer: 0,
        hurtTimer: 0,

        reset() {
            this.x = 300;
            this.y = GROUND_Y;
            this.vx = 0;
            this.vy = 0;
            this.grounded = true;
            this.climbing = false;
            this.state = "idle";
            this.frameIndex = 0;
            this.frameTimer = 0;
            this.hurtTimer = 0;
        },

        queueJump() {
            this.jumpBufferTimer = 0.18;
        },

        update(dt) {
            const currentBiome = getBiomeForX(this.x);
            const biomeSpeedMult = currentBiome.speedMult || 1.0;
            const biomeGravity = currentBiome.gravity || 1200;

            const speedMultiplier = (1.0 + (SaveData.upgrades.speedLevel - 1) * 0.08) * biomeSpeedMult;
            const baseRunSpeed = 210 * speedMultiplier;
            let targetSpeed = baseRunSpeed;

            // Manual Sprint: only when holding shift/J or touch RUN button
            if (input.run && SaveData.player.energy > 0) {
                targetSpeed = 295 * speedMultiplier;
                SaveData.player.energy = Math.max(0, SaveData.player.energy - dt * 6.5);
            } else {
                SaveData.player.energy = Math.min(SaveData.player.maxEnergy, SaveData.player.energy + dt * 4.0);
            }

            // Ladder Climbing Detection
            let onLadder = false;
            for (const chunk of activeChunks) {
                for (const l of (chunk.ladders || [])) {
                    if (this.x >= l.x - 18 && this.x <= l.x + l.w + 18 && this.y >= l.y - 12 && this.y <= l.y + l.h + 20) {
                        onLadder = true;
                        if (input.up || (input.jump && this.y > l.y + 12)) {
                            this.climbing = true;
                            this.vy = -180;
                            this.vx = 0;
                            if (this.y <= l.y + 4) {
                                this.climbing = false;
                                this.y = l.y;
                            }
                        } else if (input.down) {
                            this.climbing = true;
                            this.vy = 180;
                            this.vx = 0;
                        } else if (this.climbing) {
                            this.vy = 0;
                            this.vx = 0;
                        }
                    }
                }
            }
            if (!onLadder) this.climbing = false;

            if (!this.climbing) {
                const accel = 1800;

                if (input.left) {
                    this.vx = Math.max(this.vx - accel * dt, -targetSpeed * 0.6);
                    this.facing = -1;
                } else if (input.right) {
                    this.vx = Math.min(this.vx + accel * dt, targetSpeed * 1.15);
                    this.facing = 1;
                } else {
                    this.vx = targetSpeed;
                    this.facing = 1;
                }

                // Coyote time & Jump buffering
                if (this.grounded) {
                    this.coyoteTimer = 0.12;
                } else {
                    this.coyoteTimer -= dt;
                }

                if (this.jumpBufferTimer > 0) {
                    this.jumpBufferTimer -= dt;
                }

                if ((input.jump || this.jumpBufferTimer > 0) && (this.coyoteTimer > 0 || onLadder)) {
                    const jumpBonus = (SaveData.upgrades.jumpLevel - 1) * 0.08;
                    let jumpImpulse = currentBiome.isMoon ? -580 : (-490 * (1.0 + jumpBonus));
                    if (currentBiome.isFlying) jumpImpulse *= 1.25;
                    if (currentBiome.isSwimming) jumpImpulse *= 0.75;

                    this.vy = jumpImpulse;
                    this.grounded = false;
                    this.climbing = false;
                    this.coyoteTimer = 0;
                    this.jumpBufferTimer = 0;
                    playSound("jump");
                    spawnParticles(this.x, this.y, currentBiome.isMoon ? "#94a3b8" : "#84cc16", 8);
                }
            }

            // Variable Jump Cut (Release jump for short hop, hold for full leap)
            if (!input.jump && this.vy < -110 && !this.climbing) {
                this.vy *= 0.62;
            }

            // Gravity & Position Integration
            if (!this.climbing) {
                this.vy += biomeGravity * dt;
            }
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Ground & Platform Collision Check
            this.grounded = false;
            let onBridgeOrPlatform = false;

            for (const chunk of activeChunks) {
                for (const p of chunk.platforms) {
                    let platY = p.y;
                    if (p.isLevitating) {
                        platY = (p.initY || p.y) + Math.sin(performance.now() * 0.003 + p.x * 0.01) * 7;
                        p.y = platY;
                    }
                    if (this.x >= p.x - 22 && this.x <= p.x + p.w + 22 && this.y >= platY - 8 && this.y <= platY + 18 && this.vy >= 0) {
                        this.y = platY;
                        this.vy = 0;
                        this.grounded = true;
                        onBridgeOrPlatform = true;
                    }
                }
                for (const b of chunk.bridges) {
                    if (this.x >= b.x - 12 && this.x <= b.x + b.w + 12 && this.y >= b.y - 8 && this.y <= b.y + 16 && this.vy >= 0) {
                        this.y = b.y;
                        this.vy = 0;
                        this.grounded = true;
                        onBridgeOrPlatform = true;
                    }
                }
            }

            if (!onBridgeOrPlatform && !this.climbing && this.y >= GROUND_Y) {
                this.y = GROUND_Y;
                this.vy = 0;
                this.grounded = true;
            }

            // Hurt Timer
            if (this.hurtTimer > 0) {
                this.hurtTimer -= dt;
            }

            // Animation State Determination
            if (gameState === "GAMEOVER") {
                this.state = "dead";
            } else if (this.hurtTimer > 0) {
                this.state = "hurt";
            } else if (this.climbing) {
                this.state = "climb";
            } else if (!this.grounded) {
                this.state = "jump";
            } else if (Math.abs(this.vx) > 250) {
                this.state = "sprint";
            } else if (Math.abs(this.vx) > 8) {
                this.state = "run";
            } else {
                this.state = "idle";
            }

            // Frame Animation Update
            this.frameTimer += dt;
            let activeAnimFrames = assets.char2_run;
            let frameRate = 0.08;

            if (this.state === "dead") {
                activeAnimFrames = assets.char2_dead;
                frameRate = 0.12;
            } else if (this.state === "hurt") {
                activeAnimFrames = assets.char2_hurt;
                frameRate = 0.10;
            } else if (this.state === "jump") {
                activeAnimFrames = assets.char2_jump;
                frameRate = 0.08;
            } else if (this.state === "sprint") {
                activeAnimFrames = assets.char2_run;
                frameRate = 0.05;
            } else if (this.state === "run") {
                activeAnimFrames = assets.char2_walk;
                frameRate = 0.08;
            } else if (this.state === "idle") {
                activeAnimFrames = assets.char2_idle;
                frameRate = 0.15;
            }

            if (this.frameTimer >= frameRate) {
                this.frameTimer = 0;
                if (this.state === "dead") {
                    this.frameIndex = Math.min(this.frameIndex + 1, activeAnimFrames.length - 1);
                } else {
                    this.frameIndex = (this.frameIndex + 1) % activeAnimFrames.length;
                }
            }

            // Magnet Loot Vacuum
            const magnetRadius = 35 + (SaveData.upgrades.magnetLevel - 1) * 25;
            for (const chunk of activeChunks) {
                for (const p of chunk.pickups) {
                    if (!p.collected) {
                        const dist = Math.hypot(this.x - p.x, this.y - p.y);
                        if (dist < magnetRadius) {
                            p.collected = true;
                            addResource(p.type, p.amt);
                            addXp(5);
                        }
                    }
                }
            }

            // Proximity Check for Nearest Interactive Node
            nearestInteractiveNode = null;
            let closestDist = 65;
            for (const chunk of activeChunks) {
                for (const node of chunk.interactables) {
                    if (!node.depleted) {
                        const d = Math.hypot(this.x - node.x, this.y - node.y);
                        if (d < closestDist) {
                            closestDist = d;
                            nearestInteractiveNode = node;
                        }
                    }
                }
            }

            const interactBtn = document.getElementById("btn-interact");
            if (interactBtn) {
                interactBtn.classList.toggle("pulse", nearestInteractiveNode !== null);
            }

            // Distance Quest Check
            const distMeters = Math.max(0, Math.round(this.x / 12));
            for (const q of SaveData.quests) {
                if (q.id === "q_dist" && !q.done) {
                    q.progress = Math.min(q.target, distMeters);
                    if (q.progress >= q.target) completeQuest(q);
                }
            }
        },

        render(camX) {
            const screenX = this.x - camX;
            const screenY = this.y;

            let activeAnimFrames = assets.char2_run;
            if (this.state === "dead") activeAnimFrames = assets.char2_dead;
            else if (this.state === "hurt") activeAnimFrames = assets.char2_hurt;
            else if (this.state === "jump") activeAnimFrames = assets.char2_jump;
            else if (this.state === "sprint") activeAnimFrames = assets.char2_run;
            else if (this.state === "run") activeAnimFrames = assets.char2_walk;
            else if (this.state === "idle") activeAnimFrames = assets.char2_idle;

            const curImg = activeAnimFrames[this.frameIndex % activeAnimFrames.length] || assets.char2_run[0];

            // Soft Shadow
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
            ctx.beginPath();
            ctx.ellipse(screenX, screenY + 2, 22, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (curImg && curImg.complete && curImg.naturalWidth > 0) {
                const renderH = 92;
                const imgAspect = curImg.naturalWidth / curImg.naturalHeight;
                const renderW = renderH * imgAspect;

                ctx.save();
                ctx.translate(screenX, screenY);
                if (this.facing < 0) {
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(curImg, -renderW / 2, -renderH, renderW, renderH);
                ctx.restore();
            }

                        drawNameplate(screenX, screenY - 98, "Timi", "#38bdf8");
        }
    };

    const marta = {
        x: 230,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        grounded: true,
        frameIndex: 0,
        frameTimer: 0,

        reset() {
            this.x = player.x - 70;
            this.y = GROUND_Y;
            this.vx = 0;
            this.vy = 0;
            this.frameIndex = 0;
            this.frameTimer = 0;
        },

        update(dt) {
            const targetX = player.x - 65;
            const dist = targetX - this.x;
            this.vx = dist * 4.2;
            this.x += this.vx * dt;
            this.y = player.y;

            this.frameTimer += dt;
            const isMoving = Math.abs(this.vx) > 10;
            const animFrames = gameState === "GAMEOVER" ? assets.char1_dead : (isMoving ? assets.char1_run : assets.char1_idle);
            const frameRate = isMoving ? 0.08 : 0.15;

            if (this.frameTimer >= frameRate) {
                this.frameTimer = 0;
                if (gameState === "GAMEOVER") {
                    this.frameIndex = Math.min(this.frameIndex + 1, animFrames.length - 1);
                } else {
                    this.frameIndex = (this.frameIndex + 1) % animFrames.length;
                }
            }
        },

        render(camX) {
            const screenX = this.x - camX;
            const screenY = this.y;
            const isMoving = Math.abs(this.vx) > 10;
            const animFrames = gameState === "GAMEOVER" ? assets.char1_dead : (isMoving ? assets.char1_run : assets.char1_idle);
            const curImg = animFrames[this.frameIndex % animFrames.length] || assets.char1_run[0];

            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
            ctx.beginPath();
            ctx.ellipse(screenX, screenY + 2, 18, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (curImg && curImg.complete && curImg.naturalWidth > 0) {
                const renderH = 88;
                const imgAspect = curImg.naturalWidth / curImg.naturalHeight;
                const renderW = renderH * imgAspect;

                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.drawImage(curImg, -renderW / 2, -renderH, renderW, renderH);
                ctx.restore();
            }

            drawNameplate(screenX, screenY - 94, "Márta", "#a855f7");
        }
    };

    const enci = {
        x: -3300, // Starts 300m behind player (3600px)
        y: GROUND_Y,
        vx: 215,
        frameIndex: 0,
        frameTimer: 0,

        reset() {
            this.x = player.x - 3600;
            this.y = GROUND_Y;
            this.vx = 215;
            this.frameIndex = 0;
            this.frameTimer = 0;
        },

        update(dt) {
            // Accelerates slightly every minute of running
            const speedUp = (gameTime / 60.0) * 12;
            this.vx = 220 + speedUp;
            this.x += this.vx * dt;
            this.y = GROUND_Y;

            this.frameTimer += dt;
            const animFrames = gameState === "GAMEOVER" ? assets.enci_idle : assets.enci_run;
            if (this.frameTimer >= 0.08) {
                this.frameTimer = 0;
                this.frameIndex = (this.frameIndex + 1) % animFrames.length;
            }

            // Catch check
            if (gameState === "PLAYING" && startCutsceneTimer <= 0 && this.x >= player.x - 25) {
                gameState = "GAMEOVER";
                playSound("hit");
            }
        },

        render(camX) {
            const screenX = this.x - camX;
            const screenY = this.y;
            const animFrames = gameState === "GAMEOVER" ? assets.enci_idle : assets.enci_run;
            const curImg = animFrames[this.frameIndex % animFrames.length] || assets.enci_run[0];

            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.beginPath();
            ctx.ellipse(screenX, screenY + 2, 28, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (curImg && curImg.complete && curImg.naturalWidth > 0) {
                const renderH = 96;
                const imgAspect = curImg.naturalWidth / curImg.naturalHeight;
                const renderW = renderH * imgAspect;

                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.drawImage(curImg, -renderW / 2, -renderH, renderW, renderH);
                ctx.restore();
            }

            drawNameplate(screenX, screenY - 102, "Enci", "#ef4444");
        }
    };

    function drawNameplate(screenX, screenY, nameText, color) {
        ctx.save();
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const w = ctx.measureText(nameText).width + 12;
        ctx.fillStyle = "rgba(11, 15, 30, 0.85)";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(screenX - w / 2, screenY - 8, w, 16, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillText(nameText, screenX, screenY);
        ctx.restore();
    }


    // ============================================================================
    // 8B. QUICK DECISION EVENT SYSTEM (50 SCENARIOS & REUSABLE FRAMEWORK)
    // ============================================================================
    let timeScale = 1.0;
    let isQuickEventActive = false;
    let quickEventTimer = 7.0;
    let currentQuickEvent = null;
    let quickEventCooldown = 30.0; // initial grace period
    let lastQuickEventDistance = 0;
    let quickEventResultTimer = 0;

    const QuickEventManager = {
        pool: [
            // SKETCH ZONE 5102 — CAVE ENTRANCE
            {
                id: "sketch_cave_entry",
                title: "Zone 5102: Deep Mine Entrance",
                desc: "A dark cavern entrance yawns before you with heavy timber beams marked 'CAVE 5102'.",
                choices: [
                    {
                        title: "Plunge into Mine Cavern",
                        icon: "⛏️",
                        desc: "Venture deep underground into the subterranean tunnel.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(50);
                            player.x += 220;
                            playSound("door");
                            return { success: true, title: "ENTERED MINE 5102", text: "+50 XP • Entered deep underground cavern!" };
                        }
                    },
                    {
                        title: "Scramble Mountain Ridge",
                        icon: "⛰️",
                        desc: "Climb over the treacherous rocky ridge above the cave.",
                        cost: { energy: 15 },
                        risk: "MEDIUM",
                        action: () => {
                            addXp(35);
                            player.x += 160;
                            return { success: true, title: "RIDGE CLIMBED", text: "-15 Stamina • +35 XP • Hiked outer perimeter." };
                        }
                    }
                ]
            },
            // SKETCH ZONE 5103 — LEVITATING BLOCKS PARKOUR
            {
                id: "sketch_levitating_parkour",
                title: "Zone 5103: Levitating Runic Blocks",
                desc: "Ancient levitating stone blocks hover in a stepped wave over a pit of razor spikes!",
                choices: [
                    {
                        title: "Channel Anti-Gravity Leap",
                        icon: "✨",
                        desc: "Harmonize with the runic thrusters to glide across the floating monoliths.",
                        cost: { energy: 10 },
                        risk: "LOW",
                        action: () => {
                            addXp(65);
                            player.x += 260;
                            playSound("levelup");
                            return { success: true, title: "RUNIC PARKOUR MASTER!", text: "+65 XP • Soared across levitating stones!" };
                        }
                    },
                    {
                        title: "Edge Along Spiked Ledge",
                        icon: "⚠️",
                        desc: "Carefully shimmy around the perimeter spikes.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.4) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 25);
                                return { success: false, title: "SPIKE GRAZE", text: "Scratched by spikes! -25 Stamina." };
                            }
                            addXp(40);
                            player.x += 180;
                            return { success: true, title: "CLEARED SPIKES", text: "+40 XP • Safely navigated spiked rim." };
                        }
                    }
                ]
            },
            // SKETCH SUBFLOOR — SPEEDING FREIGHT TRAIN PARKOUR
            {
                id: "sketch_train_parkour",
                title: "Speeding Train Parkour (2x Speed!)",
                desc: "A massive freight train roars down the valley tracks at 200 km/h! Leap onto the car rooftops!",
                choices: [
                    {
                        title: "Rooftop Train Sprint",
                        icon: "🚂",
                        desc: "Sprint across container rooftops at 2x extreme speed!",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(75);
                            addResource("coins", 60);
                            player.x += 320;
                            playSound("train_whistle");
                            return { success: true, title: "TRAIN ROOFTOP SURF!", text: "+75 XP • +60 Coins • Boosted +320m at 2x speed!" };
                        }
                    },
                    {
                        title: "Hold Coupler Railing",
                        icon: "🛡️",
                        desc: "Brace on the iron caboose railing until the switch passes.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(40);
                            player.x += 180;
                            return { success: true, title: "STEADY RIDE", text: "+40 XP • Held firm on freight coupler." };
                        }
                    }
                ]
            },
            // SKETCH SUBFLOOR — ROCKET LAUNCH TO MOON
            {
                id: "sketch_rocket_launch",
                title: "Orbital Rocket Launchpad",
                desc: "An Apollo-class orbital rocket stands on the launch gantry surrounded by warning spikes!",
                choices: [
                    {
                        title: "Ignite Rocket to Moon",
                        icon: "🚀",
                        desc: "Climb aboard the spacecraft and trigger main thruster ignition!",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(120);
                            addResource("crystals", 5);
                            RocketState.startLaunch(player.x, GROUND_Y);
                            return { success: true, title: "ORBITAL LAUNCH TO MOON!", text: "🚀 Thrusters ignited! Flying to Lunar Surface!" };
                        }
                    },
                    {
                        title: "Bypass Launchpad on Foot",
                        icon: "🏃",
                        desc: "Sprint past the gantry scaffolding.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            player.x += 200;
                            addXp(35);
                            return { success: true, title: "BYPASSED GANTRY", text: "+35 XP • Continued along launch perimeter." };
                        }
                    }
                ]
            },
            // 01 — BROKEN BRIDGE
            {
                id: "broken_bridge",
                title: "Broken Mountain Bridge",
                desc: "The wooden bridge ahead has cracked above a deep chasm. Enci is closing in!",
                choices: [
                    {
                        title: "Repair Bridge",
                        icon: "🛠️",
                        desc: "Reinforce the planks with timber for a safe crossing.",
                        cost: { wood: 25 },
                        risk: "LOW",
                        action: () => {
                            addXp(35);
                            player.x += 180;
                            return { success: true, title: "BRIDGE REPAIRED", text: "-25 Wood • +35 XP • Safe Fast Crossing!" };
                        }
                    },
                    {
                        title: "Leap Across",
                        icon: "🏃",
                        desc: "Sprint and make a risky jump across the wide gap.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.45) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 25);
                                enci.x += 120; // Enci gains ground
                                return { success: false, title: "STUMBLED ON LANDING", text: "-25 Stamina • Enci gained ground!" };
                            } else {
                                addXp(25);
                                player.x += 220;
                                return { success: true, title: "PERFECT LEAP!", text: "+25 XP • Gained distance safely!" };
                            }
                        }
                    }
                ]
            },
            // 02 — FALLEN TREE
            {
                id: "fallen_tree",
                title: "Fallen Great Pine",
                desc: "A massive fallen pine tree completely blocks the low valley trail.",
                choices: [
                    {
                        title: "Chop Shortcut",
                        icon: "🪓",
                        desc: "Clear a path through the trunk to open a shortcut.",
                        cost: { energy: 20 },
                        risk: "LOW",
                        action: () => {
                            addResource("wood", 30);
                            addXp(30);
                            player.x += 150;
                            return { success: true, title: "CLEARED SHORTCUT", text: "+30 Wood • +30 XP • Opened Fast Trail!" };
                        }
                    },
                    {
                        title: "Vault Over",
                        icon: "🧗",
                        desc: "Scramble quickly over the sharp branches.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            if (Math.random() < 0.4) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 15);
                                return { success: false, title: "SCRATCHED BY BRANCHES", text: "-15 Stamina from rough climb." };
                            }
                            return { success: true, title: "AGILE VAULT", text: "Cleared the log quickly with zero delay!" };
                        }
                    }
                ]
            },
            // 03 — LOST TRAVELER
            {
                id: "lost_traveler",
                title: "Lost Valley Scout",
                desc: "A disoriented scout is signaling for directions to the nearest mountain camp.",
                choices: [
                    {
                        title: "Guide Scout",
                        icon: "🗺️",
                        desc: "Share map directions and spare trail rations.",
                        cost: { food: 5 },
                        risk: "LOW",
                        action: () => {
                            addResource("coins", 60);
                            addXp(45);
                            SaveData.eventHistory["helped_scout"] = true;
                            return { success: true, title: "GRATEFUL SCOUT", text: "-5 Food • +60 Coins • +45 XP" };
                        }
                    },
                    {
                        title: "Keep Running",
                        icon: "🏃",
                        desc: "Wave back and keep your momentum forward.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "KEPT MOMENTUM", text: "Maintained running pace without stopping." };
                        }
                    }
                ]
            },
            // 04 — MYSTERIOUS CHEST
            {
                id: "mysterious_chest",
                title: "Gilded Mountain Chest",
                desc: "An ornate iron-banded chest sits half-buried in the mossy dirt.",
                choices: [
                    {
                        title: "Pry Open",
                        icon: "🗝️",
                        desc: "Force open the rusted lock to claim its contents.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            if (Math.random() < 0.25) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 20);
                                return { success: false, title: "TRAPPED LATCH!", text: "-20 Stamina from spring trap!" };
                            }
                            addResource("coins", 75);
                            addResource("crystals", 3);
                            addXp(40);
                            return { success: true, title: "TREASURE UNLOCKED", text: "+75 Coins • +3 Crystals • +40 XP!" };
                        }
                    },
                    {
                        title: "Bypass Safely",
                        icon: "🛡️",
                        desc: "Leave the suspicious container undisturbed.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "SAFETY FIRST", text: "Avoided potential traps and continued." };
                        }
                    }
                ]
            },
            // 05 — ROCKSLIDE
            {
                id: "rockslide",
                title: "Granite Rockslide",
                desc: "Loose scree and boulders are tumbling down the mountain slope!",
                choices: [
                    {
                        title: "Take Shelter",
                        icon: "🛡️",
                        desc: "Duck under a cliff ledge until the rocks settle.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            enci.x += 80;
                            return { success: true, title: "SAFE SHELTER", text: "Waited out rockslide. Enci closed in slightly." };
                        }
                    },
                    {
                        title: "Dash Through",
                        icon: "⚡",
                        desc: "Sprint through the falling debris at top speed.",
                        cost: { energy: 15 },
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.5) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 20);
                                return { success: false, title: "GRAZED BY BOULDER", text: "-20 Stamina from tumbling stones!" };
                            }
                            addXp(35);
                            player.x += 200;
                            return { success: true, title: "DAREDEVIL DASH!", text: "+35 XP • Blazed past the danger zone!" };
                        }
                    }
                ]
            },
            // 06 — BROKEN CART
            {
                id: "broken_cart",
                title: "Abandoned Supply Cart",
                desc: "A broken merchant carriage is stranded by the roadside.",
                choices: [
                    {
                        title: "Repair Wheel",
                        icon: "🛠️",
                        desc: "Fix the carriage axle with wood and stone.",
                        cost: { wood: 15, stone: 10 },
                        risk: "LOW",
                        action: () => {
                            addResource("coins", 80);
                            addResource("food", 15);
                            addXp(40);
                            return { success: true, title: "CART RESTORED", text: "+80 Coins • +15 Food • +40 XP!" };
                        }
                    },
                    {
                        title: "Scavenge Goods",
                        icon: "🔍",
                        desc: "Quickly grab whatever supplies are exposed.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            addResource("wood", 12);
                            addResource("herbs", 6);
                            return { success: true, title: "SCAVENGED CRATE", text: "+12 Wood • +6 Herbs salvaged." };
                        }
                    }
                ]
            },
            // 07 — RIVER CROSSING
            {
                id: "river_crossing",
                title: "Rushing River Rapids",
                desc: "A wide glacial stream blocks the trail. The current is swift and icy.",
                choices: [
                    {
                        title: "Build Footbridge",
                        icon: "🪵",
                        desc: "Lash together logs for a secure dry crossing.",
                        cost: { wood: 20 },
                        risk: "LOW",
                        action: () => {
                            addXp(30);
                            player.x += 160;
                            return { success: true, title: "BRIDGE COMPLETED", text: "-20 Wood • +30 XP • Safe passage!" };
                        }
                    },
                    {
                        title: "Swim Rapids",
                        icon: "🏊",
                        desc: "Dive into the cold river and power across.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            SaveData.player.energy = Math.max(0, SaveData.player.energy - 30);
                            if (Math.random() < 0.3) enci.x += 100;
                            return { success: false, title: "FREEZING CURRENT", text: "-30 Stamina from glacial water!" };
                        }
                    }
                ]
            },
            // 08 — STRANGE FOOTPRINTS
            {
                id: "strange_footprints",
                title: "Luminous Tracks",
                desc: "Glowing crystalline footprints branch off from the main path.",
                choices: [
                    {
                        title: "Follow Tracks",
                        icon: "🐾",
                        desc: "Trace the glowing trail into a hidden hollow.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            if (Math.random() < 0.6) {
                                addResource("crystals", 4);
                                addXp(40);
                                return { success: true, title: "CRYSTAL DEN FOUND", text: "+4 Crystals • +40 XP discovered!" };
                            }
                            return { success: false, title: "DEAD END", text: "Tracks vanished into the thicket." };
                        }
                    },
                    {
                        title: "Ignore Trail",
                        icon: "🏃",
                        desc: "Stay on course and focus on distance.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "STAYED ON TRACK", text: "Kept heading forward steadily." };
                        }
                    }
                ]
            },
            // 09 — WILD ANIMAL BLOCKING PATH
            {
                id: "wild_bear",
                title: "Grizzly Mountain Bear",
                desc: "A massive alpine bear is foraging right on the main running lane!",
                choices: [
                    {
                        title: "Toss Trail Rations",
                        icon: "🍖",
                        desc: "Distract the predator with delicious camp food.",
                        cost: { food: 8 },
                        risk: "LOW",
                        action: () => {
                            addXp(35);
                            player.x += 140;
                            return { success: true, title: "BEAR DISTRACTED", text: "-8 Food • +35 XP • Slipped by safely!" };
                        }
                    },
                    {
                        title: "Sneak Past",
                        icon: "🤫",
                        desc: "Creep quietly through the brush alongside.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.5) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 25);
                                enci.x += 90;
                                return { success: false, title: "BEAR ROARED!", text: "Startled! -25 Stamina • Lost time!" };
                            }
                            addXp(40);
                            return { success: true, title: "SILENT STALKER", text: "+40 XP • Sneaked past unnoticed!" };
                        }
                    }
                ]
            },
            // 10 — COLLAPSED TUNNEL
            {
                id: "collapsed_tunnel",
                title: "Collapsed Mining Tunnel",
                desc: "A stone tunnel entrance is choked with heavy granite rubble.",
                choices: [
                    {
                        title: "Excavate Passage",
                        icon: "⛏️",
                        desc: "Use your mining pick to excavate a tunnel shortcut.",
                        cost: { energy: 25 },
                        risk: "LOW",
                        action: () => {
                            addResource("stone", 35);
                            addResource("crystals", 2);
                            addXp(45);
                            player.x += 260;
                            return { success: true, title: "TUNNEL CLEARED", text: "+35 Stone • +2 Crystals • +260m Shortcut!" };
                        }
                    },
                    {
                        title: "Climb Over Ridge",
                        icon: "⛰️",
                        desc: "Hike over the rocky summit instead.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            enci.x += 70;
                            return { success: true, title: "RIDGE TRAIL", text: "Longer climb. Enci gained 70m." };
                        }
                    }
                ]
            },
            // 11 — CAMPFIRE REST
            {
                id: "campfire_rest",
                title: "Sheltered Hearth",
                desc: "An abandoned campfire with warm embers sits in a tranquil alcove.",
                choices: [
                    {
                        title: "Rest & Stoke Fire",
                        icon: "🔥",
                        desc: "Feed the fire with wood and catch your breath.",
                        cost: { wood: 10 },
                        risk: "LOW",
                        action: () => {
                            SaveData.player.energy = SaveData.player.maxEnergy;
                            addXp(20);
                            return { success: true, title: "FULL STAMINA RESTORED", text: "Stamina at 100% • +20 XP!" };
                        }
                    },
                    {
                        title: "Sprint Ahead",
                        icon: "⚡",
                        desc: "Skip the rest and extend your lead on Enci.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            player.x += 160;
                            return { success: true, title: "EXTENDED DISTANCE", text: "+160m distance gained!" };
                        }
                    }
                ]
            },
            // 12 — LOST BACKPACK
            {
                id: "lost_backpack",
                title: "Expedition Knapsack",
                desc: "A leather backpack hangs from a trail branch.",
                choices: [
                    {
                        title: "Inspect Knapsack",
                        icon: "🎒",
                        desc: "Rummage through the pockets for supplies.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("coins", 40);
                            addResource("herbs", 8);
                            addXp(25);
                            return { success: true, title: "FOUND SUPPLIES", text: "+40 Coins • +8 Herbs • +25 XP" };
                        }
                    },
                    {
                        title: "Leave It",
                        icon: "🏃",
                        desc: "Do not stop to investigate.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "KEPT SPRINTING", text: "Continued expedition uninterrupted." };
                        }
                    }
                ]
            },
            // 13 — BROKEN SIGNPOST
            {
                id: "broken_signpost",
                title: "Shattered Trail Marker",
                desc: "The crossroad marker is split in two. The path splits ahead.",
                choices: [
                    {
                        title: "Repair & Read",
                        icon: "🔨",
                        desc: "Splice the timber back together to reveal the safe road.",
                        cost: { wood: 12 },
                        risk: "LOW",
                        action: () => {
                            addXp(30);
                            player.x += 190;
                            return { success: true, title: "FOUND HIGH ROAD", text: "-12 Wood • Revealed optimal shortcut path!" };
                        }
                    },
                    {
                        title: "Guess Direction",
                        icon: "🎲",
                        desc: "Take a blind gamble on the left fork.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.5) {
                                enci.x += 110;
                                return { success: false, title: "BOGGY DETOUR", text: "Took a swampy detour! Enci closed in!" };
                            }
                            player.x += 150;
                            return { success: true, title: "LUCKY GUESS", text: "Chose the clear valley branch!" };
                        }
                    }
                ]
            },
            // 14 — HIDDEN CAVE
            {
                id: "hidden_cave",
                title: "Hidden Amethyst Grotto",
                desc: "A shimmering cleft in the rock face sparkles with purple light.",
                choices: [
                    {
                        title: "Explore Grotto",
                        icon: "💎",
                        desc: "Venture inside to harvest rare crystals.",
                        cost: { energy: 15 },
                        risk: "MEDIUM",
                        action: () => {
                            addResource("crystals", 5);
                            addResource("stone", 20);
                            addXp(50);
                            return { success: true, title: "CRYSTAL HOARD!", text: "+5 Crystals • +20 Stone • +50 XP!" };
                        }
                    },
                    {
                        title: "Pass Entrance",
                        icon: "🏃",
                        desc: "Stay outside in the daylight.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "PASSED CAVE", text: "Stayed on the open main trail." };
                        }
                    }
                ]
            },
            // 15 — RAINSTORM APPROACHING
            {
                id: "mountain_storm",
                title: "Alpine Thunderstorm",
                desc: "Dark storm clouds gather quickly with booming thunder above the ridge.",
                choices: [
                    {
                        title: "Seek Pine Canopy",
                        icon: "🌲",
                        desc: "Take cover under thick ancient pines to stay dry.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            SaveData.player.energy = Math.min(SaveData.player.maxEnergy, SaveData.player.energy + 20);
                            return { success: true, title: "SHELTERED FROM RAIN", text: "+20 Stamina restored under pines." };
                        }
                    },
                    {
                        title: "Brave the Storm",
                        icon: "⚡",
                        desc: "Sprint forward through the wind and lightning.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.4) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 25);
                                return { success: false, title: "MUDDY SLIP", text: "Slipped in the mud! -25 Stamina" };
                            }
                            player.x += 240;
                            addXp(40);
                            return { success: true, title: "STORM RUNNER!", text: "+240m Distance • +40 XP!" };
                        }
                    }
                ]
            },
            // 16 — OLD CABIN
            {
                id: "old_cabin_event",
                title: "Old Woodland Cabin",
                desc: "A weathered cabin sits quietly off the trail with its chimney smoking.",
                choices: [
                    {
                        title: "Search Pantry",
                        icon: "🏡",
                        desc: "Step inside to gather supplies left behind.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("wood", 25);
                            addResource("food", 20);
                            addResource("coins", 35);
                            addXp(35);
                            return { success: true, title: "PANTRY LOOTED", text: "+25 Wood • +20 Food • +35 Coins!" };
                        }
                    },
                    {
                        title: "Keep Moving",
                        icon: "🏃",
                        desc: "Ignore the homestead and maintain stride.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "MAINTAINED PACE", text: "Kept continuous speed along valley." };
                        }
                    }
                ]
            },
            // 17 — DROPPED SUPPLIES
            {
                id: "dropped_supplies",
                title: "Scout's Dropped Pouch",
                desc: "A velvet merchant pouch lies on the cobblestone.",
                choices: [
                    {
                        title: "Pocket the Gold",
                        icon: "💰",
                        desc: "Take the shiny coins for your upgrades.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("coins", 90);
                            return { success: true, title: "GOLD CLAIMED", text: "+90 Coins added to backpack!" };
                        }
                    },
                    {
                        title: "Leave on Marker",
                        icon: "🕊️",
                        desc: "Hang it on the trail marker for good karma.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(60);
                            addResource("crystals", 2);
                            return { success: true, title: "VALLEY BLESSING", text: "+60 XP • +2 Crystals from forest spirits!" };
                        }
                    }
                ]
            },
            // 18 — DAMAGED LADDER
            {
                id: "damaged_ladder",
                title: "Broken Cliff Ladder",
                desc: "The rungs of the cliff ladder leading to the upper ledge are shattered.",
                choices: [
                    {
                        title: "Repair Rungs",
                        icon: "🪜",
                        desc: "Fashion new wooden rungs to climb safely.",
                        cost: { wood: 16 },
                        risk: "LOW",
                        action: () => {
                            addXp(30);
                            player.x += 180;
                            return { success: true, title: "LADDER FIXED", text: "-16 Wood • +30 XP • Easy climb to upper ledge!" };
                        }
                    },
                    {
                        title: "Wall Jump",
                        icon: "🦘",
                        desc: "Rebound off the sheer stone face.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.4) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 20);
                                enci.x += 80;
                                return { success: false, title: "MISSED GRIP", text: "Lost grip! -20 Stamina • Fell behind!" };
                            }
                            addXp(45);
                            player.x += 210;
                            return { success: true, title: "ACROBATIC LEAP!", text: "+45 XP • Vaulted to the summit!" };
                        }
                    }
                ]
            },
            // 19 — FROZEN PATH
            {
                id: "frozen_path",
                title: "Glacier Ice Sheet",
                desc: "A slick sheet of transparent ice coats the narrow mountain pass.",
                choices: [
                    {
                        title: "Tread Carefully",
                        icon: "👣",
                        desc: "Pick your footing with slow, deliberate steps.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            enci.x += 60;
                            return { success: true, title: "SAFE PASSAGE", text: "Crossed ice without slipping. Enci +60m." };
                        }
                    },
                    {
                        title: "Power Slide",
                        icon: "⛸️",
                        desc: "Slide across the ice sheet with momentum!",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.5) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 20);
                                return { success: false, title: "WIPEOUT!", text: "Spun out on ice! -20 Stamina." };
                            }
                            player.x += 250;
                            addXp(40);
                            return { success: true, title: "EPIC ICE SLIDE!", text: "+250m Distance • +40 XP!" };
                        }
                    }
                ]
            },
            // 20 — FALLING ROCKS
            {
                id: "falling_boulders",
                title: "Cliffside Collapse",
                desc: "Dust billows as massive boulders crack loose from the high cliff!",
                choices: [
                    {
                        title: "Brace Behind Boulder",
                        icon: "🛡️",
                        desc: "Take cover behind a sturdy rock formation.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            enci.x += 70;
                            return { success: true, title: "SHIELDED", text: "Debris bounced off safety rock. Enci +70m." };
                        }
                    },
                    {
                        title: "Full Speed Dash",
                        icon: "⚡",
                        desc: "Engage sprint to beat the avalanche.",
                        cost: { energy: 15 },
                        risk: "HIGH",
                        action: () => {
                            player.x += 220;
                            addXp(35);
                            return { success: true, title: "OUTRAN AVALANCHE", text: "+220m Distance • +35 XP!" };
                        }
                    }
                ]
            },
            // 21 — SECRET PATH
            {
                id: "secret_path",
                title: "Overgrown Grove Path",
                desc: "A hidden leafy tunnel snakes through the ancient valley trees.",
                choices: [
                    {
                        title: "Take Grove Path",
                        icon: "🌿",
                        desc: "Follow the lush shortcut through the woods.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            addResource("herbs", 14);
                            addResource("crystals", 2);
                            player.x += 200;
                            addXp(45);
                            return { success: true, title: "LUSH SHORTCUT", text: "+14 Herbs • +2 Crystals • +200m!" };
                        }
                    },
                    {
                        title: "Stay on Highway",
                        icon: "🛣️",
                        desc: "Stick to the wide, predictable road.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "STEADY COURSE", text: "Kept straight along the main road." };
                        }
                    }
                ]
            },
            // 22 — OLD MACHINE
            {
                id: "old_machine",
                title: "Ancient Mining Crane",
                desc: "A steam-powered pulley mechanism sits rusting by a cliff ledge.",
                choices: [
                    {
                        title: "Repair Mechanism",
                        icon: "⚙️",
                        desc: "Fix the gears with stone and wood to activate the lift.",
                        cost: { wood: 20, stone: 15 },
                        risk: "LOW",
                        action: () => {
                            player.x += 300;
                            addResource("crystals", 3);
                            addXp(60);
                            return { success: true, title: "CRANE LIFT ACTIVATED!", text: "Catapulted +300m forward! +3 Crystals • +60 XP" };
                        }
                    },
                    {
                        title: "Walk Around",
                        icon: "🚶",
                        desc: "Bypass the contraption on foot.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "BYPASSED CRANE", text: "Walked safely past the machinery." };
                        }
                    }
                ]
            },
            // 23 — LOCKED GATE
            {
                id: "locked_gate",
                title: "Fortified Valley Gate",
                desc: "A heavy iron-studded gate bars the narrow canyon entrance.",
                choices: [
                    {
                        title: "Pick Lock",
                        icon: "🗝️",
                        desc: "Use precision tools to unlock the iron padlock.",
                        cost: { energy: 15 },
                        risk: "LOW",
                        action: () => {
                            addXp(40);
                            player.x += 170;
                            return { success: true, title: "GATE UNLOCKED", text: "+40 XP • Gate swung open smoothly!" };
                        }
                    },
                    {
                        title: "Smash Gate",
                        icon: "💥",
                        desc: "Hurl a heavy stone to batter down the latch.",
                        cost: { stone: 15 },
                        risk: "MEDIUM",
                        action: () => {
                            addXp(30);
                            player.x += 160;
                            return { success: true, title: "GATE BREACHED", text: "-15 Stone • Smashed right through!" };
                        }
                    }
                ]
            },
            // 24 — RESOURCE CACHE
            {
                id: "resource_cache",
                title: "Hidden Timber Cache",
                desc: "A stockpile of neatly stacked oak logs lies concealed under pine boughs.",
                choices: [
                    {
                        title: "Haul Timber",
                        icon: "🪵",
                        desc: "Load up your backpack with as many logs as you can carry.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("wood", 45);
                            addXp(30);
                            return { success: true, title: "TIMBER SECURED", text: "+45 Wood added to inventory!" };
                        }
                    },
                    {
                        title: "Keep Running Light",
                        icon: "🏃",
                        desc: "Leave the heavy cargo behind for speed.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            player.x += 120;
                            return { success: true, title: "SPRINTED AHEAD", text: "+120m distance maintained." };
                        }
                    }
                ]
            },
            // 25 — BROKEN BOAT
            {
                id: "broken_boat",
                title: "Damaged River Raft",
                desc: "A wooden raft is beached along the riverbank with a broken rudder.",
                choices: [
                    {
                        title: "Patch Raft",
                        icon: "🛶",
                        desc: "Craft a replacement oar and sail downriver.",
                        cost: { wood: 18 },
                        risk: "LOW",
                        action: () => {
                            player.x += 280;
                            addXp(45);
                            return { success: true, title: "RAPIDS SURFING!", text: "-18 Wood • Surfed downriver +280m!" };
                        }
                    },
                    {
                        title: "Hike Bank",
                        icon: "🥾",
                        desc: "Walk along the muddy river shoreline.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "HIKED SHORE", text: "Walked safely along the riverbank." };
                        }
                    }
                ]
            },
            // 26 — MOUNTAIN WIND
            {
                id: "gale_wind",
                title: "Gale Force Wind",
                desc: "Violent headwinds roar through the alpine mountain gap.",
                choices: [
                    {
                        title: "Lower Stance & Push",
                        icon: "🌬️",
                        desc: "Crouch low and power through the gusts.",
                        cost: { energy: 15 },
                        risk: "LOW",
                        action: () => {
                            addXp(30);
                            player.x += 140;
                            return { success: true, title: "CONQUERED GUSTS", text: "-15 Stamina • Pushed past headwinds!" };
                        }
                    },
                    {
                        title: "Wait for Lull",
                        icon: "⏳",
                        desc: "Pause briefly until the storm gust eases.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            enci.x += 80;
                            return { success: true, title: "WIND SUBSIDED", text: "Enci gained 80m while waiting." };
                        }
                    }
                ]
            },
            // 27 — MYSTERIOUS NPC
            {
                id: "mysterious_scout",
                title: "Cloaked Valley Ranger",
                desc: "A hooded ranger emerges from the shadows of an ancient oak.",
                choices: [
                    {
                        title: "Speak with Ranger",
                        icon: "🧙",
                        desc: "Listen to the ranger's advice on the path ahead.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("crystals", 3);
                            addXp(50);
                            return { success: true, title: "RANGER'S BLESSING", text: "+3 Crystals • +50 XP • Enci tracker refined!" };
                        }
                    },
                    {
                        title: "Rush Past",
                        icon: "🏃",
                        desc: "Keep running without stopping.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "RUSHED PAST", text: "Continued sprinting along the trail." };
                        }
                    }
                ]
            },
            // 28 — OLD WELL
            {
                id: "old_well",
                title: "Ancient Stone Well",
                desc: "A mossy wishing well sits beside a stone ruin.",
                choices: [
                    {
                        title: "Toss Gold Coin",
                        icon: "🪙",
                        desc: "Make a wish with a shiny coin into the depths.",
                        cost: { coins: 15 },
                        risk: "LOW",
                        action: () => {
                            SaveData.player.energy = SaveData.player.maxEnergy;
                            addResource("crystals", 4);
                            addXp(40);
                            return { success: true, title: "WISH GRANTED!", text: "+4 Crystals • Full Stamina • +40 XP!" };
                        }
                    },
                    {
                        title: "Inspect Bucket",
                        icon: "🪣",
                        desc: "Pull up the old wooden bucket.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("herbs", 10);
                            return { success: true, title: "FOUND FRESH HERBS", text: "+10 Wild Herbs retrieved!" };
                        }
                    }
                ]
            },
            // 29 — FALLEN CRATE
            {
                id: "fallen_crate",
                title: "Sealed Iron Crate",
                desc: "A heavy iron cargo box is wedged between two granite rocks.",
                choices: [
                    {
                        title: "Pry with Pickaxe",
                        icon: "⛏️",
                        desc: "Lever the crate open with your mining pick.",
                        cost: { energy: 10 },
                        risk: "LOW",
                        action: () => {
                            addResource("stone", 25);
                            addResource("coins", 50);
                            addXp(35);
                            return { success: true, title: "CRATE OPENED", text: "+25 Stone • +50 Coins • +35 XP!" };
                        }
                    },
                    {
                        title: "Leave Crate",
                        icon: "🏃",
                        desc: "Do not stop to pry the lid.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "CONTINUED RUN", text: "Maintained forward momentum." };
                        }
                    }
                ]
            },
            // 30 — DAMAGED ROAD
            {
                id: "damaged_road",
                title: "Crumbling Valley Road",
                desc: "The old paved mountain path has washed away into a muddy pit.",
                choices: [
                    {
                        title: "Pave with Stone",
                        icon: "🪨",
                        desc: "Lay down cobblestone to create a permanent sprint road.",
                        cost: { stone: 20 },
                        risk: "LOW",
                        action: () => {
                            player.x += 200;
                            addXp(40);
                            return { success: true, title: "ROAD PAVED", text: "-20 Stone • Sprint road boosted +200m!" };
                        }
                    },
                    {
                        title: "Trudge Through Mud",
                        icon: "🥾",
                        desc: "Plod through the thick mire.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            SaveData.player.energy = Math.max(0, SaveData.player.energy - 15);
                            return { success: false, title: "MUDDY DELAY", text: "-15 Stamina from heavy mud." };
                        }
                    }
                ]
            },
            // 31 — LOST PET
            {
                id: "lost_puppy",
                title: "Stranded Forest Pup",
                desc: "A frightened valley puppy is trapped on a high ledge.",
                choices: [
                    {
                        title: "Rescue Pup",
                        icon: "🐕",
                        desc: "Climb up and carry the pup down to safety.",
                        cost: { energy: 10 },
                        risk: "LOW",
                        action: () => {
                            addXp(65);
                            addResource("coins", 70);
                            return { success: true, title: "HERO OF THE VALLEY!", text: "+65 XP • +70 Coins reward!" };
                        }
                    },
                    {
                        title: "Signal Nearby Camp",
                        icon: "📢",
                        desc: "Blow a whistle to alert the nearest farm.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(30);
                            return { success: true, title: "SCOUTS ALERTED", text: "+30 XP for warning the rangers." };
                        }
                    }
                ]
            },
            // 32 — HIDDEN TREASURE MAP
            {
                id: "treasure_map",
                title: "Tattered Treasure Map",
                desc: "A parchment map with an 'X' marking a nearby cliff crest.",
                choices: [
                    {
                        title: "Dig at the 'X'",
                        icon: "🗺️",
                        desc: "Spend a few moments digging at the marked spot.",
                        cost: { energy: 15 },
                        risk: "MEDIUM",
                        action: () => {
                            addResource("coins", 110);
                            addResource("crystals", 4);
                            addXp(55);
                            return { success: true, title: "BURIED TREASURE!", text: "+110 Coins • +4 Crystals • +55 XP!" };
                        }
                    },
                    {
                        title: "Pocket Map for Later",
                        icon: "📜",
                        desc: "Stash the parchment in your backpack.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(25);
                            return { success: true, title: "MAP ARCHIVED", text: "+25 XP logged to discovery log." };
                        }
                    }
                ]
            },
            // 33 — STORM-DAMAGED HOUSE
            {
                id: "storm_homestead",
                title: "Storm-Damaged Cottage",
                desc: "A valley family's roof has caved in from high winds.",
                choices: [
                    {
                        title: "Help Rebuild Roof",
                        icon: "🏠",
                        desc: "Donate timber and help patch the shingles.",
                        cost: { wood: 30 },
                        risk: "LOW",
                        action: () => {
                            addResource("food", 35);
                            addResource("coins", 85);
                            addXp(60);
                            return { success: true, title: "HOMESTEAD SAVED", text: "+35 Food • +85 Coins • +60 XP!" };
                        }
                    },
                    {
                        title: "Express Sympathy",
                        icon: "👋",
                        desc: "Wave encouragement and continue onward.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "CONTINUED RUN", text: "Stayed on track without spending timber." };
                        }
                    }
                ]
            },
            // 34 — BROKEN WINDMILL
            {
                id: "broken_windmill",
                title: "Broken Valley Windmill",
                desc: "The wooden rotor of the valley mill is jammed with debris.",
                choices: [
                    {
                        title: "Repair Rotor",
                        icon: "🌾",
                        desc: "Unjam the gears and replace the broken wooden spoke.",
                        cost: { wood: 20, stone: 10 },
                        risk: "LOW",
                        action: () => {
                            addResource("food", 40);
                            addResource("coins", 60);
                            addXp(50);
                            return { success: true, title: "WINDMILL SPINNING", text: "+40 Food • +60 Coins • +50 XP!" };
                        }
                    },
                    {
                        title: "Pass By",
                        icon: "🏃",
                        desc: "Keep running past the mill.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "PASSED WINDMILL", text: "Kept moving along the trail." };
                        }
                    }
                ]
            },
            // 35 — STRANGE LIGHT
            {
                id: "strange_aurora",
                title: "Ethereal Valley Wisp",
                desc: "A playful glowing wisp dances above a flower grove.",
                choices: [
                    {
                        title: "Touch Wisp",
                        icon: "✨",
                        desc: "Reach out to channel the magical energy.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            if (Math.random() < 0.7) {
                                SaveData.player.energy = SaveData.player.maxEnergy;
                                addResource("crystals", 4);
                                addXp(50);
                                return { success: true, title: "MAGICAL SURGE!", text: "Full Stamina • +4 Crystals • +50 XP!" };
                            }
                            SaveData.player.energy = Math.max(0, SaveData.player.energy - 15);
                            return { success: false, title: "STATIC SHOCK", text: "Zapped! -15 Stamina." };
                        }
                    },
                    {
                        title: "Avoid Anomaly",
                        icon: "🛡️",
                        desc: "Keep your distance from unknown magic.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "PLAYED IT SAFE", text: "Avoided magical interference." };
                        }
                    }
                ]
            },
            // 36 — ABANDONED CAMP
            {
                id: "abandoned_camp",
                title: "Old Explorer Outpost",
                desc: "A deserted campsite with wooden crates and a map table.",
                choices: [
                    {
                        title: "Raid Outpost",
                        icon: "⛺",
                        desc: "Gather all leftover rations and tools.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("wood", 20);
                            addResource("stone", 15);
                            addResource("coins", 45);
                            addXp(35);
                            return { success: true, title: "OUTPOST LOOTED", text: "+20 Wood • +15 Stone • +45 Coins!" };
                        }
                    },
                    {
                        title: "Keep Scent Cold",
                        icon: "🏃",
                        desc: "Sprint right through without stopping.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            player.x += 140;
                            return { success: true, title: "MAINTAINED PACE", text: "+140m distance gained." };
                        }
                    }
                ]
            },
            // 37 — SHORTCUT THROUGH FOREST
            {
                id: "dense_thicket",
                title: "Dense Bramble Shortcut",
                desc: "A thick hedge of thorns cuts straight across the river bend.",
                choices: [
                    {
                        title: "Clear Path with Axe",
                        icon: "🪓",
                        desc: "Hack through the brambles with your tool.",
                        cost: { energy: 15 },
                        risk: "LOW",
                        action: () => {
                            player.x += 260;
                            addXp(40);
                            return { success: true, title: "SHORTCUT CLEARED", text: "+260m shortcut opened!" };
                        }
                    },
                    {
                        title: "Take Road Route",
                        icon: "🛣️",
                        desc: "Follow the long bend around the thicket.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "MAIN ROAD", text: "Maintained steady pace on open road." };
                        }
                    }
                ]
            },
            // 38 — RESOURCE-RICH TREE
            {
                id: "ancient_grove_tree",
                title: "Golden Amber Tree",
                desc: "An ancient cedar dripping with hardened golden sap and rich timber.",
                choices: [
                    {
                        title: "Harvest Amber",
                        icon: "🪵",
                        desc: "Spend stamina to harvest the precious wood and sap.",
                        cost: { energy: 20 },
                        risk: "LOW",
                        action: () => {
                            addResource("wood", 60);
                            addResource("coins", 50);
                            addXp(45);
                            return { success: true, title: "AMBER HARVESTED", text: "+60 Wood • +50 Coins • +45 XP!" };
                        }
                    },
                    {
                        title: "Admire & Run",
                        icon: "🏃",
                        desc: "Save stamina and keep sprinting.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "SAVED STAMINA", text: "Conserved full energy reserves." };
                        }
                    }
                ]
            },
            // 39 — ROCK WITH CRYSTALS
            {
                id: "crystal_vein",
                title: "Exposed Amethyst Geode",
                desc: "A massive boulder has split open revealing glowing purple crystals.",
                choices: [
                    {
                        title: "Mine Crystal Geode",
                        icon: "⛏️",
                        desc: "Chisel out the precious mineral shards.",
                        cost: { energy: 15 },
                        risk: "LOW",
                        action: () => {
                            addResource("crystals", 6);
                            addResource("stone", 25);
                            addXp(50);
                            return { success: true, title: "GEODE MINED", text: "+6 Crystals • +25 Stone • +50 XP!" };
                        }
                    },
                    {
                        title: "Leave Geode",
                        icon: "🏃",
                        desc: "Keep your pace without mining.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "MAINTAINED SPRINT", text: "Stayed at high speed." };
                        }
                    }
                ]
            },
            // 40 — NPC TRADE
            {
                id: "wandering_trader",
                title: "Wandering Valley Merchant",
                desc: "A pack-llama trader offers a quick trail transaction.",
                choices: [
                    {
                        title: "Trade Wood for Crystals",
                        icon: "🔄",
                        desc: "Exchange 40 Timber for 4 Rare Valley Crystals.",
                        cost: { wood: 40 },
                        risk: "LOW",
                        action: () => {
                            addResource("crystals", 4);
                            addXp(35);
                            return { success: true, title: "FAIR TRADE", text: "-40 Wood • +4 Crystals • +35 XP!" };
                        }
                    },
                    {
                        title: "Decline Offer",
                        icon: "❌",
                        desc: "Keep your resources and keep running.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "DECLINED TRADE", text: "Saved all current timber stocks." };
                        }
                    }
                ]
            },
            // 41 — OLD BRIDGE TOLL
            {
                id: "toll_bridge",
                title: "Ancient Bridge Toll",
                desc: "An automated toll gate asks for a small coin tribute to lower the drawbridge.",
                choices: [
                    {
                        title: "Pay 20 Coins",
                        icon: "🪙",
                        desc: "Insert coins into the gate slot for instant crossing.",
                        cost: { coins: 20 },
                        risk: "LOW",
                        action: () => {
                            player.x += 220;
                            addXp(30);
                            return { success: true, title: "DRAWBRIDGE LOWERED", text: "-20 Coins • Instant +220m crossing!" };
                        }
                    },
                    {
                        title: "Climb Understructure",
                        icon: "🧗",
                        desc: "Shimmy across the rusted steel beams below.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            SaveData.player.energy = Math.max(0, SaveData.player.energy - 20);
                            enci.x += 60;
                            return { success: true, title: "BEAM SHIMMY", text: "-20 Stamina • Crossed under bridge." };
                        }
                    }
                ]
            },
            // 42 — RIVER FLOOD
            {
                id: "river_flood",
                title: "Surging Mountain Flood",
                desc: "High tide has flooded the lower valley meadows.",
                choices: [
                    {
                        title: "High Ridge Route",
                        icon: "⛰️",
                        desc: "Take the elevated rocky trail above the waterline.",
                        cost: { energy: 15 },
                        risk: "LOW",
                        action: () => {
                            player.x += 180;
                            addXp(35);
                            return { success: true, title: "HIGH GROUND", text: "+180m • Avoided all flood waters!" };
                        }
                    },
                    {
                        title: "Wade Lowlands",
                        icon: "🌊",
                        desc: "Splash through the shallow flood basin.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.4) {
                                enci.x += 90;
                                return { success: false, title: "BOGGED DOWN", text: "Slowed by mud! Enci gained 90m!" };
                            }
                            return { success: true, title: "WADED THROUGH", text: "Pushed through the shallow waters." };
                        }
                    }
                ]
            },
            // 43 — MOUNTAIN CABLE
            {
                id: "mountain_cable",
                title: "Alpine Zipline Cable",
                desc: "A steel cable spans across a wide mountain valley gorge.",
                choices: [
                    {
                        title: "Ride Zipline",
                        icon: "🚡",
                        desc: "Hook your backpack harness and soar across.",
                        cost: { energy: 10 },
                        risk: "LOW",
                        action: () => {
                            player.x += 350;
                            addXp(50);
                            return { success: true, title: "ZIPLINE FLIGHT!", text: "Soared +350m across the chasm! +50 XP!" };
                        }
                    },
                    {
                        title: "Hike Canyon Rim",
                        icon: "🚶",
                        desc: "Follow the perimeter trail around the gap.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "HIKED RIM", text: "Kept steady ground pace." };
                        }
                    }
                ]
            },
            // 44 — LOST SURVEYOR
            {
                id: "lost_surveyor",
                title: "Disoriented Cartographer",
                desc: "A surveyor has dropped their map prisms in the tall grass.",
                choices: [
                    {
                        title: "Help Find Prisms",
                        icon: "🔍",
                        desc: "Spend a moment searching the brush.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("coins", 75);
                            addResource("crystals", 3);
                            addXp(55);
                            return { success: true, title: "PRISMS FOUND", text: "+75 Coins • +3 Crystals • +55 XP!" };
                        }
                    },
                    {
                        title: "Point to Camp",
                        icon: "👉",
                        desc: "Point toward the campsite and keep moving.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(20);
                            return { success: true, title: "POINTED WAY", text: "+20 XP logged." };
                        }
                    }
                ]
            },
            // 45 — STRANGE CHEST TRAP
            {
                id: "trapped_chest",
                title: "Ancient Vault Chest",
                desc: "A massive vault chest marked with glowing runes.",
                choices: [
                    {
                        title: "Disarm Runes",
                        icon: "🔮",
                        desc: "Carefully defuse the magical seal.",
                        cost: { herbs: 8 },
                        risk: "LOW",
                        action: () => {
                            addResource("coins", 120);
                            addResource("crystals", 5);
                            addXp(65);
                            return { success: true, title: "VAULT CRACKED!", text: "+120 Coins • +5 Crystals • +65 XP!" };
                        }
                    },
                    {
                        title: "Smash Lock",
                        icon: "🔨",
                        desc: "Hit the lock with brute force.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.5) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 30);
                                return { success: false, title: "ARCANE EXPLOSION", text: "Trap triggered! -30 Stamina!" };
                            }
                            addResource("coins", 80);
                            return { success: true, title: "SMASHED LOCK", text: "+80 Coins looted!" };
                        }
                    }
                ]
            },
            // 46 — ALPINE NIGHTFALL
            {
                id: "alpine_nightfall",
                title: "Alpine Twilight",
                desc: "Stars begin shining brightly across the cold mountain sky.",
                choices: [
                    {
                        title: "Light Torch",
                        icon: "🔦",
                        desc: "Craft a bright torch with wood and sap.",
                        cost: { wood: 10 },
                        risk: "LOW",
                        action: () => {
                            player.x += 180;
                            addXp(35);
                            return { success: true, title: "PATH ILLUMINATED", text: "+180m • Clear visibility ahead!" };
                        }
                    },
                    {
                        title: "Night Vision Sprint",
                        icon: "🌙",
                        desc: "Rely on moonlight to guide your steps.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            addXp(25);
                            return { success: true, title: "MOONLIT SPRINT", text: "+25 XP running under the stars." };
                        }
                    }
                ]
            },
            // 47 — BROKEN CART BRIDGE
            {
                id: "cart_bridge",
                title: "Broken Timber Causeway",
                desc: "A wide wooden causeway spanning a gorge has suffered structural damage.",
                choices: [
                    {
                        title: "Reinforce Beam",
                        icon: "🪵",
                        desc: "Bolt down new timber supports.",
                        cost: { wood: 25, stone: 10 },
                        risk: "LOW",
                        action: () => {
                            player.x += 250;
                            addXp(45);
                            return { success: true, title: "CAUSEWAY SECURED", text: "-25 Wood • -10 Stone • +250m safe speedway!" };
                        }
                    },
                    {
                        title: "Jump Gaps",
                        icon: "🏃",
                        desc: "Hurdle over the missing floor planks.",
                        cost: {},
                        risk: "HIGH",
                        action: () => {
                            if (Math.random() < 0.45) {
                                SaveData.player.energy = Math.max(0, SaveData.player.energy - 25);
                                return { success: false, title: "TRIPPED ON GAP", text: "-25 Stamina • Stumbled on broken plank!" };
                            }
                            player.x += 200;
                            addXp(40);
                            return { success: true, title: "FLAWLESS HURDLES", text: "+200m • Cleared every missing plank!" };
                        }
                    }
                ]
            },
            // 48 — HIDDEN GARDEN
            {
                id: "hidden_garden",
                title: "Secret Herb Sanctuary",
                desc: "A hidden greenhouse courtyard nestled in a natural sunlit bowl.",
                choices: [
                    {
                        title: "Harvest Rare Flora",
                        icon: "🌿",
                        desc: "Gather medicinal herbs and wild tea leaves.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addResource("herbs", 22);
                            addResource("food", 15);
                            addXp(40);
                            return { success: true, title: "HERBAL BOUNTY", text: "+22 Herbs • +15 Food • +40 XP!" };
                        }
                    },
                    {
                        title: "Drink Spring Water",
                        icon: "💧",
                        desc: "Drink from the crystal spring for full refreshment.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            SaveData.player.energy = SaveData.player.maxEnergy;
                            addXp(30);
                            return { success: true, title: "INVIGORATED", text: "Stamina at 100% • +30 XP!" };
                        }
                    }
                ]
            },
            // 49 — STEEP RIDGE
            {
                id: "steep_ridge",
                title: "Steep Alpine Ridge",
                desc: "A towering granite cliff face offers a dramatic vertical shortcut.",
                choices: [
                    {
                        title: "Scale Cliff Wall",
                        icon: "🧗",
                        desc: "Power climb up the granite face.",
                        cost: { energy: 20 },
                        risk: "LOW",
                        action: () => {
                            player.x += 280;
                            addResource("crystals", 3);
                            addXp(50);
                            return { success: true, title: "SUMMIT CONQUERED", text: "+280m • +3 Crystals • +50 XP!" };
                        }
                    },
                    {
                        title: "Valley Switchbacks",
                        icon: "🚶",
                        desc: "Follow the gentle winding switchback path.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            return { success: true, title: "GENTLE ROUTE", text: "Walked the winding trail safely." };
                        }
                    }
                ]
            },
            // 50 — THE OLD PATH (RARE 3-CHOICE MYSTERY EVENT)
            {
                id: "the_old_path",
                title: "The Whispering Ancient Path",
                desc: "The valley splits three ways before an ancient monument. A strange aura hums in the air.",
                choices: [
                    {
                        title: "Awaken Monument",
                        icon: "🔮",
                        desc: "Infuse the monument with crystals and timber.",
                        cost: { crystals: 2, wood: 20 },
                        risk: "LOW",
                        action: () => {
                            addResource("coins", 150);
                            addResource("crystals", 6);
                            addXp(100);
                            player.x += 350;
                            return { success: true, title: "ANCIENT ANOMALY AWAKENED!", text: "Teleported +350m! +150 Coins • +6 Crystals • +100 XP!" };
                        }
                    },
                    {
                        title: "Survey Ancient Runes",
                        icon: "📜",
                        desc: "Study the inscriptions for valley lore and wisdom.",
                        cost: {},
                        risk: "LOW",
                        action: () => {
                            addXp(80);
                            addResource("herbs", 15);
                            return { success: true, title: "LORE DISCOVERED", text: "+80 XP • +15 Wild Herbs!" };
                        }
                    },
                    {
                        title: "Blaze Through Fast",
                        icon: "⚡",
                        desc: "Sprint right past without lingering.",
                        cost: {},
                        risk: "MEDIUM",
                        action: () => {
                            player.x += 240;
                            return { success: true, title: "BLAZED PAST", text: "+240m Distance gained on Enci!" };
                        }
                    }
                ]
            }
        ],

        checkAffordability(cost) {
            if (!cost) return { affordable: true };
            const r = SaveData.resources;
            if (cost.wood && (r.wood || 0) < cost.wood) return { affordable: false, reason: `Needs ${cost.wood} Wood` };
            if (cost.stone && (r.stone || 0) < cost.stone) return { affordable: false, reason: `Needs ${cost.stone} Stone` };
            if (cost.coins && (r.coins || 0) < cost.coins) return { affordable: false, reason: `Needs ${cost.coins} Coins` };
            if (cost.crystals && (r.crystals || 0) < cost.crystals) return { affordable: false, reason: `Needs ${cost.crystals} Crystals` };
            if (cost.herbs && (r.herbs || 0) < cost.herbs) return { affordable: false, reason: `Needs ${cost.herbs} Herbs` };
            if (cost.food && (r.food || 0) < cost.food) return { affordable: false, reason: `Needs ${cost.food} Food` };
            if (cost.energy && SaveData.player.energy < cost.energy) return { affordable: false, reason: `Needs ${cost.energy} Stamina` };
            return { affordable: true };
        },

        deductCost(cost) {
            if (!cost) return;
            const r = SaveData.resources;
            if (cost.wood) r.wood -= cost.wood;
            if (cost.stone) r.stone -= cost.stone;
            if (cost.coins) r.coins -= cost.coins;
            if (cost.crystals) r.crystals -= cost.crystals;
            if (cost.herbs) r.herbs -= cost.herbs;
            if (cost.food) r.food -= cost.food;
            if (cost.energy) SaveData.player.energy = Math.max(0, SaveData.player.energy - cost.energy);
        },

        triggerEvent(forcedEventId = null) {
            if (isQuickEventActive || gameState !== "PLAYING" || startCutsceneTimer > 0) return;

            let event = null;
            if (forcedEventId) {
                event = this.pool.find(e => e.id === forcedEventId);
            }
            if (!event) {
                // Pick random event from pool
                const randIndex = Math.floor(Math.random() * this.pool.length);
                event = this.pool[randIndex];
            }

            currentQuickEvent = event;
            isQuickEventActive = true;
            timeScale = 0.14; // Dramatic cinematic slow motion
            quickEventTimer = 7.0;
            quickEventResultTimer = 0;
            lastQuickEventDistance = Math.round(player.x / 12);
            quickEventCooldown = 45.0; // 45s cooldown

            playSound("roar");
            this.renderEventUI(event);

            const modal = document.getElementById("quick-event-modal");
            if (modal) modal.classList.remove("hidden");
            const resBanner = document.getElementById("qe-result-banner");
            if (resBanner) resBanner.classList.add("hidden");
        },

        renderEventUI(event) {
            const c0 = event.choices[0];
            const c1 = event.choices[1] || event.choices[0];

            const leftIcon = document.getElementById("qe-left-icon");
            const leftTitle = document.getElementById("qe-left-title");
            const leftSub = document.getElementById("qe-left-sub");
            const leftCard = document.getElementById("qe-left-choice");

            const rightIcon = document.getElementById("qe-right-icon");
            const rightTitle = document.getElementById("qe-right-title");
            const rightSub = document.getElementById("qe-right-sub");
            const rightCard = document.getElementById("qe-right-choice");

            const check0 = this.checkAffordability(c0.cost);
            const check1 = this.checkAffordability(c1.cost);

            if (leftIcon) leftIcon.innerText = c0.icon || "🏃";
            if (leftTitle) leftTitle.innerText = c0.title;
            if (leftSub) {
                let costInfo = "";
                if (c0.cost && Object.keys(c0.cost).length > 0) {
                    costInfo = " (" + Object.entries(c0.cost).map(([k, v]) => v + " " + k).join(", ") + ")";
                }
                leftSub.innerText = check0.affordable ? (c0.desc + costInfo) : ("⚠️ " + check0.reason);
            }
            if (leftCard) leftCard.classList.toggle("disabled", !check0.affordable);

            if (rightIcon) rightIcon.innerText = c1.icon || "🛠️";
            if (rightTitle) rightTitle.innerText = c1.title;
            if (rightSub) {
                let costInfo = "";
                if (c1.cost && Object.keys(c1.cost).length > 0) {
                    costInfo = " (" + Object.entries(c1.cost).map(([k, v]) => v + " " + k).join(", ") + ")";
                }
                rightSub.innerText = check1.affordable ? (c1.desc + costInfo) : ("⚠️ " + check1.reason);
            }
            if (rightCard) rightCard.classList.toggle("disabled", !check1.affordable);
        },

        handleChoiceClick(choiceIdx) {
            if (!isQuickEventActive || !currentQuickEvent || quickEventResultTimer > 0) return;
            const choice = currentQuickEvent.choices[choiceIdx];
            if (!choice) return;

            const check = this.checkAffordability(choice.cost);
            if (!check.affordable) {
                playSound("hit");
                return;
            }

            this.deductCost(choice.cost);
            const result = choice.action();

            if (result && result.success) {
                playSound("upgrade");
                spawnParticles(player.x, player.y - 30, "#4ade80", 18);
            } else {
                playSound("hit");
                spawnParticles(player.x, player.y - 30, "#ef4444", 14);
            }

            SaveData.eventHistory[currentQuickEvent.id] = choiceIdx;
            updateHUD();
            saveGame();

            showFloatingText(player.x, player.y - 45, result.title + ": " + result.text, result.success ? "#4ade80" : "#ef4444");

            // Lock further clicks and schedule resume
            quickEventResultTimer = 0.85;
        },

        update(dt) {
            if (quickEventCooldown > 0) {
                quickEventCooldown -= dt;
            }

            // Check if we should trigger a new Quick Event
            if (!isQuickEventActive && gameState === "PLAYING" && startCutsceneTimer <= 0) {
                const totalCycleX = 16800;
                const cycleX = ((player.x % totalCycleX) + totalCycleX) % totalCycleX;
                const cycleNum = Math.floor(player.x / totalCycleX);
                if (!this.triggeredZones) this.triggeredZones = {};

                const caveKey = `cave_${cycleNum}`;
                if (cycleX >= 4350 && cycleX <= 4750 && !this.triggeredZones[caveKey]) {
                    this.triggeredZones[caveKey] = true;
                    this.triggerEvent("sketch_cave_entry");
                    return;
                }

                const parkourKey = `parkour_${cycleNum}`;
                if (cycleX >= 8350 && cycleX <= 8750 && !this.triggeredZones[parkourKey]) {
                    this.triggeredZones[parkourKey] = true;
                    this.triggerEvent("sketch_levitating_parkour");
                    return;
                }

                const trainKey = `train_${cycleNum}`;
                if (cycleX >= 10750 && cycleX <= 11150 && !this.triggeredZones[trainKey]) {
                    this.triggeredZones[trainKey] = true;
                    this.triggerEvent("sketch_train_parkour");
                    return;
                }

                const rocketKey = `rocket_${cycleNum}`;
                if (cycleX >= 13150 && cycleX <= 13550 && !this.triggeredZones[rocketKey]) {
                    this.triggeredZones[rocketKey] = true;
                    this.triggerEvent("sketch_rocket_launch");
                    return;
                }

                const currentDistMeters = Math.round(player.x / 12);
                const distTraveledSinceLast = currentDistMeters - lastQuickEventDistance;
                // Trigger event every ~350m or on 45s cooldown timer
                if (distTraveledSinceLast >= 350 && quickEventCooldown <= 0) {
                    this.triggerEvent();
                }
            }

            if (isQuickEventActive) {
                if (quickEventResultTimer > 0) {
                    quickEventResultTimer -= dt;
                    if (quickEventResultTimer <= 0) {
                        this.finishEvent();
                    }
                } else {
                    quickEventTimer -= dt;
                    const fillEl = document.getElementById("qe-timer-fill");
                    const txtEl = document.getElementById("qe-timer-text");

                    if (txtEl) {
                        txtEl.innerText = Math.max(0, quickEventTimer).toFixed(1) + "s";
                        if (quickEventTimer <= 2.0) {
                            txtEl.style.color = "#ef4444";
                        } else if (quickEventTimer <= 4.0) {
                            txtEl.style.color = "#f59e0b";
                        } else {
                            txtEl.style.color = "#38bdf8";
                        }
                    }

                    if (fillEl) {
                        const pct = Math.max(0, Math.min(100, (quickEventTimer / 7.0) * 100));
                        fillEl.style.width = pct + "%";
                        if (quickEventTimer <= 2.0) {
                            fillEl.style.background = "linear-gradient(90deg, #ef4444, #f87171)";
                        } else if (quickEventTimer <= 4.0) {
                            fillEl.style.background = "linear-gradient(90deg, #f59e0b, #fbbf24)";
                        } else {
                            fillEl.style.background = "linear-gradient(90deg, #38bdf8, #818cf8)";
                        }
                    }

                    // Auto-execute default choice when timer hits 0
                    if (quickEventTimer <= 0) {
                        // Find first affordable option or default to index 1
                        let chosenIdx = 1;
                        if (!currentQuickEvent.choices[1] || !this.checkAffordability(currentQuickEvent.choices[1].cost).affordable) {
                            chosenIdx = 0;
                        }
                        this.handleChoiceClick(chosenIdx);
                    }
                }
            }
        },

        finishEvent() {
            isQuickEventActive = false;
            timeScale = 1.0;
            currentQuickEvent = null;
            const modal = document.getElementById("quick-event-modal");
            if (modal) modal.classList.add("hidden");
        }
    };

    window.QuickEventManager = QuickEventManager;

    // ============================================================================
    // 13. PARALLAX & ENVIRONMENT RENDERING
    // ============================================================================
    function drawValleyParallax(camX, biomeIdx) {
        const biome = getBiomeForX(player.x);

        // 1. Sky Gradient covering full wide camera viewport
        const grad = ctx.createLinearGradient(0, -V_HEIGHT, 0, V_HEIGHT * 2);
        grad.addColorStop(0, biome.sky[0]);
        grad.addColorStop(0.6, biome.sky[1]);
        grad.addColorStop(1, biome.sky[2]);
        ctx.fillStyle = grad;
        ctx.fillRect(-V_WIDTH * 2, -V_HEIGHT * 2, V_WIDTH * 6, V_HEIGHT * 5);

        // A. MOON BIOME: Deep Cosmic Space, Twinkling Stars, and Glowing Blue Earth
        if (biome.isMoon) {
            // Stars
            ctx.fillStyle = "#ffffff";
            for (let i = 0; i < 65; i++) {
                const sx = ((i * 137.5 + (i * i * 31)) % (V_WIDTH + 400)) - 200;
                const sy = (i * 93.7) % 240;
                const twinkle = 0.5 + Math.sin(performance.now() * 0.003 + i * 1.5) * 0.5;
                ctx.globalAlpha = twinkle;
                ctx.fillRect(sx, sy, (i % 3 === 0) ? 2.5 : 1.5, (i % 3 === 0) ? 2.5 : 1.5);
            }
            ctx.globalAlpha = 1.0;

            // Glowing Blue Earth in the Lunar Sky!
            ctx.save();
            const earthX = V_WIDTH * 0.76;
            const earthY = 90;
            // Atmosphere halo
            const earthHalo = ctx.createRadialGradient(earthX, earthY, 28, earthX, earthY, 55);
            earthHalo.addColorStop(0, "rgba(56, 189, 248, 0.45)");
            earthHalo.addColorStop(1, "rgba(56, 189, 248, 0)");
            ctx.fillStyle = earthHalo;
            ctx.beginPath();
            ctx.arc(earthX, earthY, 55, 0, Math.PI * 2);
            ctx.fill();

            // Earth marble body
            ctx.fillStyle = "#0284c7";
            ctx.beginPath();
            ctx.arc(earthX, earthY, 32, 0, Math.PI * 2);
            ctx.fill();

            // Green continents & white clouds
            ctx.fillStyle = "#10b981";
            ctx.beginPath();
            ctx.arc(earthX - 8, earthY - 6, 12, 0, Math.PI * 2);
            ctx.arc(earthX + 10, earthY + 8, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.arc(earthX + 2, earthY - 12, 14, 0, Math.PI * 2);
            ctx.arc(earthX - 10, earthY + 14, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Far Lunar Ridges & Regolith Peaks
            ctx.fillStyle = biome.mtnFar;
            const mtnW = 300;
            const mtnOff = -((camX * 0.08) % mtnW);
            for (let x = mtnOff - mtnW * 2; x < V_WIDTH * 3; x += mtnW) {
                ctx.beginPath();
                ctx.moveTo(x, GROUND_Y);
                ctx.lineTo(x + mtnW * 0.5, GROUND_Y - 140);
                ctx.lineTo(x + mtnW, GROUND_Y);
                ctx.closePath();
                ctx.fill();
            }
            return;
        }

        // B. SUBTERRANEAN MINE BIOME: Cavern Rock Ceiling & Stalactites
        if (biome.hasRoof) {
            // Cavern Rock Ceiling Slab
            ctx.fillStyle = "#09090b";
            ctx.fillRect(-V_WIDTH * 2, -V_HEIGHT, V_WIDTH * 5, 80);

            // Stalactites hanging from ceiling
            ctx.fillStyle = "#18181b";
            const stSpacing = 60;
            const stOff = -((camX * 0.15) % stSpacing);
            for (let x = stOff - stSpacing * 2; x < V_WIDTH * 3; x += stSpacing) {
                const stH = 35 + ((Math.abs(Math.sin(x * 0.07)) * 45) | 0);
                ctx.beginPath();
                ctx.moveTo(x, 80);
                ctx.lineTo(x + 18, 80 + stH);
                ctx.lineTo(x + 36, 80);
                ctx.closePath();
                ctx.fill();
            }

            // Background rocky cavern pillars
            ctx.fillStyle = "#27272a";
            const pilSpacing = 280;
            const pilOff = -((camX * 0.18) % pilSpacing);
            for (let x = pilOff - pilSpacing * 2; x < V_WIDTH * 3; x += pilSpacing) {
                ctx.fillRect(x, 80, 40, GROUND_Y - 80);
            }
            return;
        }

        // C. SPEEDING FREIGHT TRAIN BIOME: Motion Speed Lines
        if (biome.isTrain) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
            for (let i = 0; i < 24; i++) {
                const slY = 60 + (i * 15) % 280;
                const slX = ((i * 180 - camX * 2.2) % (V_WIDTH + 400) + (V_WIDTH + 400)) % (V_WIDTH + 400) - 200;
                const slLen = 80 + (i * 25) % 120;
                ctx.fillRect(slX, slY, slLen, 2);
            }
        }

        // D. SURFACE / SKY BIOMES: Multi-stop Atmospheric Sky Gradient + Mountain Silhouettes + Sun & Clouds
        // Glowing Golden-Sun
        ctx.save();
        ctx.shadowColor = "#fde047";
        ctx.shadowBlur = 32;
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(V_WIDTH * 0.82, 80, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Far Mountain Silhouettes (Layer 1 - 0.05x Parallax)
        ctx.fillStyle = biome.mtnFar || "#60a5fa";
        const m1W = 380;
        const m1Off = -((camX * 0.05) % m1W);
        for (let x = m1Off - m1W * 2; x < V_WIDTH * 2.5; x += m1W) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y);
            ctx.lineTo(x + m1W * 0.45, GROUND_Y - 145);
            ctx.lineTo(x + m1W * 0.85, GROUND_Y - 110);
            ctx.lineTo(x + m1W, GROUND_Y);
            ctx.closePath();
            ctx.fill();
        }

        // Mid Mountain Ridge Silhouettes (Layer 2 - 0.10x Parallax)
        ctx.fillStyle = biome.mtnMid || "#3b82f6";
        const m2W = 320;
        const m2Off = -((camX * 0.10) % m2W);
        for (let x = m2Off - m2W * 2; x < V_WIDTH * 2.5; x += m2W) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y);
            ctx.lineTo(x + m2W * 0.38, GROUND_Y - 95);
            ctx.lineTo(x + m2W * 0.72, GROUND_Y - 75);
            ctx.lineTo(x + m2W, GROUND_Y);
            ctx.closePath();
            ctx.fill();
        }

        // Procedural Clouds (0.18x - 0.28x Parallax)
        for (const c of clouds) {
            const img = EnvLibrary.canvases[c.key];
            if (img) {
                const span = V_WIDTH + 600;
                const cx = ((c.x - camX * c.speed) % span + span) % span - 300;
                ctx.drawImage(img, cx, c.y);
            }
        }
    }

    function drawWorld(camX, biomeIdx) {
        const biome = getBiomeForX(player.x);
        const windSway = Math.sin(performance.now() * 0.003) * 2.5;

        while (worldGeneratedUpToX < player.x + 3500) {
            spawnChunk(worldGeneratedUpToX);
        }

        const viewLeft = -600;
        const viewRight = V_WIDTH + 900;

        // 1. Midground Scenery (School, Kaufland, Lush Trees, Cabins, Mine, Train, Rocket, Moon)
        for (const chunk of activeChunks) {
            for (const s of chunk.scenery) {
                if (s.layer === "midground") {
                    const sx = s.x - camX;
                    const img = assets[s.key] || EnvLibrary.canvases[s.key];
                    if (img && sx + (s.w || (img.width || 100)) >= viewLeft && sx <= viewRight) {
                        const sw = s.w || (img.width || 100);
                        const sh = s.h || (img.height || 100);
                        const sway = s.key.startsWith("tree") ? windSway * 0.6 : 0;
                        if (img.complete && img.naturalWidth > 0) {
                            ctx.drawImage(img, sx + sway, s.y - sh, sw, sh);
                        } else if (img instanceof HTMLCanvasElement) {
                            ctx.drawImage(img, sx + sway, s.y - sh, sw, sh);
                        }

                        // Hanging Mine Lamp Downward Light Cone
                        if (s.key === "mine_light_hanging" && MineState.lightsOn) {
                            ctx.save();
                            const coneGrad = ctx.createRadialGradient(sx + sw / 2, s.y, 4, sx + sw / 2, s.y + 70, 95);
                            const alpha = MineState.flickering ? (0.18 + Math.random() * 0.3) : 0.45;
                            coneGrad.addColorStop(0, `rgba(254, 240, 138, ${alpha})`);
                            coneGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
                            ctx.fillStyle = coneGrad;
                            ctx.beginPath();
                            ctx.moveTo(sx + sw / 2 - 8, s.y);
                            ctx.lineTo(sx + sw / 2 + 8, s.y);
                            ctx.lineTo(sx + sw / 2 + 65, s.y + 85);
                            ctx.lineTo(sx + sw / 2 - 65, s.y + 85);
                            ctx.closePath();
                            ctx.fill();
                            ctx.restore();
                        }

                        // Train Locomotive Smokestack Steam
                        if (s.key === "train_locomotive") {
                            ctx.save();
                            ctx.fillStyle = "rgba(226, 232, 240, 0.45)";
                            for (let i = 0; i < 3; i++) {
                                const puffX = sx + 32 - ((performance.now() * 0.08 + i * 20) % 60);
                                const puffY = s.y - sh - 8 - i * 10;
                                ctx.beginPath();
                                ctx.arc(puffX, puffY, 8 + i * 4, 0, Math.PI * 2);
                                ctx.fill();
                            }
                            ctx.restore();
                        }

                        // Orbital Rocket Launch FX
                        if (s.key === "rocket_ship") {
                            if (RocketState.state === "COUNTDOWN") {
                                ctx.save();
                                ctx.fillStyle = "rgba(241, 245, 249, 0.65)";
                                for (let i = 0; i < 6; i++) {
                                    const cx = sx + sw / 2 + (Math.sin(performance.now() * 0.01 + i) * 35);
                                    const cy = s.y - 10 - Math.random() * 20;
                                    ctx.beginPath();
                                    ctx.arc(cx, cy, 14 + Math.random() * 10, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                                ctx.restore();
                            } else if (RocketState.state === "LAUNCHING") {
                                ctx.save();
                                const fireGrad = ctx.createLinearGradient(sx + sw / 2, s.y, sx + sw / 2, s.y + 110);
                                fireGrad.addColorStop(0, "#fde047");
                                fireGrad.addColorStop(0.35, "#f97316");
                                fireGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
                                ctx.fillStyle = fireGrad;
                                ctx.beginPath();
                                ctx.moveTo(sx + sw / 2 - 25, s.y);
                                ctx.lineTo(sx + sw / 2 + 25, s.y);
                                ctx.lineTo(sx + sw / 2 + (Math.sin(performance.now() * 0.05) * 12), s.y + 110);
                                ctx.closePath();
                                ctx.fill();
                                ctx.restore();
                            }
                        }
                    }
                }
            }
        }

        // 2. Terrain, Bridges & Water
        for (const chunk of activeChunks) {
            // Water
            for (const w of chunk.waterGaps) {
                const wx = w.x - camX;
                if (wx + w.w >= viewLeft && wx <= viewRight) {
                    const waterGrad = ctx.createLinearGradient(0, GROUND_Y, 0, V_HEIGHT);
                    waterGrad.addColorStop(0, "#0284c7");
                    waterGrad.addColorStop(1, "#082f49");
                    ctx.fillStyle = waterGrad;
                    ctx.fillRect(wx, GROUND_Y + 10, w.w, V_HEIGHT - GROUND_Y);

                    const ripple = Math.sin(performance.now() * 0.006 + w.x) * 4;
                    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                    ctx.fillRect(wx + 10, GROUND_Y + 16 + ripple, w.w - 20, 3);
                }
            }

            // Ground Grass & Dirt
            for (const seg of chunk.ground) {
                const gx = seg.x - camX;
                if (gx + seg.w >= viewLeft && gx <= viewRight) {
                    ctx.fillStyle = biome.grassTop;
                    ctx.fillRect(gx, GROUND_Y, seg.w, 10);
                    ctx.fillStyle = biome.grassSub;
                    ctx.fillRect(gx, GROUND_Y + 10, seg.w, 24);
                    ctx.fillStyle = biome.dirt;
                    ctx.fillRect(gx, GROUND_Y + 34, seg.w, V_HEIGHT - GROUND_Y);

                    ctx.fillStyle = "#bef264";
                    for (let bx = 4; bx < seg.w; bx += 20) {
                        ctx.fillRect(gx + bx, GROUND_Y - 3, 3, 4);
                    }
                }
            }

            // Bridges (Modern Concrete & Wooden)
            for (const br of chunk.bridges) {
                const bx = br.x - camX;
                if (bx + br.w >= viewLeft && bx <= viewRight) {
                    const brImg = EnvLibrary.canvases[br.key] || EnvLibrary.canvases["modern_bridge"];
                    if (brImg) {
                        ctx.drawImage(brImg, bx, br.y - 120, br.w, 180);
                    } else {
                        // Chunky Wooden / Concrete Pier Bridge
                        ctx.fillStyle = "#78350f";
                        ctx.fillRect(bx, br.y, br.w, br.h || 36);
                        ctx.fillStyle = "#92400e";
                        ctx.fillRect(bx, br.y, br.w, 8);
                        ctx.fillStyle = "#451a03";
                        for (let px = 0; px < br.w; px += 24) {
                            ctx.fillRect(bx + px, br.y, 4, br.h || 36);
                        }
                    }
                }
            }

            // Shaft Ladders (Zone 5102 Tall Mine Ladder)
            for (const l of (chunk.ladders || [])) {
                const lx = l.x - camX;
                if (lx + l.w >= viewLeft && lx <= viewRight) {
                    const ladderImg = EnvLibrary.canvases["mine_ladder"];
                    if (ladderImg) {
                        ctx.drawImage(ladderImg, lx, l.y, l.w, l.h);
                    } else {
                        ctx.fillStyle = "#78350f";
                        ctx.fillRect(lx, l.y, 6, l.h);
                        ctx.fillRect(lx + l.w - 6, l.y, 6, l.h);
                        for (let ry = l.y + 12; ry < l.y + l.h; ry += 18) {
                            ctx.fillRect(lx + 4, ry, l.w - 8, 5);
                        }
                    }
                }
            }

            // Chunky Platforms (Levitating Runic Blocks, Train Rooftops, Cliff Ledges)
            for (const p of chunk.platforms) {
                const px = p.x - camX;
                if (px + p.w >= viewLeft && px <= viewRight) {
                    const ph = p.h || 38;
                    if (p.isLevitating) {
                        // High-tech Anti-Gravity Levitating Runic Slabs
                        const levImg = EnvLibrary.canvases["levitating_block"];
                        if (levImg) {
                            ctx.drawImage(levImg, px, p.y - 12, p.w, ph + 16);
                        } else {
                            // Thick futuristic rune slab
                            ctx.fillStyle = "#0f172a";
                            ctx.fillRect(px, p.y, p.w, ph);
                            ctx.fillStyle = "#38bdf8";
                            ctx.fillRect(px, p.y, p.w, 5);
                            ctx.fillStyle = "#0284c7";
                            ctx.fillRect(px, p.y + ph - 6, p.w, 6);
                            // Cyan glowing rune lines
                            ctx.fillStyle = "#7dd3fc";
                            for (let rx = 16; rx < p.w - 16; rx += 28) {
                                ctx.fillRect(px + rx, p.y + 12, 14, 4);
                            }
                        }
                        // Anti-gravity thruster glow underneath
                        ctx.save();
                        ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
                        ctx.beginPath();
                        ctx.ellipse(px + p.w / 2, p.y + ph + 6, p.w * 0.4, 6, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    } else if (p.isTrainCar) {
                        // Industrial Train Rooftop Heavy Steel Deck
                        ctx.fillStyle = "#1e293b";
                        ctx.fillRect(px, p.y, p.w, ph);
                        ctx.fillStyle = "#f59e0b";
                        ctx.fillRect(px, p.y, p.w, 6);
                        ctx.fillStyle = "#334155";
                        ctx.fillRect(px, p.y + 6, p.w, ph - 12);
                        // Rivets
                        ctx.fillStyle = "#94a3b8";
                        for (let rx = 12; rx < p.w - 12; rx += 30) {
                            ctx.fillRect(px + rx, p.y + 10, 3, 3);
                            ctx.fillRect(px + rx, p.y + ph - 8, 3, 3);
                        }
                    } else {
                        // Chunky Natural Cliff & Island Strata (3D Bevel)
                        ctx.fillStyle = biome.grassTop;
                        ctx.fillRect(px, p.y, p.w, 8);
                        ctx.fillStyle = biome.grassSub || "#3f6212";
                        ctx.fillRect(px, p.y + 8, p.w, 10);
                        ctx.fillStyle = biome.dirt || "#334155";
                        ctx.fillRect(px, p.y + 18, p.w, ph - 18);
                        // Deep rock shadow bevel
                        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
                        ctx.fillRect(px, p.y + ph - 6, p.w, 6);
                        // Grass blade tufts on platform top
                        ctx.fillStyle = "#bef264";
                        for (let bx = 8; bx < p.w - 8; bx += 24) {
                            ctx.fillRect(px + bx, p.y - 3, 3, 4);
                        }
                    }
                }
            }

            // Gameplay Scenery & Interactable Nodes
            for (const s of chunk.scenery) {
                if (s.layer === "gameplay") {
                    const sx = s.x - camX;
                    const img = EnvLibrary.canvases[s.key];
                    if (img && sx + img.width >= viewLeft && sx <= viewRight) {
                        ctx.drawImage(img, sx, s.y - img.height);
                    }
                }
            }

            // Interactive World Nodes
            for (const node of chunk.interactables) {
                if (!node.depleted) {
                    const nx = node.x - camX;
                    if (nx >= viewLeft && nx <= viewRight) {
                        if (node.type === "chest") {
                            const img = EnvLibrary.canvases["treasure_chest"];
                            if (img) ctx.drawImage(img, nx - 18, node.y - 14);
                        } else if (node.type === "campfire") {
                            const img = EnvLibrary.canvases["campfire_node"];
                            if (img) ctx.drawImage(img, nx - 18, node.y - 14);
                        } else if (node.type === "mine_generator") {
                            const img = EnvLibrary.canvases["mine_generator"];
                            if (img) ctx.drawImage(img, nx - 22, node.y - 48);
                        } else if (node.type === "moon_flag") {
                            const img = EnvLibrary.canvases["moon_flag"];
                            if (img) ctx.drawImage(img, nx - 20, node.y - 55);
                        } else if (node.type === "moon_rover") {
                            const img = EnvLibrary.canvases["moon_rover"];
                            if (img) ctx.drawImage(img, nx - 38, node.y - 44);
                        } else if (node.type === "moon_crystal") {
                            const img = EnvLibrary.canvases["moon_crystal"];
                            if (img) ctx.drawImage(img, nx - 16, node.y - 36);
                        }

                        if (nearestInteractiveNode === node) {
                            const floatBounce = Math.sin(performance.now() * 0.008) * 4;
                            ctx.save();
                            ctx.fillStyle = "rgba(11, 15, 30, 0.9)";
                            ctx.strokeStyle = "#fbbf24";
                            ctx.lineWidth = 1.5;
                            ctx.font = "bold 10px sans-serif";
                            ctx.textAlign = "center";
                            const txt = "[E] " + node.label;
                            const tw = ctx.measureText(txt).width + 12;
                            ctx.beginPath();
                            ctx.roundRect(nx - tw / 2, node.y - 45 + floatBounce, tw, 18, 6);
                            ctx.fill();
                            ctx.stroke();
                            ctx.fillStyle = "#fde047";
                            ctx.fillText(txt, nx, node.y - 32 + floatBounce);
                            ctx.restore();
                        }
                    }
                }
            }

            // Pickups
            for (const p of chunk.pickups) {
                if (!p.collected) {
                    const px = p.x - camX;
                    if (px >= viewLeft && px <= viewRight) {
                        const py = p.y + Math.sin(performance.now() * 0.005 + p.x) * 4;
                        ctx.save();
                        ctx.shadowColor = p.type === "xp" ? "#a855f7" : "#facc15";
                        ctx.shadowBlur = 10;
                        ctx.font = "14px sans-serif";
                        ctx.textAlign = "center";
                        const icon = p.type === "xp" ? "✨" : "🪙";
                        ctx.fillText(icon, px, py);
                        ctx.restore();
                    }
                }
            }

            // Foreground Foliage
            for (const s of chunk.scenery) {
                if (s.layer === "foreground") {
                    const sx = s.x - camX;
                    const img = EnvLibrary.canvases[s.key];
                    if (img && sx + img.width >= viewLeft && sx <= viewRight) {
                        ctx.drawImage(img, sx + windSway, s.y - img.height);
                    }
                }
            }
        }

        // Mine Lighting Blackout Vignette & Headlamp
        if (biome.isMine && !MineState.lightsOn) {
            ctx.save();
            const px = player.x - camX;
            const py = player.y - 45;
            const darkGrad = ctx.createRadialGradient(px, py, 35, px, py, 140);
            darkGrad.addColorStop(0, "rgba(0, 0, 0, 0.05)");
            darkGrad.addColorStop(0.65, "rgba(3, 3, 5, 0.78)");
            darkGrad.addColorStop(1, "rgba(2, 2, 4, 0.95)");
            ctx.fillStyle = darkGrad;
            ctx.fillRect(-V_WIDTH * 2, -V_HEIGHT * 2, V_WIDTH * 5, V_HEIGHT * 5);

            // Emergency Flashing Outage Alert
            if (Math.floor(performance.now() / 400) % 2 === 0) {
                ctx.fillStyle = "#ef4444";
                ctx.font = "bold 13px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("⚠️ POWER OUTAGE! ACTIVATE GENERATOR [E]!", px, py - 65);
            }
            ctx.restore();
        }

        // Weather particles
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        for (const p of weatherParticles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = V_WIDTH;
            if (p.x > V_WIDTH) p.x = 0;
            if (p.y > V_HEIGHT) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Wildlife (Birds & Butterflies)
        for (const w of wildlife) {
            w.x += w.vx;
            if (w.x > camX + V_WIDTH + 100) w.x = camX - 100;
            const wx = w.x - camX;
            if (w.type === "bird") {
                w.flap += 0.2;
                const fy = w.y + Math.sin(w.flap) * 3;
                ctx.fillStyle = "#334155";
                ctx.beginPath();
                ctx.moveTo(wx, fy);
                ctx.lineTo(wx + 8, fy - 4);
                ctx.lineTo(wx + 16, fy);
                ctx.lineTo(wx + 8, fy - 2);
                ctx.closePath();
                ctx.fill();
            } else if (w.type === "butterfly") {
                w.timer += 0.1;
                const by = w.y + Math.sin(w.timer) * 8;
                ctx.fillStyle = "#f472b6";
                ctx.beginPath();
                ctx.arc(wx, by, 3, 0, Math.PI * 2);
                ctx.arc(wx + 4, by, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ============================================================================
    // 14. GAME LOOP & STATE MANAGEMENT
    // ============================================================================
    function startGame() {
        initAudio();
        gameState = "PLAYING";
        gameTime = 0;
        score = 0;
        startCutsceneTimer = 2.4; // 2.4s dramatic opening
        player.reset();
        marta.reset();
        enci.reset();
        initWorld();
        playSound("roar");

        const modals = ["start-modal", "cabin-modal", "kaufland-modal", "inventory-modal", "quests-modal", "settings-modal"];
        modals.forEach(id => {
            const m = document.getElementById(id);
            if (m) m.classList.add("hidden");
        });
    }
    window.startGame = startGame;

    let lastTime = performance.now();
    let cameraX = 0;

    function gameLoop(now) {
        const realDt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        const scaledDt = realDt * timeScale;

        QuickEventManager.update(realDt);

        if (gameState === "PLAYING") {
            gameTime += scaledDt;
            score += scaledDt * 18;

            if (startCutsceneTimer > 0) {
                startCutsceneTimer -= realDt;
            }

            player.update(scaledDt);
            marta.update(scaledDt);
            enci.update(scaledDt);

            const activeBiome = getBiomeForX(player.x);
            MineState.update(scaledDt, activeBiome.id);
            RocketState.update(scaledDt);

            // Update HUD zone name badge
            const zoneEl = document.getElementById("hud-zone-name");
            if (zoneEl && zoneEl.innerText !== activeBiome.name) {
                zoneEl.innerText = activeBiome.name;
            }

            // Camera follow logic
            if (startCutsceneTimer > 1.2) {
                const targetCamX = enci.x - V_WIDTH * 0.15;
                cameraX += (targetCamX - cameraX) * 0.25;
            } else if (startCutsceneTimer > 0) {
                const targetCamX = player.x - V_WIDTH * 0.38;
                cameraX += (targetCamX - cameraX) * 0.22;
            } else {
                const targetCamX = player.x - V_WIDTH * 0.38;
                cameraX += (targetCamX - cameraX) * 0.12;
            }
        }

        if (ctx) {
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            const currentBiomeIdx = Math.floor(player.x / 2800);

            const CAMERA_ZOOM = 1.68;
            ctx.save();
            // Zoom centered on gameplay ground area
            ctx.translate(V_WIDTH * 0.5, V_HEIGHT * 0.65);
            ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
            ctx.translate(-V_WIDTH * 0.5, -V_HEIGHT * 0.65);

            // 1. Parallax Background
            drawValleyParallax(cameraX, currentBiomeIdx);

            // 2. World Elements & Interactables
            drawWorld(cameraX, currentBiomeIdx);

            // 3. Characters
            enci.render(cameraX);
            marta.render(cameraX);
            player.render(cameraX);

            // 4. Floating Feedback Texts
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                const ft = floatingTexts[i];
                ft.y += ft.vy;
                ft.alpha -= scaledDt * 0.8;
                if (ft.alpha <= 0) {
                    floatingTexts.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = ft.alpha;
                    ctx.font = "bold 13px sans-serif";
                    ctx.fillStyle = ft.color;
                    ctx.fillText(ft.text, ft.x - cameraX, ft.y);
                    ctx.restore();
                }
            }

            // 5. Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= scaledDt * 1.5;
                if (p.life <= 0) {
                    particles.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
                    ctx.restore();
                }
            }

            ctx.restore(); // Restore camera zoom transform for UI overlays

            // 6. Threat Banner & Overlay
            const distPx = Math.hypot(player.x - enci.x, player.y - enci.y);
            const distMeters = Math.max(0, Math.round(distPx / 12));

            const distEl = document.getElementById("distance-display");
            if (distEl) distEl.innerText = Math.max(0, Math.round(player.x / 12)) + "m";
            const dangerEl = document.getElementById("danger-meter");
            if (dangerEl) dangerEl.innerText = distMeters + "m";

            if (startCutsceneTimer > 0 && gameState === "PLAYING") {
                ctx.save();
                const pulse = Math.sin(performance.now() * 0.015) * 6;
                ctx.fillStyle = "rgba(220, 38, 38, 0.4)";
                ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

                ctx.font = `900 ${44 + pulse}px sans-serif`;
                ctx.textAlign = "center";
                ctx.fillStyle = "#ef4444";
                ctx.shadowColor = "#dc2626";
                ctx.shadowBlur = 35;
                ctx.fillText("FUSS! JÖN ENCI!", V_WIDTH / 2, 170);

                ctx.font = "bold 18px monospace";
                ctx.fillStyle = "#ffffff";
                ctx.shadowBlur = 10;
                ctx.fillText(`⚠️ ENCI START: 300m BEHIND! ⚠️`, V_WIDTH / 2, 215);
                ctx.restore();
            } else if (distMeters < 30 && gameState === "PLAYING") {
                const urgency = (30 - distMeters) / 30.0;
                const flash = (Math.sin(performance.now() * 0.012) * 0.5 + 0.5) * urgency * 0.45;
                const radial = ctx.createRadialGradient(
                    V_WIDTH / 2, V_HEIGHT / 2, V_WIDTH * 0.25,
                    V_WIDTH / 2, V_HEIGHT / 2, V_WIDTH * 0.65
                );
                radial.addColorStop(0, "rgba(220, 38, 38, 0)");
                radial.addColorStop(1, "rgba(220, 38, 38, " + flash + ")");
                ctx.fillStyle = radial;
                ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
            }

            if (gameState === "GAMEOVER") {
                ctx.fillStyle = "rgba(3, 1, 10, 0.85)";
                ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

                ctx.save();
                ctx.font = "900 42px sans-serif";
                ctx.textAlign = "center";
                ctx.fillStyle = "#ef4444";
                ctx.shadowColor = "#dc2626";
                ctx.shadowBlur = 25;
                ctx.fillText("EXPEDITION OVER", V_WIDTH / 2, V_HEIGHT / 2 - 50);

                ctx.font = "bold 20px monospace";
                ctx.fillStyle = "#38bdf8";
                ctx.shadowBlur = 0;
                ctx.fillText("DISTANCE: " + Math.round(player.x / 12) + "m", V_WIDTH / 2, V_HEIGHT / 2);

                ctx.font = "bold 15px sans-serif";
                ctx.fillStyle = "#94a3b8";
                ctx.fillText("Tap anywhere to restart expedition", V_WIDTH / 2, V_HEIGHT / 2 + 45);
                ctx.restore();
            }
        }

        requestAnimationFrame(gameLoop);
    }

    window.addEventListener("pointerdown", () => {
        if (gameState === "GAMEOVER") {
            startGame();
        }
    });

    function initApp() {
        resizeCanvas();
        setupTouchControls();
        initWorld();
        updateHUD();
        updateAudioIcon();
        requestAnimationFrame(gameLoop);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initApp);
    } else {
        initApp();
    }
})();
