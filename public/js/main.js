'use strict';

window.gameSpeed = 1;

function toggleSpeed() {
  window.gameSpeed = window.gameSpeed === 1 ? 2 : 1;
  const btn = document.getElementById('speed-btn');
  btn.textContent = window.gameSpeed === 2 ? '⚡ ×2' : '▶ ×1';
  btn.classList.toggle('active', window.gameSpeed === 2);

  const game = window.game;
  if (!game) return;
  ['JourneyScene', 'DungeonScene', 'BossScene'].forEach(key => {
    const s = game.scene.getScene(key);
    if (!s || !s.scene.isActive()) return;
    if (s.tickTimer) {
      s.tickTimer.remove(false);
      s.tickTimer = s.time.addEvent({
        delay: 1000 / window.gameSpeed,
        callback: s._onTick,
        callbackScope: s,
        loop: true,
      });
    }
  });
}

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
