'use strict';

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this.load.image('bg_grassland', 'images/bg/grassland.jpg');
    this.load.image('bg_forest',    'images/bg/forest.jpg');
    this.load.image('bg_storm',     'images/bg/storm.jpg');
    this.load.image('bg_night',     'images/bg/night.jpg');
    this.load.image('bg_fullmoon',  'images/bg/fullmoon.jpg');

    // --- BGM ---
    this.load.audio('bgm_title',   'audio/bgm_title.mp3');
    this.load.audio('bgm_journey', 'audio/bgm_journey.mp3');
    this.load.audio('bgm_boss',    'audio/bgm_boss.mp3');
    // bgm_dungeon は後で追加: this.load.audio('bgm_dungeon', 'audio/bgm_dungeon.mp3');
  }

  create() {
    // ---- BGMマネージャー（全シーン共通） ----
    // 例え話: レコードプレーヤー。どの部屋（シーン）からでも同じプレーヤーを操作できる
    window.bgmManager = {
      _sounds:  {},   // 登録済みの音源
      _current: null, // 現在再生中のキー名

      // 音源を登録（BootScene の create 時に一度だけ呼ぶ）
      _init(scene) {
        const keys = ['bgm_title', 'bgm_journey', 'bgm_boss', 'bgm_dungeon'];
        keys.forEach(key => {
          if (scene.cache.audio.has(key)) {
            this._sounds[key] = scene.sound.add(key, { loop: true, volume: 0.5 });
          }
        });
      },

      // BGMを再生（すでに同じ曲が流れていれば何もしない）
      play(key) {
        if (this._current === key) return;
        if (this._current && this._sounds[this._current]) {
          this._sounds[this._current].stop();
        }
        if (this._sounds[key]) {
          this._sounds[key].play();
          this._current = key;
        }
      },

      // BGMを停止
      stop() {
        if (this._current && this._sounds[this._current]) {
          this._sounds[this._current].stop();
          this._current = null;
        }
      },
    };
    window.bgmManager._init(this);

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
    window.bgmManager.play('bgm_title'); // タイトルBGM再生
    const gs = window.gameState;
    if (!gs.guild) {
      showGuildModal(() => { this.scene.start('JourneyScene'); });
    } else {
      this.scene.start('JourneyScene');
    }
  }
}
