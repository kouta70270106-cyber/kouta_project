'use strict';

const CANVAS_W = 750;
const CANVAS_H = 480;
const GROUND_Y = 360;
const PLAYER_X = 180;

const SHAPE_SPRITE = {
  blob:'slime', small:'goblin', human:'skeleton',
  large:'orc', quad:'dragon', fly:'bat', multi:'spider',
};

class JourneyScene extends Phaser.Scene {
  constructor() { super({ key: 'JourneyScene' }); }

  create() {
    this.state = 'walking';

    // ---- Background layers ----
    this.bgSky    = this.add.graphics();
    this.bgClouds = this.add.graphics();
    this.bgFar    = this.add.graphics();
    this.bgMid    = this.add.graphics();
    this.bgGround = this.add.graphics();

    // ---- Character sprites ----
    this.comp1Img   = this.add.image(PLAYER_X - 84,  GROUND_Y, 'saria').setOrigin(0.5, 1);
    this.comp0Img   = this.add.image(PLAYER_X - 42,  GROUND_Y, 'ern').setOrigin(0.5, 1);
    this.partnerImg = this.add.image(PLAYER_X - 130, GROUND_Y, 'hero').setOrigin(0.5, 1).setVisible(false);
    this.playerImg  = this.add.image(PLAYER_X,       GROUND_Y, 'hero').setOrigin(0.5, 1);
    this.npcImg     = this.add.image(350,             GROUND_Y, 'npc').setOrigin(0.5, 1).setVisible(false);
    this.monsterImg = this.add.image(CANVAS_W + 80,  GROUND_Y, 'slime').setOrigin(0.5, 1).setVisible(false);
    this.dungeonGfx = this.add.graphics().setVisible(false);

    // ---- HP bars ----
    this.compBarGfx = this.add.graphics();
    this.hpBarsGfx  = this.add.graphics().setVisible(false);

    // ---- Name labels ----
    const nameSty = { fontSize: '11px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };
    const gs0 = window.gameState;
    this.playerNameTxt  = this.add.text(PLAYER_X,      GROUND_Y - 82, gs0.player.name, nameSty).setOrigin(0.5, 1);
    this.comp0NameTxt   = this.add.text(PLAYER_X - 42, GROUND_Y - 78, D.COMPANIONS[0].name, nameSty).setOrigin(0.5, 1);
    this.comp1NameTxt   = this.add.text(PLAYER_X - 84, GROUND_Y - 78, D.COMPANIONS[1].name, nameSty).setOrigin(0.5, 1);
    this.monsterNameTxt = this.add.text(0, 0, '', nameSty).setOrigin(0.5, 1).setVisible(false);

    // ---- Floating texts ----
    this.floatTexts = [];

    // ---- NPC dialog ----
    this.dialogBox = this.add.container(CANVAS_W / 2, CANVAS_H - 90).setVisible(false);
    this._buildDialog();

    // ---- State vars ----
    this.scrollX = 0;
    this.playerBobT = 0;
    this.monsterX = CANVAS_W + 80;
    this.currentMonster = null;   // scaled monster data
    this.monsterHp = 0;
    this.battleFlashT = 0;
    this.battleDmgTimer = 0;
    this.npcData = null;
    this.dungeonX = CANVAS_W + 100;
    this.dungeonVisible = false;
    this.currentArea = null;

    // ---- Timers (ticks every 1s) ----
    this.tickTimer = this.time.addEvent({ delay: 1000, callback: this._onTick, callbackScope: this, loop: true });
    this.monsterCooldown = 10;
    this.npcCooldown = 90;
    this.encounterCount = 0;
    this.dungeonThreshold = Phaser.Math.Between(6, 12);
    this.syncCooldown = 5;

    this._drawScene();
    updateUI();
  }

  // =========================================================
  //  UPDATE LOOP
  // =========================================================
  update(time, delta) {
    const dt = (delta / 1000) * window.gameSpeed;

    if (this.state === 'walking' || this.state === 'battle') {
      this.scrollX += dt * 55;
    }

    this.playerBobT += dt * (this.state === 'battle' ? 0 : 3);
    this._drawScene();
    this._updateFloatTexts(dt);

    if (this.state === 'pre_battle') {
      this.monsterX -= dt * 100;
      if (this.monsterX <= 520) {
        this.monsterX = 520;
        this.state = 'battle';
        this.battleDmgTimer = 1.5;
      }
      this._updateMonsterSprite();
      this._drawHpBars();
    }

    if (this.state === 'battle') {
      this.battleFlashT += dt * 4;
      this.battleDmgTimer -= dt;
      if (this.battleDmgTimer <= 0) {
        this._doBattleTick();
        this.battleDmgTimer = 1.0;
      }
      this._updateMonsterSprite();
      this._drawHpBars();
    }

    if (this.dungeonVisible) {
      this.dungeonX -= dt * 55;
      this._drawDungeonEntrance(this.dungeonX);
      if (this.dungeonX < PLAYER_X + 80 && this.state === 'walking') {
        this.dungeonVisible = false;
        this.dungeonGfx.setVisible(false);
        this._enterDungeon();
      }
    }
  }

  // =========================================================
  //  GAME TICK (every 1s)
  // =========================================================
  _onTick() {
    if (this.state === 'event' || this.state === 'dungeon_enter' || this.state === 'boss_enter') return;

    const gs = window.gameState;
    gs.journey.distance++;
    gs.stats.distTraveled++;
    gs.regenHp();
    gs.updateQuestProgress('__dist__', 1);

    // Area update
    const newArea = D.getArea(gs.journey.distance);
    if (!this.currentArea || this.currentArea.id !== newArea.id) {
      this.currentArea = newArea;
      gs.journey.area = newArea.id;
      gs.addLog(`🗺️ エリアが変わった: ${newArea.name}`, 'highlight');
    }

    // Game clock
    gs.gameTime.tick++;
    if (gs.gameTime.tick % 60 === 0) {
      gs.gameTime.day++;
      if (gs.gameTime.day > 10) {
        gs.gameTime.day = 1;
        gs.gameTime.month++;
        gs.save();
        this._onMonthEnd();
        return;
      }
      gs.save();
    }

    // Monster spawn
    if (this.state === 'walking') {
      this.monsterCooldown--;
      if (this.monsterCooldown <= 0) {
        this._spawnMonster();
        this.monsterCooldown = Phaser.Math.Between(8, 16);
      }
    }

    // NPC spawn
    if (this.state === 'walking') {
      this.npcCooldown--;
      if (this.npcCooldown <= 0 && gs.quests.active.length < 5) {
        this._spawnNPC();
        this.npcCooldown = Phaser.Math.Between(80, 140);
      }
    }

    // Multiplayer sync
    this.syncCooldown--;
    if (this.syncCooldown <= 0) {
      window.multiManager.sendSync();
      this.syncCooldown = 5;
    }

    updateUI();
  }

  // =========================================================
  //  MONSTER SPAWN & BATTLE
  // =========================================================
  _spawnMonster() {
    const gs = window.gameState;
    const base = D.pickMonster(gs.journey.area, gs.guild?.id);
    this.currentMonster = gs.scaleMonster(base);
    this.monsterHp = this.currentMonster.hp;
    this.monsterX = CANVAS_W + 80;
    this.state = 'pre_battle';
    const key = SHAPE_SPRITE[this.currentMonster.shape] || 'slime';
    const groundY = this.currentMonster.shape === 'fly' ? GROUND_Y - 30 : GROUND_Y;
    this.monsterImg.setTexture(key).setPosition(this.monsterX, groundY).clearTint().setVisible(true);
    this.hpBarsGfx.setVisible(true);
    this.monsterNameTxt.setText(this.currentMonster.name).setPosition(this.monsterX, GROUND_Y - 88).setVisible(true);
    gs.addLog(`⚠️ ${this.currentMonster.name}が現れた！ [${this.currentMonster.rarity}]`);
  }

  _doBattleTick() {
    const gs = window.gameState;
    if (!this.currentMonster) return;

    const pStats = gs.getStats();

    // Player → Monster
    const pDmg = Math.max(1, pStats.atk - this.currentMonster.def);
    this.monsterHp -= pDmg;
    this._addFloat(this.monsterX, GROUND_Y - 60, `-${pDmg}`, '#ff4444');

    // Companions → Monster
    for (let i = 0; i < gs.companions.length; i++) {
      const c = gs.companions[i];
      if (c.hp > 0 && c.downTimer === 0) {
        const cDmg = Math.max(1, gs.getCompanionAtk(i) - Math.floor(this.currentMonster.def * 0.5));
        this.monsterHp -= cDmg;
        const cx = PLAYER_X - 42 * (i + 1);
        this._addFloat(cx, GROUND_Y - 60, `-${cDmg}`, '#ffaa44');
      }
    }

    // Monster → random living party member
    if (this.monsterHp > 0) {
      const targets = [{ type: 'player' }];
      for (let i = 0; i < gs.companions.length; i++) {
        if (gs.companions[i].hp > 0 && gs.companions[i].downTimer === 0) {
          targets.push({ type: 'companion', idx: i });
        }
      }
      const target = targets[Math.floor(Math.random() * targets.length)];

      if (target.type === 'player') {
        const mDmg = Math.max(1, this.currentMonster.atk - pStats.def);
        gs.player.hp = Math.max(0, gs.player.hp - mDmg);
        this._addFloat(PLAYER_X, GROUND_Y - 60, `-${mDmg}`, '#ff8844');
      } else {
        const ci = target.idx;
        const c = gs.companions[ci];
        const cDef = Math.floor(pStats.def * D.COMPANIONS[ci].defRatio);
        const mDmg = Math.max(1, this.currentMonster.atk - cDef);
        c.hp = Math.max(0, c.hp - mDmg);
        const cx = PLAYER_X - 42 * (ci + 1);
        this._addFloat(cx, GROUND_Y - 60, `-${mDmg}`, '#ff8844');
        if (c.hp <= 0) {
          c.downTimer = 12;
          gs.addLog(`💀 ${D.COMPANIONS[ci].name}がやられた！ しばらく戦線離脱...`, 'danger');
        }
      }
    }

    if (this.monsterHp <= 0) {
      this._onVictory();
    } else if (gs.player.hp <= 0) {
      this._onDefeat();
    }
  }

  _onVictory() {
    const gs = window.gameState;
    const m = this.currentMonster;

    // EXP
    const baseExp = m.exp * D.RARITY_EXP[m.rarity];
    const gained = gs.gainExp(baseExp);

    // Gold
    const g = m.gold[0] + Math.floor(Math.random() * (m.gold[1] - m.gold[0] + 1));
    const goldGained = gs.gainGold(g);

    // Stats
    gs.stats.monstersKilled++;
    gs.stats.killCount[m.id] = (gs.stats.killCount[m.id] || 0) + 1;
    gs.updateQuestProgress(m.id);

    // Drop check
    const guildDropBonus = gs.guild?.id === 'thieves' ? 0.20 : 0;
    const dropChance = 0.12 + guildDropBonus + (m.rarity === 'rare' ? 0.15 : 0) + (m.rarity === 'legendary' ? 0.30 : 0);
    if (m.drop && Math.random() < dropChance) {
      const dropId = m.drop[Math.floor(Math.random() * m.drop.length)];
      const item = D.EQUIPMENT[dropId];
      if (item && gs.addItem(item)) {
        gs.addLog(`💎 ${m.name}が「${item.name}」をドロップした！`, D.RARITY_COLOR[item.rarity] ? item.rarity : 'rare');
        showItemModal(item);
      }
    }

    const rarityLabel = { common:'', uncommon:'[珍しい] ', rare:'[レア！] ', legendary:'[伝説！！] ' }[m.rarity] || '';
    gs.addLog(`⚔️ ${rarityLabel}${m.name}を倒した！ EXP+${gained} 💰+${goldGained}`);
    this._addFloat(PLAYER_X, GROUND_Y - 80, `+${gained}EXP`, '#ffff44');

    this.encounterCount++;
    if (this.encounterCount >= this.dungeonThreshold) {
      this.encounterCount = 0;
      this.dungeonThreshold = Phaser.Math.Between(6, 14);
      this._showDungeonEntrance();
    }

    this._endBattle();
  }

  _onDefeat() {
    const gs = window.gameState;
    gs.player.hp = Math.floor(gs.getStats().maxHp * 0.3); // survive at 30%
    gs.addLog(`💀 ${this.currentMonster.name}にやられた！ 何とか生き延びた...`, 'danger');
    this._addFloat(PLAYER_X, GROUND_Y - 80, 'DEFEATED', '#ff2222');
    this._endBattle();
  }

  _endBattle() {
    this.currentMonster = null;
    this.monsterHp = 0;
    this.monsterImg.setVisible(false);
    this.monsterNameTxt.setVisible(false);
    this.hpBarsGfx.setVisible(false);
    this.state = 'walking';
    updateUI();
  }

  // =========================================================
  //  NPC EVENT
  // =========================================================
  _spawnNPC() {
    const gs = window.gameState;
    const templates = D.QUEST_TEMPLATES;
    const tmpl = templates[Math.floor(Math.random() * templates.length)];
    const quest = D.makeQuest(tmpl.id);
    this.npcData = quest;
    this.state = 'event';

    this.npcImg.setVisible(true);
    this._showDialog(
      `${quest.npcName}「${quest.title}を頼む！\n完了報酬: EXP+${quest.reward.exp} Gold+${quest.reward.gold}」`,
      [
        { label: '引き受ける', cb: () => { gs.addQuest(quest); this._closeEvent(); } },
        { label: '断る',       cb: () => { gs.addLog(`📜 依頼を断った`); this._closeEvent(); } },
      ]
    );
  }

  _closeEvent() {
    this.state = 'walking';
    this.npcImg.setVisible(false);
    this.dialogBox.setVisible(false);
  }

  // =========================================================
  //  DUNGEON
  // =========================================================
  _showDungeonEntrance() {
    this.dungeonX = CANVAS_W + 100;
    this.dungeonVisible = true;
    this.dungeonGfx.setVisible(true);
    window.gameState.addLog(`🏚️ ダンジョンへの入口が現れた！`, 'highlight');
  }

  _enterDungeon() {
    this.state = 'dungeon_enter';
    this.scene.pause('JourneyScene');
    this.scene.launch('DungeonScene');
  }

  // =========================================================
  //  MONTH END → BOSS
  // =========================================================
  _onMonthEnd() {
    const gs = window.gameState;
    const boss = D.pickBoss(gs.gameTime.month - 1);
    gs.addLog(`⚡ 月の終わり！ 大魔族「${boss.name}」が現れた！`, 'legendary');
    this.state = 'boss_enter';

    showGuildModal(() => {
      gs.guild && null; // guild already set
      this.scene.pause('JourneyScene');
      this.scene.launch('BossScene', { boss });
    }, true); // true = is monthly reset
  }

  // =========================================================
  //  DRAWING
  // =========================================================
  _drawScene() {
    const area = this.currentArea || D.AREAS[0];

    this.bgSky.clear();
    this.bgSky.fillGradientStyle(area.skyA, area.skyA, area.skyB, area.skyB, 1);
    this.bgSky.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this._drawClouds(area);

    this.bgFar.clear();
    this._drawFarLayer(this.bgFar, area);

    this.bgMid.clear();
    this._drawMidLayer(this.bgMid, area);

    this.bgGround.clear();
    this._drawGroundLayer(this.bgGround, area);

    // Bob animation for sprites
    const bob = this.state === 'walking' ? Math.sin(this.playerBobT) * 3 : 0;
    const compBob = this.state === 'walking' ? Math.sin(this.playerBobT * 0.9) * 3 : 0;

    // Player sprite
    this.playerImg.y = GROUND_Y - bob;
    const playerFlash = this.state === 'battle' && Math.sin(this.battleFlashT) > 0.5;
    playerFlash ? this.playerImg.setTint(0xaaaaff) : this.playerImg.clearTint();

    // Companion sprites
    this._updateCompanionSprites(compBob);

    // Partner sprite
    if (window.multiManager.partnerState) {
      this.partnerImg.setVisible(true);
      this.partnerImg.y = GROUND_Y - bob;
    } else {
      this.partnerImg.setVisible(false);
    }

    // Companion HP bars
    this._drawCompanionBars();

    // Sync player name (may change after load)
    const gs = window.gameState;
    this.playerNameTxt.setText(gs.player.name);

    // Companion name visibility (hide when downed)
    this.comp0NameTxt.setVisible(gs.companions[0]?.downTimer === 0);
    this.comp1NameTxt.setVisible(gs.companions[1]?.downTimer === 0);

    // Monster name follows sprite position
    if (this.monsterNameTxt.visible) {
      this.monsterNameTxt.setPosition(this.monsterX, GROUND_Y - 88);
    }
  }

  _updateCompanionSprites(bob) {
    const gs = window.gameState;
    const imgs = [this.comp0Img, this.comp1Img];
    for (let i = 0; i < gs.companions.length; i++) {
      const c = gs.companions[i];
      const img = imgs[i];
      if (c.downTimer > 0) {
        img.setAlpha(0.3).setTint(0x555555);
      } else {
        img.setAlpha(1).clearTint();
        img.y = GROUND_Y - bob;
      }
    }
  }

  _drawCompanionBars() {
    const g = this.compBarGfx;
    g.clear();
    const gs = window.gameState;
    for (let i = 0; i < gs.companions.length; i++) {
      const c = gs.companions[i];
      if (c.downTimer > 0) continue;
      const cx = PLAYER_X - 42 * (i + 1);
      const maxHp = gs.getCompanionMaxHp(i);
      const pct = Math.max(0, c.hp / maxHp);
      g.fillStyle(0x111111, 1);
      g.fillRect(cx - 18, GROUND_Y - 72, 36, 5);
      g.fillStyle(i === 0 ? 0x5588aa : 0x8866cc, 1);
      g.fillRect(cx - 18, GROUND_Y - 72, Math.floor(36 * pct), 5);
    }
  }

  _updateMonsterSprite() {
    if (!this.monsterImg.visible || !this.currentMonster) return;
    const groundY = this.currentMonster.shape === 'fly' ? GROUND_Y - 30 : GROUND_Y;
    this.monsterImg.setPosition(this.monsterX, groundY);
    const flash = this.state === 'battle' && Math.sin(this.battleFlashT) < -0.5;
    flash ? this.monsterImg.setTint(0xffffff) : this.monsterImg.clearTint();
  }

  _drawClouds(area) {
    const g = this.bgClouds;
    g.clear();
    if (area.skyA <= 0x223355) {
      // Stars for dark areas
      g.fillStyle(0xffffff, 0.7);
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 137.5) * 0.5 + 0.5) * CANVAS_W;
        const sy = (Math.sin(i * 97.3)  * 0.5 + 0.5) * GROUND_Y * 0.7;
        g.fillCircle(sx, sy, 0.8);
      }
      return;
    }
    const ox = (this.scrollX * 0.08) % CANVAS_W;
    g.fillStyle(0xffffff, 0.88);
    const clouds = [
      { bx: 80,  y: 60, w: 90,  h: 30 },
      { bx: 280, y: 42, w: 120, h: 36 },
      { bx: 500, y: 68, w: 80,  h: 26 },
      { bx: 680, y: 50, w: 100, h: 32 },
    ];
    clouds.forEach(({ bx, y, w, h }) => {
      [-CANVAS_W, 0, CANVAS_W].forEach(offset => {
        const cx = bx - ox + offset;
        if (cx + w < -20 || cx - w > CANVAS_W + 20) return;
        g.fillEllipse(cx,          y,     w,       h);
        g.fillEllipse(cx - w*0.22, y + 5, w * 0.6, h * 0.8);
        g.fillEllipse(cx + w*0.22, y + 5, w * 0.6, h * 0.8);
      });
    });
  }

  _drawFarLayer(g, area) {
    const ox = (this.scrollX * 0.15) % CANVAS_W;
    const hillCol = Phaser.Display.Color.IntegerToColor(area.skyB).lighten(8).color;
    g.fillStyle(hillCol, 1);
    for (let i = -1; i <= 2; i++) {
      const bx = i * 400 - ox;
      g.fillEllipse(bx + 100, GROUND_Y - 10, 320, 130);
      g.fillEllipse(bx + 280, GROUND_Y - 10, 240,  90);
    }
  }

  _drawMidLayer(g, area) {
    const ox = (this.scrollX * 0.4) % 300;
    g.fillStyle(area.fog || 0x0a1a08, 1);
    // Trees/rocks/etc based on area
    const shapes = this._getMidShapes(area.id);
    for (let i = -1; i <= 4; i++) {
      const bx = i * 300 - ox;
      shapes.forEach(fn => fn(g, bx));
    }
  }

  _getMidShapes(areaId) {
    const treeShape = (g, bx) => {
      g.fillStyle(0x1a5a14, 1);
      g.fillTriangle(bx + 20, GROUND_Y - 20, bx + 50, GROUND_Y - 90, bx + 80, GROUND_Y - 20);
      g.fillTriangle(bx + 10, GROUND_Y - 10, bx + 45, GROUND_Y - 70, bx + 80, GROUND_Y - 10);
      g.fillStyle(0x3a2a10, 1);
      g.fillRect(bx + 42, GROUND_Y - 20, 6, 20);
    };
    const rockShape = (g, bx) => {
      g.fillStyle(0x707080, 1);
      g.fillEllipse(bx + 60, GROUND_Y - 8, 40, 20);
      g.fillEllipse(bx + 80, GROUND_Y - 10, 30, 16);
    };
    const cactusShape = (g, bx) => {
      g.fillStyle(0x226622, 1);
      g.fillRect(bx + 55, GROUND_Y - 50, 10, 50);
      g.fillRect(bx + 35, GROUND_Y - 35, 20, 8);
      g.fillRect(bx + 35, GROUND_Y - 50, 8, 20);
      g.fillRect(bx + 65, GROUND_Y - 30, 20, 8);
      g.fillRect(bx + 77, GROUND_Y - 45, 8, 18);
    };
    const ruins = (g, bx) => {
      g.fillStyle(0x282820, 1);
      g.fillRect(bx + 20, GROUND_Y - 60, 18, 60);
      g.fillRect(bx + 70, GROUND_Y - 40, 14, 40);
      g.fillRect(bx + 120, GROUND_Y - 50, 16, 50);
    };
    const icicle = (g, bx) => {
      g.fillStyle(0x88aacc, 1);
      g.fillTriangle(bx + 30, GROUND_Y - 5, bx + 38, GROUND_Y - 55, bx + 46, GROUND_Y - 5);
      g.fillTriangle(bx + 55, GROUND_Y - 5, bx + 63, GROUND_Y - 40, bx + 71, GROUND_Y - 5);
    };

    const map = {
      plains: [treeShape, rockShape],
      forest: [treeShape, treeShape],
      mountains: [rockShape, rockShape],
      desert: [cactusShape, rockShape],
      swamp: [treeShape, rockShape],
      volcano: [rockShape, rockShape],
      tundra: [icicle, rockShape],
      ruins: [ruins, rockShape],
      demon_realm: [ruins, rockShape],
    };
    return map[areaId] || [treeShape, rockShape];
  }

  _drawGroundLayer(g, area) {
    g.fillStyle(area.ground || 0x2a6a14, 1);
    g.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Ground line detail
    const ox = (this.scrollX * 1.0) % 80;
    g.fillStyle(Phaser.Display.Color.IntegerToColor(area.ground || 0x2a6a14).darken(15).color, 0.5);
    for (let x = -ox; x < CANVAS_W; x += 80) {
      g.fillRect(x, GROUND_Y, 40, 3);
    }
  }

  _drawHpBars() {
    const g = this.hpBarsGfx;
    g.clear();
    const gs = window.gameState;
    const stats = gs.getStats();

    const pPct = gs.player.hp / stats.maxHp;
    g.fillStyle(0x220000, 1);
    g.fillRect(PLAYER_X - 30, GROUND_Y - 75, 60, 8);
    g.fillStyle(0xcc2222, 1);
    g.fillRect(PLAYER_X - 30, GROUND_Y - 75, Math.floor(60 * pPct), 8);

    if (this.currentMonster) {
      const mPct = Math.max(0, this.monsterHp / this.currentMonster.hp);
      const mx = this.monsterX;
      g.fillStyle(0x220000, 1);
      g.fillRect(mx - 35, GROUND_Y - 80, 70, 8);
      const hpCol = mPct > 0.5 ? 0x22cc22 : mPct > 0.25 ? 0xcccc22 : 0xcc2222;
      g.fillStyle(hpCol, 1);
      g.fillRect(mx - 35, GROUND_Y - 80, Math.floor(70 * mPct), 8);

      if (this.currentMonster.rarity === 'rare' || this.currentMonster.rarity === 'legendary') {
        const glowCol = this.currentMonster.rarity === 'legendary' ? 0xffaa00 : 0x4488ff;
        g.lineStyle(2, glowCol, 0.6);
        g.strokeCircle(mx, GROUND_Y - 30, 44);
      }
    }
  }

  _drawDungeonEntrance(dx) {
    const g = this.dungeonGfx;
    g.clear();
    // Stone doorway
    g.fillStyle(0x303030, 1);
    g.fillRect(dx - 28, GROUND_Y - 80, 56, 80);
    g.fillStyle(0x080808, 1);
    g.fillRect(dx - 18, GROUND_Y - 70, 36, 70);
    g.fillStyle(0x444444, 1);
    g.fillRect(dx - 30, GROUND_Y - 82, 60, 10);
    // Torch
    g.fillStyle(0xff8800, 1);
    g.fillCircle(dx - 22, GROUND_Y - 70, 5);
    g.fillCircle(dx + 22, GROUND_Y - 70, 5);
    // Sign
    g.fillStyle(0x664422, 1);
    g.fillRect(dx - 20, GROUND_Y - 95, 40, 18);
  }

  // =========================================================
  //  DIALOG
  // =========================================================
  _buildDialog() {
    const c = this.dialogBox;
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a18, 0.9);
    bg.fillRoundedRect(-320, -50, 640, 100, 8);
    bg.lineStyle(1, 0x4444aa, 1);
    bg.strokeRoundedRect(-320, -50, 640, 100, 8);
    c.add(bg);

    this.dialogText = this.add.text(0, -25, '', {
      fontSize: '12px', color: '#d4c8a8', wordWrap: { width: 580 }, align: 'center'
    }).setOrigin(0.5);
    c.add(this.dialogText);

    this.dialogBtn1 = this.add.text(-80, 20, '引き受ける', {
      fontSize: '12px', color: '#ffd700', backgroundColor: '#1a1a3a',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    c.add(this.dialogBtn1);

    this.dialogBtn2 = this.add.text(80, 20, '断る', {
      fontSize: '12px', color: '#ff8888', backgroundColor: '#2a1a1a',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    c.add(this.dialogBtn2);
  }

  _showDialog(text, buttons) {
    this.dialogBox.setVisible(true);
    this.dialogText.setText(text);

    this.dialogBtn1.removeAllListeners('pointerdown');
    this.dialogBtn2.removeAllListeners('pointerdown');

    if (buttons[0]) {
      this.dialogBtn1.setText(buttons[0].label).setVisible(true);
      this.dialogBtn1.on('pointerdown', buttons[0].cb);
    }
    if (buttons[1]) {
      this.dialogBtn2.setText(buttons[1].label).setVisible(true);
      this.dialogBtn2.on('pointerdown', buttons[1].cb);
    }
  }

  // =========================================================
  //  FLOATING TEXTS
  // =========================================================
  _addFloat(x, y, text, color = '#ffffff') {
    const t = this.add.text(x, y, text, {
      fontSize: '14px', fontStyle: 'bold', color,
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    this.floatTexts.push({ obj: t, vy: -60, life: 1.2 });
  }

  _updateFloatTexts(dt) {
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.life -= dt;
      ft.obj.y += ft.vy * dt;
      ft.obj.alpha = Math.max(0, ft.life);
      if (ft.life <= 0) {
        ft.obj.destroy();
        this.floatTexts.splice(i, 1);
      }
    }
  }

  // =========================================================
  //  Called from DungeonScene / BossScene on return
  // =========================================================
  resumeFromScene() {
    this.state = 'walking';
    updateUI();
  }
}
