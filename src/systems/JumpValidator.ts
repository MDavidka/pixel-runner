import { CuratedPattern, ObstacleElement, PlatformElement, GroundSegment } from '../data/obstacles';

export class JumpValidator {
    private gravity: number;
    private jumpVelocity: number;

    constructor(gravity: number = 1200, jumpVelocity: number = -520) {
        this.gravity = gravity;
        this.jumpVelocity = Math.abs(jumpVelocity);
    }

    /**
     * Calculate maximum theoretical jump height (pixels)
     */
    public getMaxJumpHeight(): number {
        return (this.jumpVelocity * this.jumpVelocity) / (2 * this.gravity);
    }

    /**
     * Calculate air time for a standard jump (seconds)
     */
    public getJumpAirTime(): number {
        return (2 * this.jumpVelocity) / this.gravity;
    }

    /**
     * Calculate max horizontal jump span at a given speed (pixels)
     */
    public getMaxJumpDistance(playerSpeed: number): number {
        return playerSpeed * this.getJumpAirTime();
    }

    /**
     * Validate an entire curated pattern to ensure it is physically beatable by the player
     */
    public validatePattern(pattern: CuratedPattern, currentSpeed: number, hasDoubleJump: boolean = false): boolean {
        const maxSingleJumpHeight = this.getMaxJumpHeight();
        const maxAllowedHeight = hasDoubleJump ? maxSingleJumpHeight * 1.75 : maxSingleJumpHeight * 0.92; // 8% safety margin
        const maxJumpDist = this.getMaxJumpDistance(currentSpeed) * 0.88; // 12% reaction buffer

        // 1. Validate Obstacle Heights
        for (const obs of pattern.obstacles) {
            if (obs.hitboxHeight > maxAllowedHeight && obs.type !== 'river_spikes') {
                return false; // Obstacle too tall to jump over
            }
        }

        // 2. Validate Gaps in Ground
        for (const seg of pattern.groundSegments) {
            if (seg.isGap && seg.width > maxJumpDist) {
                // If gap is wider than jump distance, check if a stepping platform exists
                const hasBridgingPlatform = pattern.platforms.some(p => 
                    p.offsetX >= seg.offsetX && (p.offsetX + p.width) <= (seg.offsetX + seg.width)
                );
                if (!hasBridgingPlatform) {
                    return false; // Uncrossable gap without platform
                }
            }
        }

        // 3. Validate Elevated Platforms
        for (const plat of pattern.platforms) {
            const elevation = Math.abs(plat.offsetY);
            if (elevation > maxAllowedHeight) {
                return false; // Platform too high to reach
            }
        }

        // 4. Validate Spacing between consecutive obstacles
        const sortedObstacles = [...pattern.obstacles].sort((a, b) => a.offsetX - b.offsetX);
        for (let i = 0; i < sortedObstacles.length - 1; i++) {
            const cur = sortedObstacles[i];
            const next = sortedObstacles[i + 1];
            const distanceBetween = next.offsetX - (cur.offsetX + cur.width);

            // Need at least 90px between consecutive high hurdles to land & jump again
            if (cur.hitboxHeight > 30 && next.hitboxHeight > 30 && distanceBetween < 90) {
                return false; // Impossible consecutive obstacle trap
            }
        }

        return true;
    }
}
