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

    // Graphics
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
    this._addFloat(CANVAS_W / 2 + 120, CANVAS_H / 2 - 40, `-${pDmg}`, '#ff4444');

    // Boss attacks player
    if (this.bossHp > 0) {
      const bDmg = Math.max(1, Math.floor(boss.atk * phaseAtkMult - pStats.def));
      gs.player.hp = Math.max(0, gs.player.hp - bDmg);
      this._addFloat(CANVAS_W / 2 - 120, CANVAS_H / 2 - 40, `-${bDmg}`, '#ff0000');
    }

    if (this.bossHp <= 0) {
      this._onVictory();
    } else if (gs.player.hp <= 0) {
      this._onDefeat();
    }
    updateUI();
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

    // Dark background with color tint based on boss
    g.fillStyle(0x020208, 1);
    g.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Glowing floor
    const bossColor = boss.color || 0xff2200;
    const alpha = 0.06 + pulse * 0.04;
    g.fillStyle(bossColor, alpha);
    g.fillRect(0, CANVAS_H - 120, CANVAS_W, 120);

    // Beam from boss
    const fx = this.fxGfx;
    fx.clear();
    if (this.state === 'battle' && this.phase === 2) {
      fx.lineStyle(2, bossColor, 0.2 + pulse * 0.2);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + this.bgAnimT * 0.5;
        fx.lineBetween(
          CANVAS_W / 2 + 140,
          CANVAS_H / 2 - 30,
          CANVAS_W / 2 + 140 + Math.cos(a) * 80,
          CANVAS_H / 2 - 30 + Math.sin(a) * 80
        );
      }
    }

    // Ground line
    g.fillStyle(0x1a0a0a, 1);
    g.fillRect(0, CANVAS_H - 100, CANVAS_W, 100);
    g.lineStyle(1, bossColor, 0.3);
    g.lineBetween(0, CANVAS_H - 100, CANVAS_W, CANVAS_H - 100);
  }

  _drawChars() {
    const g = this.charGfx;
    g.clear();
    const gs = window.gameState;

    const by = CANVAS_H - 110;

    // Player (left side)
    const pFlash = this.state === 'battle' && Math.sin(this.flashT) > 0.5;
    g.fillStyle(pFlash ? 0x8888ff : 0x5566ff, 1);
    const px = CANVAS_W / 2 - 140;
    g.fillCircle(px, by - 30, 12);
    g.fillRect(px - 11, by - 18, 22, 25);
    g.fillRect(px - 11, by + 7, 8, 18);
    g.fillRect(px + 3, by + 7, 8, 18);
    // Weapon swing
    g.fillStyle(0xcccc66, 1);
    g.fillRect(px + 12, by - 35, 5, 35);
    // HP bar indicator
    const pPct = gs.player.hp / gs.getStats().maxHp;
    g.fillStyle(0x220000, 1);
    g.fillRect(px - 35, by - 55, 70, 8);
    g.fillStyle(pPct > 0.5 ? 0x22cc22 : pPct > 0.25 ? 0xcccc22 : 0xcc2222, 1);
    g.fillRect(px - 35, by - 55, Math.floor(70 * pPct), 8);

    // Boss (right side)
    const boss = this.bossData;
    const bFlash = this.state === 'battle' && Math.sin(this.flashT) < -0.5;
    const bCol = bFlash ? 0xffffff : (boss.color || 0xff2200);
    const bx = CANVAS_W / 2 + 140;
    const bScale = this.phase === 2 ? 1.5 : 1.2;
    const bs = bScale;

    g.fillStyle(bCol, 1);
    g.fillCircle(bx, by - 40 * bs, 18 * bs);
    g.fillRect(bx - 16 * bs, by - 22 * bs, 32 * bs, 30 * bs);
    g.fillRect(bx - 16 * bs, by + 8 * bs, 12 * bs, 20 * bs);
    g.fillRect(bx + 4 * bs, by + 8 * bs, 12 * bs, 20 * bs);

    // Boss crown
    g.fillStyle(0xffd700, 1);
    g.fillTriangle(bx - 15, by - 56 * bs, bx - 10, by - 45 * bs, bx - 5, by - 56 * bs);
    g.fillTriangle(bx - 3, by - 58 * bs, bx + 2, by - 47 * bs, bx + 7, by - 58 * bs);
    g.fillTriangle(bx + 9, by - 55 * bs, bx + 14, by - 44 * bs, bx + 19, by - 55 * bs);

    // Boss HP bar
    const bPct = Math.max(0, this.bossHp / this.bossMaxHp);
    g.fillStyle(0x220000, 1);
    g.fillRect(bx - 60, by - 82 * bs, 120, 10);
    g.fillStyle(bPct > 0.5 ? 0xcc2222 : 0xff0000, 1);
    g.fillRect(bx - 60, by - 82 * bs, Math.floor(120 * bPct), 10);
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
