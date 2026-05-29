'use strict';

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this.load.image('hero',        'images/characters/hero.png');
    this.load.image('ern',         'images/characters/ern.png');
    this.load.image('saria',       'images/characters/saria.png');
    this.load.image('hero_atk1',   'images/characters/hero_atk1.png');
    this.load.image('hero_atk2',   'images/characters/hero_atk2.png');
    this.load.image('hero_atk3',   'images/characters/hero_atk3.png');
    this.load.image('ern_atk1',    'images/characters/ern_atk1.png');
    this.load.image('ern_atk2',    'images/characters/ern_atk2.png');
    this.load.image('ern_atk3',    'images/characters/ern_atk3.png');
    this.load.image('saria_atk1',  'images/characters/saria_atk1.png');
    this.load.image('saria_atk2',  'images/characters/saria_atk2.png');
    this.load.image('saria_atk3',  'images/characters/saria_atk3.png');
    this.load.image('slime',       'images/characters/slime.png');
    this.load.image('goblin',      'images/characters/goblin.png');
    this.load.image('bat',         'images/characters/bat.png');
    this.load.image('wolf',        'images/characters/wolf.png');
    this.load.image('skeleton',    'images/characters/skeleton.png');
    this.load.image('treant',      'images/characters/treant.png');
    this.load.image('spider',      'images/characters/spider.png');
    this.load.image('sand_worm',   'images/characters/sand_worm.png');
    this.load.image('ice_wolf',    'images/characters/ice_wolf.png');
    this.load.image('lava_lizard', 'images/characters/lava_lizard.png');
    this.load.image('orc',          'images/characters/orc.png');
    this.load.image('harpy',        'images/characters/harpy.png');
    this.load.image('lizardman',    'images/characters/lizardman.png');
    this.load.image('skeleton_mage','images/characters/skeleton_mage.png');
    this.load.image('troll',        'images/characters/troll.png');
    this.load.image('cave_guard',   'images/characters/cave_guard.png');
    this.load.image('dark_elf',     'images/characters/dark_elf.png');
    this.load.image('frost_knight', 'images/characters/frost_knight.png');
    this.load.image('fire_imp',     'images/characters/fire_imp.png');
    this.load.image('minotaur',     'images/characters/minotaur.png');
    this.load.image('wyvern',       'images/characters/wyvern.png');
    this.load.image('vampire',      'images/characters/vampire.png');
    this.load.image('golem',        'images/characters/golem.png');
    this.load.image('frost_dragon', 'images/characters/frost_dragon.png');
    this.load.image('demon_knight', 'images/characters/demon_knight.png');
    this.load.image('gold_slime',   'images/characters/gold_slime.png');
    this.load.image('silver_slime', 'images/characters/silver_slime.png');
    this.load.image('dragon',       'images/characters/dragon.png');
    this.load.image('lich',         'images/characters/lich.png');
    this.load.image('chimera',      'images/characters/chimera.png');

    this.load.image('bg_grassland', 'images/bg/grassland.jpg');
    this.load.image('bg_forest',    'images/bg/forest.jpg');
    this.load.image('bg_storm',     'images/bg/storm.jpg');
    this.load.image('bg_night',     'images/bg/night.jpg');
    this.load.image('bg_fullmoon',  'images/bg/fullmoon.jpg');

    // --- BGM ---
    this.load.audio('bgm_journey', 'audio/bgm_journey.mp3');
    this.load.audio('bgm_boss',    'audio/bgm_boss.mp3');
    this.load.audio('se_sword',    'audio/se_sword.mp3');
    this.load.audio('se_magic',    'audio/se_magic.mp3');
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

    // ---- SEマネージャー（ボタンクリック音）----
    // Phaser の AudioContext を借りて使う（新規作成による競合を回避）
    window.playSE = function () {
      try {
        const ctx = window.game?.sound?.context;
        if (!ctx || ctx.state === 'closed') return;
        if (ctx.state === 'suspended') ctx.resume();
        const t    = ctx.currentTime;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square'; // レトロゲーム風の矩形波
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.06);
        gain.gain.setValueAtTime(0.3, t);          // 音量 30%（以前の2.5倍）
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
      } catch (e) { /* 非対応ブラウザは無視 */ }
    };

    // ---- 攻撃SE（実音ファイル使用）----
    window._seScene = this;
    window.playAttackSE = function(type) {
      try {
        const scene = window._seScene;
        if (!scene) return;
        const key = type === 'sword' ? 'se_sword' : type === 'magic' ? 'se_magic' : null;
        if (key && scene.cache.audio.has(key)) {
          scene.sound.play(key, { volume: 0.8 });
        }
      } catch (e) { /* 非対応ブラウザは無視 */ }
    };

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
