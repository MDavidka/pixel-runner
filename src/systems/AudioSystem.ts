import { SaveSystem } from './SaveSystem';

export class AudioSystem {
    private static instance: AudioSystem;
    private ctx: AudioContext | null = null;
    private saveSystem: SaveSystem;

    private constructor() {
        this.saveSystem = SaveSystem.getInstance();
    }

    public static getInstance(): AudioSystem {
        if (!AudioSystem.instance) {
            AudioSystem.instance = new AudioSystem();
        }
        return AudioSystem.instance;
    }

    public init(): void {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public play(type: 'jump' | 'double_jump' | 'land' | 'pickup' | 'hit' | 'build' | 'dash' | 'mission' | 'gameover'): void {
        if (!this.saveSystem.getData().soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            switch (type) {
                case 'jump':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(260, now);
                    osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                    osc.start(now);
                    osc.stop(now + 0.12);
                    break;

                case 'double_jump':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(420, now);
                    osc.frequency.exponentialRampToValueAtTime(740, now + 0.14);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
                    osc.start(now);
                    osc.stop(now + 0.14);
                    break;

                case 'dash':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                    osc.start(now);
                    osc.stop(now + 0.15);
                    break;

                case 'land':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(120, now);
                    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                    osc.start(now);
                    osc.stop(now + 0.08);
                    break;

                case 'pickup':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(520, now);
                    osc.frequency.setValueAtTime(780, now + 0.06);
                    osc.frequency.setValueAtTime(1040, now + 0.12);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                    osc.start(now);
                    osc.stop(now + 0.18);
                    break;

                case 'hit':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
                    gain.gain.setValueAtTime(0.35, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                    osc.start(now);
                    osc.stop(now + 0.22);
                    break;

                case 'build':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(320, now);
                    osc.frequency.setValueAtTime(480, now + 0.08);
                    osc.frequency.setValueAtTime(640, now + 0.16);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                    osc.start(now);
                    osc.stop(now + 0.28);
                    break;

                case 'mission':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.setValueAtTime(554.37, now + 0.1);
                    osc.frequency.setValueAtTime(659.25, now + 0.2);
                    osc.frequency.setValueAtTime(880, now + 0.3);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                    osc.start(now);
                    osc.stop(now + 0.5);
                    break;

                case 'gameover':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(140, now);
                    osc.frequency.linearRampToValueAtTime(30, now + 0.7);
                    gain.gain.setValueAtTime(0.4, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
                    osc.start(now);
                    osc.stop(now + 0.7);
                    break;
            }
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    }
}
