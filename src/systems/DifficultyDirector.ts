export class DifficultyDirector {
    private gameTime: number = 0;
    private distanceTraveled: number = 0;
    private enciDistanceMeters: number = 35; // Start at 35m
    private enciSpeedBonus: number = 0;
    private speedIntervalTimer: number = 0;

    public reset(): void {
        this.gameTime = 0;
        this.distanceTraveled = 0;
        this.enciDistanceMeters = 35;
        this.enciSpeedBonus = 0;
        this.speedIntervalTimer = 0;
    }

    public update(dt: number, playerSpeed: number, enciActualSpeed: number): void {
        this.gameTime += dt;
        this.distanceTraveled += (playerSpeed * dt) / 10;
        this.speedIntervalTimer += dt;

        // Accelerate Enci every 5 seconds
        if (this.speedIntervalTimer >= 5.0) {
            this.speedIntervalTimer -= 5.0;
            this.enciSpeedBonus += 12; // +12 px/s every 5s
        }
    }

    public getEnciSpeed(): number {
        return 220 + this.enciSpeedBonus;
    }

    public setEnciDistance(distMeters: number): void {
        this.enciDistanceMeters = distMeters;
    }

    public getEnciDistance(): number {
        return this.enciDistanceMeters;
    }

    public getDistanceTraveled(): number {
        return Math.floor(this.distanceTraveled);
    }

    public getDifficultyLevel(): number {
        if (this.distanceTraveled < 300) return 1;
        if (this.distanceTraveled < 800) return 2;
        if (this.distanceTraveled < 1500) return 3;
        if (this.distanceTraveled < 2500) return 4;
        return 5;
    }

    public isEnciNear(): boolean {
        return this.enciDistanceMeters < 30;
    }

    public isEnciCritical(): boolean {
        return this.enciDistanceMeters < 3;
    }
}
