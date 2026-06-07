'use strict';

class BossScene extends Phaser.Scene {
  constructor() { super({ key: 'BossScene' }); }

  init(data) {
    this.bossData = data.boss;
  }

  create() {
    const gs = window.gameState;
    const boss = this.bossData;

    this.bossHp = boss.hp;
    this.bossMaxHp = boss.hp;
    this.phase = 1; // 1 or 2 (phase 2 at 50% HP)
    this.state = 'battle'; // battle | victory | defeat
    this.battleDmgTimer = 2.0;
    this.flashT = 0;
    this.floatTexts = [];
    this.bgAnimT = 0;
    window.heroTP = 0; // ボス戦開始時にTPリセット

    // 背景画像（ボスごとに専用背景）
    const bgKey = 'boss_bg_' + boss.id;
    const bgTexKey = this.textures.exists(bgKey) ? bgKey : 'boss_bg';
    this.add.image(CANVAS_W / 2, CANVAS_H / 2, bgTexKey).setDisplaySize(CANVAS_W, CANVAS_H);

    // ヒーロー画像
    this.heroImg = this.add.image(CANVAS_W / 2 - 140, CANVAS_H - 110, 'hero')
      .setOrigin(0.5, 1)
      .setScale(0.18)
      .setDepth(10);

    // ボス画像
    this._bossBaseScale = 0.30;
    this.bossImg = this.add.image(CANVAS_W / 2 + 140, CANVAS_H - 110, 'boss_' + boss.id)
      .setOrigin(0.5, 1)
      .setScale(this._bossBaseScale)
      .setDepth(5);
    this.bossImg.postFX.addGlow(0x000000, 4, 0, false, 0.1, 20);

    // Graphics（ボス画像より上のレイヤー）
    this.bgGfx   = this.add.graphics();
    this.charGfx = this.add.graphics();
    this.hpGfx   = this.add.graphics();
    this.fxGfx   = this.add.graphics();

    // Boss name
    this.bossNameText = this.add.text(CANVAS_W / 2, 30, boss.name, {
      fontSize: '20px', fontStyle: 'bold', color: '#ff4444',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Month text
    this.add.text(CANVAS_W / 2, 56, `月末決戦！ 月${gs.gameTime.month}`, {
      fontSize: '13px', color: '#ffaa44', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Status text
    this.statusText = this.add.text(CANVAS_W / 2, CANVAS_H - 24, '', {
      fontSize: '13px', color: '#aaaaff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    gs.addLog(`⚡ 月末決戦！ ${boss.name} との戦い！`, 'legendary');
    updateUI();

    // ボスBGM再生
    window.bgmManager.play('bgm_boss');
  }

  update(time, delta) {
    const dt = (delta / 1000) * window.gameSpeed;
    this.bgAnimT += dt;
    this.flashT += dt * 3;

    this._drawBg();
    this._drawChars();
    this._drawHpBars();
    this._updateFloats(dt);

    if (this.state === 'battle') {
      this.battleDmgTimer -= dt;
      if (this.battleDmgTimer <= 0) {
        this._doBattleTick();
        this.battleDmgTimer = 0.8 + (this.phase === 2 ? 0 : 0.2); // phase 2 is faster
      }
    }
  }

  _doBattleTick() {
    const gs = window.gameState;
    const pStats = gs.getStats();
    const boss = this.bossData;

    // 必殺技チェック（TP満タン時に発動）
    if ((window.heroTP || 0) >= 100) {
      this._doBossSpecialAttack();
      return;
    }

    // Phase check
    if (this.bossHp <= this.bossMaxHp / 2 && this.phase === 1) {
      this.phase = 2;
      gs.addLog(`⚡ ${boss.name}が激怒した！第2形態へ移行！`, 'legendary');
      this.bossNameText.setColor('#ff0000');
    }

    const phaseAtkMult = this.phase === 2 ? 1.4 : 1.0;
    const phaseDefMult = this.phase === 2 ? 0.85 : 1.0;

    // Player attacks boss
    const pDmg = Math.max(1, Math.floor(pStats.atk - boss.def * phaseDefMult));
    this.bossHp -= pDmg;
    this._playHeroAttack(pDmg);

    // Boss attacks player
    if (this.bossHp > 0) {
      const bDmg = Math.max(1, Math.floor(boss.atk * phaseAtkMult - pStats.def));
      gs.player.hp = Math.max(0, gs.player.hp - bDmg);
      this._playBossAttack(bDmg);
    }

    // TP蓄積
    window.heroTP = Math.min(100, (window.heroTP || 0) + 34);

    if (this.bossHp <= 0) {
      this._onVictory();
    } else if (gs.player.hp <= 0) {
      this._onDefeat();
    }
    updateUI();
  }

  _doBossSpecialAttack() {
    const gs = window.gameState;
    const pStats = gs.getStats();

    window.heroTP = 0;
    this.state = 'special'; // 演出中はバトルタイマーを止める

    const sp = { name: '⚡ 天空斬！', color: '#ffd700', mult: 5.0 };
    const dmg = Math.max(1, Math.floor(pStats.atk * sp.mult));

    // カットイン表示してから攻撃演出
    this._showBossCutIn('hero');

    this.time.delayedCall(1100, () => {
      this.bossHp = Math.max(0, this.bossHp - dmg);

      // 白フラッシュ
      const flash = this.add.graphics().setDepth(22);
      flash.fillStyle(0xffffff, 0.8);
      flash.fillRect(0, 0, CANVAS_W, CANVAS_H);
      this.tweens.add({
        targets: flash, alpha: 0, duration: 350, ease: 'Quad.In',
        onComplete: () => flash.destroy()
      });

      // 技名テキスト
      const txt = this.add.text(CANVAS_W / 2, CANVAS_H / 2 - 20, sp.name, {
        fontSize: '34px', fontStyle: 'bold', color: sp.color,
        stroke: '#000000', strokeThickness: 5
      }).setOrigin(0.5).setDepth(23).setAlpha(0).setScale(0.6);
      this.tweens.add({
        targets: txt, alpha: 1, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out',
        onComplete: () => {
          this.tweens.add({
            targets: txt, alpha: 0, y: txt.y - 50,
            duration: 550, delay: 500, ease: 'Quad.In',
            onComplete: () => txt.destroy()
          });
        }
      });

      this._addFloat(CANVAS_W / 2 + 120, CANVAS_H / 2 - 40, `-${dmg}`, sp.color);
      this.cameras.main.shake(300, 0.007);
      gs.addLog(`${sp.name} ${dmg}ダメージ！！`, 'legendary');

      if (this.bossHp <= 0) {
        this._onVictory();
      } else {
        // 演出終了後にバトル再開（タイマーもリセット）
        this.time.delayedCall(800, () => {
          this.state = 'battle';
          this.battleDmgTimer = 1.0;
        });
      }
      updateUI();
    });
  }

  _showBossCutIn(charKey) {
    if (!window.Cutin) return;
    const ID_MAP = { hero: 'yusha', ern: 'eln', saria: 'saria' };
    const canvas = document.querySelector('canvas');
    Cutin.play(ID_MAP[charKey] || charKey, { speed: 4.5, sceneEl: canvas, charge: true });
  }

  _onVictory() {
    const gs = window.gameState;
    this.state = 'victory';
    const boss = this.bossData;

    const expGained = gs.gainExp(boss.exp);
    const g = boss.gold[0] + Math.floor(Math.random() * (boss.gold[1] - boss.gold[0] + 1));
    gs.gainGold(g);
    gs.stats.bossesDefeated++;

    gs.addLog(`🏆 ${boss.name}を倒した！ EXP+${expGained} 💰+${g}`, 'legendary');

    // Guaranteed boss drop
    const dropId = boss.drop[Math.floor(Math.random() * boss.drop.length)];
    const item = D.EQUIPMENT[dropId];
    if (item && gs.addItem(item)) {
      gs.addLog(`👑 ボス報酬「${item.name}」を入手！`, 'legendary');
      showItemModal(item);
    }

    // Notify multiplayer partner
    window.multiManager.sendSharedEvent('boss_defeated', { bossName: boss.name });

    this.statusText.setText('✨ 魔王を討伐！ クリック/タップで続ける').setColor('#ffd700');
    this.input.once('pointerdown', () => this._returnToJourney());

    // Auto-return after 5s
    this.time.delayedCall(5000, () => {
      if (this.state === 'victory') this._returnToJourney();
    });
  }

  _onDefeat() {
    window.heroTP  = 0;
    window.ernTP   = 0;
    window.sariaTP = 0;
    const gs = window.gameState;
    this.state = 'defeat';
    gs.player.hp = Math.floor(gs.getStats().maxHp * 0.2);
    gs.addLog(`💀 ${this.bossData.name}に敗れた！ 命からがら逃げ延びた...`, 'danger');
    this.statusText.setText('敗北... クリック/タップで続ける').setColor('#ff4444');
    this.input.once('pointerdown', () => this._returnToJourney());

    this.time.delayedCall(3000, () => {
      if (this.state === 'defeat') this._returnToJourney();
    });
  }

  _returnToJourney() {
    // ボスBGMを止めて旅BGMに戻す
    window.bgmManager.play('bgm_journey');

    // Show guild selection for new month
    showGuildModal(() => {
      this.scene.stop('BossScene');
      this.scene.resume('JourneyScene');
      const journey = this.scene.get('JourneyScene');
      if (journey) journey.resumeFromScene();
      updateUI();
    }, true);
  }

  // =========================================================
  //  DRAWING
  // =========================================================
  _drawBg() {
    const g = this.bgGfx;
    g.clear();

    const pulse = 0.5 + 0.5 * Math.sin(this.bgAnimT * 1.5);
    const boss = this.bossData;
    const bossColor = boss.color || 0xff2200;

    // 第2形態：ボス周囲に放射線エフェクト
    const fx = this.fxGfx;
    fx.clear();
    if (this.state === 'battle' && this.phase === 2) {
      fx.lineStyle(2, bossColor, 0.25 + pulse * 0.25);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + this.bgAnimT * 0.5;
        fx.lineBetween(
          CANVAS_W / 2 + 140,
          CANVAS_H / 2 - 30,
          CANVAS_W / 2 + 140 + Math.cos(a) * 100,
          CANVAS_H / 2 - 30 + Math.sin(a) * 100
        );
      }
      // 第2形態：画面全体に薄い赤のオーバーレイ
      g.fillStyle(bossColor, 0.04 + pulse * 0.03);
      g.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  _drawChars() {
    const g = this.charGfx;
    g.clear();
    const gs = window.gameState;

    const by = CANVAS_H - 110;

    // ヒーロー画像 — フラッシュ
    const px = CANVAS_W / 2 - 140;
    const pFlash = this.state === 'battle' && Math.sin(this.flashT) > 0.5;
    if (pFlash) { this.heroImg.setTint(0xffffff); } else { this.heroImg.clearTint(); }

    // プレイヤーHPバー（画像の上に配置）
    const pPct = gs.player.hp / gs.getStats().maxHp;
    const pBarY = by - this.heroImg.displayHeight - 10;
    g.fillStyle(0x220000, 1);
    g.fillRect(px - 35, pBarY, 70, 8);
    g.fillStyle(pPct > 0.5 ? 0x22cc22 : pPct > 0.25 ? 0xcccc22 : 0xcc2222, 1);
    g.fillRect(px - 35, pBarY, Math.floor(70 * pPct), 8);

    // ボス画像 — フラッシュとフェーズ2拡大
    const bFlash = this.state === 'battle' && Math.sin(this.flashT) < -0.5;
    const bScale = this._bossBaseScale * (this.phase === 2 ? 1.3 : 1.0);
    this.bossImg.setScale(bScale);
    if (bFlash) { this.bossImg.setTint(0xffffff); } else { this.bossImg.clearTint(); }

    // ボスHPバー（画像の上に配置）
    const bx = CANVAS_W / 2 + 140;
    const bPct = Math.max(0, this.bossHp / this.bossMaxHp);
    const barY = by - this.bossImg.displayHeight - 10;
    g.fillStyle(0x220000, 1);
    g.fillRect(bx - 60, barY, 120, 10);
    g.fillStyle(bPct > 0.5 ? 0xcc2222 : 0xff0000, 1);
    g.fillRect(bx - 60, barY, Math.floor(120 * bPct), 10);
  }

  _playHeroAttack(dmg) {
    const px = CANVAS_W / 2 - 140;
    const bx = CANVAS_W / 2 + 140;
    const by = CANVAS_H - 110;

    // 前進
    this.heroImg.setTexture('hero_atk1');
    this.tweens.add({ targets: this.heroImg, x: px + 55, duration: 160, ease: 'Quad.Out' });

    // 斬撃 + ダメージ表示
    this.time.delayedCall(160, () => {
      if (this.state !== 'battle' && this.state !== 'victory') return;
      this.heroImg.setTexture('hero_atk2');
      this._showSlashFx(bx - 30, by - 90);
      window.playAttackSE?.('sword');
      this._addFloat(bx + 20, by - 120, `-${dmg}`, '#ff4444');
    });

    // フォロースルー
    this.time.delayedCall(320, () => {
      if (!this.heroImg?.active) return;
      this.heroImg.setTexture('hero_atk3');
      this.tweens.add({ targets: this.heroImg, x: px, duration: 160, ease: 'Quad.In' });
    });

    // 通常に戻す
    this.time.delayedCall(520, () => {
      if (!this.heroImg?.active) return;
      this.heroImg.setTexture('hero');
      this.heroImg.x = px;
    });
  }

  _playBossAttack(dmg) {
    const bx = CANVAS_W / 2 + 140;
    const px = CANVAS_W / 2 - 140;
    const by = CANVAS_H - 110;

    // ボスが左へ突進
    this.tweens.add({ targets: this.bossImg, x: bx - 70, duration: 160, ease: 'Quad.Out' });

    // ヒット
    this.time.delayedCall(160, () => {
      if (!this.bossImg?.active) return;
      this._addFloat(px - 20, by - 120, `-${dmg}`, '#ff2222');
      this.cameras.main.shake(120, 0.004);
    });

    // ボスが戻る
    this.time.delayedCall(320, () => {
      if (!this.bossImg?.active) return;
      this.tweens.add({ targets: this.bossImg, x: bx, duration: 160, ease: 'Quad.In' });
    });
  }

  _showSlashFx(x, y) {
    const g = this.add.graphics().setDepth(15);
    const col = 0xffffff;
    g.lineStyle(3, col, 0.9);
    g.lineBetween(x - 30, y - 30, x + 30, y + 30);
    g.lineBetween(x + 30, y - 30, x - 30, y + 30);
    g.lineStyle(2, 0xffdd88, 0.7);
    g.lineBetween(x - 20, y - 35, x + 35, y + 20);
    this.tweens.add({
      targets: g, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 280, ease: 'Quad.In',
      onComplete: () => g.destroy()
    });
  }

  _drawHpBars() {
    // HP text
    const gs = window.gameState;
    const stats = gs.getStats();
    // Drawn in _drawChars using graphics for simplicity
  }

  _addFloat(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontSize: '16px', fontStyle: 'bold', color,
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this.floatTexts.push({ obj: t, vy: -70, life: 1.4 });
  }

  _updateFloats(dt) {
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.life -= dt;
      ft.obj.y += ft.vy * dt;
      ft.obj.alpha = Math.max(0, ft.life);
      if (ft.life <= 0) { ft.obj.destroy(); this.floatTexts.splice(i, 1); }
    }
  }
}
