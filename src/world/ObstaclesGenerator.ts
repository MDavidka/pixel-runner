import { CURATED_PATTERNS, CuratedPattern } from '../data/obstacles';
import { JumpValidator } from '../systems/JumpValidator';

export class ObstaclesGenerator {
    private jumpValidator: JumpValidator;
    private recentPatternIds: string[] = [];

    constructor(jumpValidator: JumpValidator) {
        this.jumpValidator = jumpValidator;
    }

    public getNextPattern(difficultyLevel: number, playerSpeed: number, hasDoubleJump: boolean): CuratedPattern {
        // Filter suitable patterns by difficulty
        const candidates = CURATED_PATTERNS.filter(p => 
            p.difficulty <= difficultyLevel &&
            p.minPlayerSpeed <= (playerSpeed + 30) &&
            !this.recentPatternIds.includes(p.id)
        );

        const pool = candidates.length > 0 ? candidates : CURATED_PATTERNS;

        // Shuffle pool
        const shuffled = [...pool].sort(() => Math.random() - 0.5);

        for (const pattern of shuffled) {
            // Validate jump physics
            if (this.jumpValidator.validatePattern(pattern, playerSpeed, hasDoubleJump)) {
                this.recentPatternIds.push(pattern.id);
                if (this.recentPatternIds.length > 3) {
                    this.recentPatternIds.shift();
                }
                return pattern;
            }
        }

        // Fallback guaranteed safe pattern
        return CURATED_PATTERNS[0];
    }
}
