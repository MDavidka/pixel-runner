export type TimeOfDay = 'MORNING' | 'DAY' | 'SUNSET' | 'NIGHT';

export class DayNightSystem {
    private timeElapsed: number = 0;
    private cycleDuration: number = 100; // 100 seconds full cycle
    private currentTimeOfDay: TimeOfDay = 'DAY';
    private overlayTint: number = 0x000000;
    private overlayAlpha: number = 0;

    public update(dt: number): void {
        this.timeElapsed += dt;
        const normalized = (this.timeElapsed % this.cycleDuration) / this.cycleDuration;

        if (normalized < 0.25) {
            this.currentTimeOfDay = 'MORNING';
            this.overlayTint = 0xfdba74;
            this.overlayAlpha = 0.08 * (1 - normalized / 0.25);
        } else if (normalized < 0.6) {
            this.currentTimeOfDay = 'DAY';
            this.overlayTint = 0xffffff;
            this.overlayAlpha = 0.0;
        } else if (normalized < 0.75) {
            this.currentTimeOfDay = 'SUNSET';
            this.overlayTint = 0xf97316;
            const sub = (normalized - 0.6) / 0.15;
            this.overlayAlpha = 0.18 * sub;
        } else {
            this.currentTimeOfDay = 'NIGHT';
            this.overlayTint = 0x0b132b;
            const sub = (normalized - 0.75) / 0.25;
            this.overlayAlpha = 0.38 * Math.sin(sub * Math.PI);
        }
    }

    public getTimeOfDay(): TimeOfDay {
        return this.currentTimeOfDay;
    }

    public getOverlayAlpha(): number {
        return this.overlayAlpha;
    }

    public getOverlayTint(): number {
        return this.overlayTint;
    }

    public isNight(): boolean {
        return this.currentTimeOfDay === 'NIGHT';
    }
}
