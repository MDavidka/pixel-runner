import * as Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { RunScene } from '../scenes/RunScene';
import { BaseScene } from '../scenes/BaseScene';
import { GameOverScene } from '../scenes/GameOverScene';

export function createGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: 960,
        height: 540,
        pixelArt: true,
        roundPixels: true,
        backgroundColor: '#020108',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0, x: 0 },
                debug: false
            }
        },
        scene: [
            BootScene,
            PreloadScene,
            MainMenuScene,
            RunScene,
            BaseScene,
            GameOverScene
        ]
    };

    return new Phaser.Game(config);
}
