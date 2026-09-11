import { createGame } from './game/Game';

window.addEventListener('DOMContentLoaded', () => {
    // Start the Phaser Game
    const game = createGame();
    (window as any).__PHASER_GAME__ = game;
});
