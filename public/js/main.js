'use strict';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  // Connect multiplayer socket
  window.multiManager.connect();

  // Figure out canvas size to fit the left column
  const gameContainer = document.getElementById('game-container');
  const cw = gameContainer.clientWidth || 750;
  const ch = gameContainer.clientHeight || 480;

  const config = {
    type: Phaser.AUTO,
    width: 750,
    height: 480,
    backgroundColor: '#08080f',
    parent: 'game-container',
    scene: [BootScene, JourneyScene, DungeonScene, BossScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 750,
      height: 480,
    },
    render: {
      antialias: false,
      pixelArt: false,
    }
  };

  window.game = new Phaser.Game(config);
});
