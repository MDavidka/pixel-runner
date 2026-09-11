import { BIOMES, BiomeConfig } from '../data/biomes';
import { TimeOfDay } from '../systems/DayNightSystem';

export class BiomeManager {
    private currentBiomeIndex: number = 0;
    private biomeLength: number = 2800; // 2800px per biome

    public updateBiome(playerX: number): BiomeConfig {
        const index = Math.floor(Math.max(0, playerX) / this.biomeLength) % BIOMES.length;
        this.currentBiomeIndex = index;
        return BIOMES[index];
    }

    public getCurrentBiome(): BiomeConfig {
        return BIOMES[this.currentBiomeIndex];
    }

    public getSkyColors(timeOfDay: TimeOfDay): [string, string, string] {
        const biome = this.getCurrentBiome();
        switch (timeOfDay) {
            case 'MORNING': return biome.skyColors.morning;
            case 'SUNSET': return biome.skyColors.sunset;
            case 'NIGHT': return biome.skyColors.night;
            case 'DAY':
            default: return biome.skyColors.day;
        }
    }
}
