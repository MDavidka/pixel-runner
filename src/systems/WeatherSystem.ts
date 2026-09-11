import * as Phaser from 'phaser';

export type WeatherType = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'HEAVY_RAIN' | 'FOG' | 'SNOW';

export class WeatherSystem {
    private scene: Phaser.Scene;
    private currentWeather: WeatherType = 'CLEAR';
    private weatherTimer: number = 0;
    private weatherDuration: number = 30; // Change weather every 30s
    private rainParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private snowParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private leafParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private fogGraphics: Phaser.GameObjects.Graphics | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initEmitters();
    }

    private initEmitters(): void {
        // Rain particle texture
        if (!this.scene.textures.exists('particle_rain')) {
            const rt = this.scene.add.renderTexture(0, 0, 2, 12);
            const g = this.scene.add.graphics();
            g.fillStyle(0x7dd3fc, 0.85);
            g.fillRect(0, 0, 2, 12);
            rt.draw(g);
            rt.saveTexture('particle_rain');
            rt.destroy();
            g.destroy();
        }

        // Snow particle texture
        if (!this.scene.textures.exists('particle_snow')) {
            const rt = this.scene.add.renderTexture(0, 0, 6, 6);
            const g = this.scene.add.graphics();
            g.fillStyle(0xffffff, 0.95);
            g.fillCircle(3, 3, 3);
            rt.draw(g);
            rt.saveTexture('particle_snow');
            rt.destroy();
            g.destroy();
        }

        // Leaf particle texture
        if (!this.scene.textures.exists('particle_leaf')) {
            const rt = this.scene.add.renderTexture(0, 0, 8, 8);
            const g = this.scene.add.graphics();
            g.fillStyle(0xf59e0b, 0.9);
            g.fillTriangle(0, 4, 8, 0, 8, 8);
            rt.draw(g);
            rt.saveTexture('particle_leaf');
            rt.destroy();
            g.destroy();
        }

        // Create rain emitter
        this.rainParticles = this.scene.add.particles(0, 0, 'particle_rain', {
            x: { min: -100, max: 1060 },
            y: -20,
            speedY: { min: 450, max: 650 },
            speedX: { min: -120, max: -60 },
            lifespan: 1200,
            quantity: 3,
            frequency: 40,
            emitting: false
        });
        this.rainParticles.setScrollFactor(0);
        this.rainParticles.setDepth(25);

        // Create snow emitter
        this.snowParticles = this.scene.add.particles(0, 0, 'particle_snow', {
            x: { min: -50, max: 1010 },
            y: -20,
            speedY: { min: 80, max: 160 },
            speedX: { min: -40, max: 20 },
            lifespan: 3500,
            scale: { min: 0.5, max: 1.2 },
            quantity: 2,
            frequency: 100,
            emitting: false
        });
        this.snowParticles.setScrollFactor(0);
        this.snowParticles.setDepth(25);

        // Create leaves emitter
        this.leafParticles = this.scene.add.particles(0, 0, 'particle_leaf', {
            x: { min: -50, max: 1010 },
            y: -20,
            speedY: { min: 60, max: 120 },
            speedX: { min: -80, max: -20 },
            lifespan: 4000,
            rotate: { min: 0, max: 360 },
            quantity: 1,
            frequency: 300,
            emitting: false
        });
        this.leafParticles.setScrollFactor(0);
        this.leafParticles.setDepth(25);
    }

    public setWeather(weather: WeatherType): void {
        this.currentWeather = weather;
        if (this.rainParticles) this.rainParticles.stop();
        if (this.snowParticles) this.snowParticles.stop();
        if (this.leafParticles) this.leafParticles.stop();

        switch (weather) {
            case 'RAIN':
                if (this.rainParticles) {
                    this.rainParticles.setFrequency(50);
                    this.rainParticles.start();
                }
                break;
            case 'HEAVY_RAIN':
                if (this.rainParticles) {
                    this.rainParticles.setFrequency(15);
                    this.rainParticles.start();
                }
                break;
            case 'SNOW':
                if (this.snowParticles) {
                    this.snowParticles.start();
                }
                break;
            case 'CLOUDY':
                if (this.leafParticles) {
                    this.leafParticles.start();
                }
                break;
            case 'CLEAR':
            case 'FOG':
            default:
                break;
        }
    }

    public update(dt: number): void {
        this.weatherTimer += dt;
        if (this.weatherTimer >= this.weatherDuration) {
            this.weatherTimer = 0;
        }
    }

    public getWeather(): WeatherType {
        return this.currentWeather;
    }

    public destroy(): void {
        if (this.rainParticles) this.rainParticles.destroy();
        if (this.snowParticles) this.snowParticles.destroy();
        if (this.leafParticles) this.leafParticles.destroy();
        if (this.fogGraphics) this.fogGraphics.destroy();
    }
}
