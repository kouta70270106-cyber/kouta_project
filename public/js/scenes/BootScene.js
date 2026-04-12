'use strict';

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // No external assets – all graphics drawn via Phaser.GameObjects.Graphics
  }

  create() {
    // Try to load save
    const gs = window.gameState;
    const hasSave = gs.load();

    if (hasSave) {
      // Skip name modal, go straight to journey
      document.getElementById('name-modal').style.display = 'none';
      this._startGame();
    } else {
      // Show name modal
      const modal = document.getElementById('name-modal');
      modal.style.display = 'flex';

      const btn = document.getElementById('start-game-btn');
      btn.onclick = () => {
        const input = document.getElementById('hero-name-input');
        const name = input.value.trim() || '勇者';
        gs.player.name = name;
        // Give starter gear
        gs.addItem(D.EQUIPMENT.wooden_sword);
        gs.addItem(D.EQUIPMENT.cloth_robe);
        gs.player.hp = gs.player.maxHp;
        modal.style.display = 'none';
        this._startGame();
      };
    }
  }

  _startGame() {
    // Show guild modal if no guild set
    const gs = window.gameState;
    if (!gs.guild) {
      showGuildModal(() => {
        this.scene.start('JourneyScene');
      });
    } else {
      this.scene.start('JourneyScene');
    }
  }
}
