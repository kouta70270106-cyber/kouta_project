'use strict';

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {}

  create() {
    try { createGameSprites(this); } catch(e) { console.error('Sprite init error:', e); }

    const gs = window.gameState;
    const params = new URLSearchParams(window.location.search);
    const urlId   = params.get('id');
    const urlName = params.get('name');
    const urlBio  = params.get('bio');

    // URL に token が含まれていれば保存（装備ページ or 外部リンクから）
    if (urlId && /^[a-f0-9]{16}$/.test(urlId)) {
      localStorage.setItem('idle_rpg_token', urlId);
    }

    const token = urlId || localStorage.getItem('idle_rpg_token');

    const proceed = () => {
      const hasSave = gs.load();

      if (hasSave) {
        document.getElementById('name-modal').style.display = 'none';
        this._startGame();
      } else if (urlName) {
        document.getElementById('name-modal').style.display = 'none';
        gs.player.name = urlName;
        if (urlBio) gs.player.bio = urlBio;
        gs.addItem(D.EQUIPMENT.wooden_sword);
        gs.addItem(D.EQUIPMENT.cloth_robe);
        gs.player.hp = gs.player.maxHp;
        this._startGame();
      } else {
        const modal = document.getElementById('name-modal');
        modal.style.display = 'flex';
        const input = document.getElementById('hero-name-input');
        const btn   = document.getElementById('start-game-btn');
        btn.onclick = () => {
          const name = input.value.trim() || '勇者';
          gs.player.name = name;
          gs.addItem(D.EQUIPMENT.wooden_sword);
          gs.addItem(D.EQUIPMENT.cloth_robe);
          gs.player.hp = gs.player.maxHp;
          modal.style.display = 'none';
          this._startGame();
        };
      }
    };

    if (token) {
      // サーバーからロードを試み、localStorage に書き込んでから proceed
      gs.loadFromServer(token).then(proceed).catch(proceed);
    } else {
      proceed();
    }
  }

  _startGame() {
    const gs = window.gameState;
    if (!gs.guild) {
      showGuildModal(() => { this.scene.start('JourneyScene'); });
    } else {
      this.scene.start('JourneyScene');
    }
  }
}
