'use strict';

const CANVAS_W = 750;
const CANVAS_H = 480;
const GROUND_Y = 360;
const PLAYER_X = 180;

class JourneyScene extends Phaser.Scene {
  constructor() { super({ key: 'JourneyScene' }); }

  create() {
    this.state = 'walking'; // walking | pre_battle | battle | event | dungeon_enter | boss_enter

    // ---- Background layers ----
    this.bgSky   = this.add.graphics();
    this.bgFar   = this.add.graphics();
    this.bgMid   = this.add.graphics();
    this.bgGround= this.add.graphics();
    this.bgDeco  = this.add.graphics();  // stars, trees, rocks etc

    // ---- Characters ----
    this.playerGfx   = this.add.graphics();
    this.compGfx     = this.add.graphics();
    this.partnerGfx  = this.add.graphics().setVisible(false);
    this.monsterGfx  = this.add.graphics();
    this.hpBarsGfx   = this.add.graphics();
    this.npcGfx      = this.add.graphics().setVisible(false);
    this.dungeonGfx  = this.add.graphics().setVisible(false);

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
    const dt = delta / 1000;

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
        this.battleDmgTimer = 1.5; // first hit after 1.5s
      }
      this._drawMonster(this.monsterX);
      this._drawHpBars();
    }

    if (this.state === 'battle') {
      this.battleFlashT += dt * 4;
      this.battleDmgTimer -= dt;
      if (this.battleDmgTimer <= 0) {
        this._doBattleTick();
        this.battleDmgTimer = 1.0;
      }
      this._drawMonster(this.monsterX);
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
    this.monsterGfx.setVisible(true);
    this.hpBarsGfx.setVisible(true);
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
    this.monsterGfx.setVisible(false);
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

    this.npcGfx.setVisible(true);
    this._drawNPC();
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
    this.npcGfx.setVisible(false);
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
    const gs = window.gameState;
    const area = this.currentArea || D.AREAS[0];

    // Sky
    this.bgSky.clear();
    const skyGrad = this.bgSky.fillGradientStyle(
      area.skyA, area.skyA, area.skyB, area.skyB, 1
    );
    this.bgSky.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars (only in dark areas)
    this.bgFar.clear();
    this._drawStars(this.bgFar, area);
    this._drawFarLayer(this.bgFar, area);

    // Mid layer (trees/rocks)
    this.bgMid.clear();
    this._drawMidLayer(this.bgMid, area);

    // Ground
    this.bgGround.clear();
    this._drawGroundLayer(this.bgGround, area);

    // Player
    this._drawPlayer();

    // Companions
    this._drawCompanions();

    // Partner
    if (window.multiManager.partnerState) {
      this.partnerGfx.setVisible(true);
      this._drawPartner();
    }
  }

  _drawCompanions() {
    const g = this.compGfx;
    g.clear();
    const gs = window.gameState;
    const bob = this.state === 'walking' ? Math.sin(this.playerBobT * 0.9) * 3 : 0;

    for (let i = 0; i < gs.companions.length; i++) {
      const c = gs.companions[i];
      const def = D.COMPANIONS[i];
      const cx = PLAYER_X - 42 * (i + 1);
      const y = GROUND_Y - bob;

      if (c.downTimer > 0) {
        g.fillStyle(0x444444, 0.5);
        g.fillCircle(cx, GROUND_Y - 10, 12);
        continue;
      }

      this._drawHumanoid(g, cx, y, def.color, 0.88);

      // Companion HP bar above head
      const maxHp = gs.getCompanionMaxHp(i);
      const pct = Math.max(0, c.hp / maxHp);
      g.fillStyle(0x111111, 1);
      g.fillRect(cx - 18, y - 52, 36, 5);
      g.fillStyle(i === 0 ? 0x5588aa : 0x8866cc, 1);
      g.fillRect(cx - 18, y - 52, Math.floor(36 * pct), 5);
    }
  }

  _drawStars(g, area) {
    if (area.skyA > 0x101010) return; // not dark enough
    // Pseudo-random fixed stars using sin
    g.fillStyle(0xffffff, 0.7);
    for (let i = 0; i < 40; i++) {
      const sx = (Math.sin(i * 137.5) * 0.5 + 0.5) * CANVAS_W;
      const sy = (Math.sin(i * 97.3) * 0.5 + 0.5) * GROUND_Y * 0.7;
      g.fillCircle(sx, sy, 0.8);
    }
  }

  _drawFarLayer(g, area) {
    const ox = (this.scrollX * 0.15) % CANVAS_W;
    // Mountains silhouette
    g.fillStyle(Phaser.Display.Color.IntegerToColor(area.skyB).darken(20).color, 1);
    for (let i = -1; i <= 2; i++) {
      const bx = i * 400 - ox;
      g.fillTriangle(bx + 50, GROUND_Y - 20, bx + 200, GROUND_Y - 100, bx + 350, GROUND_Y - 20);
      g.fillTriangle(bx + 150, GROUND_Y - 20, bx + 260, GROUND_Y - 70, bx + 380, GROUND_Y - 20);
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
      g.fillStyle(0x0a2a08, 1);
      g.fillTriangle(bx + 20, GROUND_Y - 20, bx + 50, GROUND_Y - 90, bx + 80, GROUND_Y - 20);
      g.fillTriangle(bx + 10, GROUND_Y - 10, bx + 45, GROUND_Y - 70, bx + 80, GROUND_Y - 10);
      g.fillStyle(0x0a1a08, 1);
      g.fillRect(bx + 42, GROUND_Y - 20, 6, 20);
    };
    const rockShape = (g, bx) => {
      g.fillStyle(0x303040, 1);
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
    // Main ground
    g.fillStyle(area.ground || 0x1a3a10, 1);
    g.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Ground line detail
    const ox = (this.scrollX * 1.0) % 80;
    g.fillStyle(Phaser.Display.Color.IntegerToColor(area.ground || 0x1a3a10).darken(15).color, 0.5);
    for (let x = -ox; x < CANVAS_W; x += 80) {
      g.fillRect(x, GROUND_Y, 40, 3);
    }
  }

  _drawPlayer() {
    const g = this.playerGfx;
    g.clear();
    const bob = this.state === 'walking' ? Math.sin(this.playerBobT) * 3 : 0;
    const y = GROUND_Y - bob;
    const x = PLAYER_X;
    const flash = this.state === 'battle' && Math.sin(this.battleFlashT) > 0.5;

    this._drawHumanoid(g, x, y, flash ? 0x8888ff : 0x5566ff, 1.0, true);

    // Weapon
    const eq = window.gameState.player.equipment;
    if (eq.weapon) {
      g.fillStyle(0xcccc66, 1);
      g.fillRect(x + 14, y - 30, 4, 28); // sword
    }
    // Shield (if armor with def)
    if (eq.armor && (eq.armor.def || 0) > 10) {
      g.fillStyle(0x6688aa, 1);
      g.fillRect(x - 20, y - 25, 6, 18);
    }

    // Name + level tag
    const gs = window.gameState;
    const nameTag = this.add.text ? null : null;
    // Using graphics text-like indicator
    g.fillStyle(0xffd700, 1);
    g.fillRect(x - 18, y - 52, 36, 3);
  }

  _drawHumanoid(g, x, y, color, scale = 1, isPlayer = false) {
    const s = scale;
    g.fillStyle(color, 1);
    // Head
    g.fillCircle(x, y - 32 * s, 10 * s);
    // Body
    g.fillRect(x - 9 * s, y - 22 * s, 18 * s, 22 * s);
    // Left leg
    g.fillRect(x - 9 * s, y, 7 * s, 16 * s);
    // Right leg
    g.fillRect(x + 2 * s, y, 7 * s, 16 * s);
    // Left arm
    g.fillRect(x - 16 * s, y - 20 * s, 7 * s, 16 * s);
    // Right arm
    g.fillRect(x + 9 * s, y - 20 * s, 7 * s, 16 * s);
  }

  _drawMonster(mx) {
    const g = this.monsterGfx;
    g.clear();
    if (!this.currentMonster) return;

    const m = this.currentMonster;
    const flash = this.state === 'battle' && Math.sin(this.battleFlashT) < -0.5;
    const col = flash ? 0xffffff : (m.color || 0xff4444);

    switch (m.shape) {
      case 'blob':
        g.fillStyle(col, 1);
        g.fillEllipse(mx, GROUND_Y - 14, 40, 30);
        g.fillStyle(0x000000, 0.5);
        g.fillCircle(mx - 8, GROUND_Y - 18, 4);
        g.fillCircle(mx + 8, GROUND_Y - 18, 4);
        break;
      case 'small':
        this._drawHumanoid(g, mx, GROUND_Y, col, 0.7);
        break;
      case 'human':
        this._drawHumanoid(g, mx, GROUND_Y, col, 1.0);
        break;
      case 'large':
        this._drawHumanoid(g, mx, GROUND_Y, col, 1.4);
        break;
      case 'quad':
        g.fillStyle(col, 1);
        g.fillRect(mx - 22, GROUND_Y - 22, 44, 22);
        g.fillRect(mx - 22, GROUND_Y, 10, 14);
        g.fillRect(mx - 5, GROUND_Y, 10, 12);
        g.fillRect(mx + 5, GROUND_Y, 10, 12);
        g.fillRect(mx + 12, GROUND_Y, 10, 14);
        g.fillRect(mx + 18, GROUND_Y - 30, 14, 14);
        break;
      case 'fly':
        g.fillStyle(col, 1);
        g.fillEllipse(mx, GROUND_Y - 40, 30, 22);
        g.fillTriangle(mx - 30, GROUND_Y - 50, mx - 10, GROUND_Y - 40, mx - 10, GROUND_Y - 25);
        g.fillTriangle(mx + 10, GROUND_Y - 40, mx + 30, GROUND_Y - 50, mx + 10, GROUND_Y - 25);
        break;
      case 'multi':
        g.fillStyle(col, 1);
        g.fillCircle(mx, GROUND_Y - 20, 18);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          g.fillRect(mx + Math.cos(a) * 18, GROUND_Y - 20 + Math.sin(a) * 18, 3, 14);
        }
        break;
      default:
        this._drawHumanoid(g, mx, GROUND_Y, col, 1.0);
    }

    // Rarity glow
    if (m.rarity === 'rare' || m.rarity === 'legendary') {
      const glowCol = m.rarity === 'legendary' ? 0xffaa00 : 0x4488ff;
      g.lineStyle(2, glowCol, 0.6);
      g.strokeCircle(mx, GROUND_Y - 20, 40);
    }
  }

  _drawHpBars() {
    const g = this.hpBarsGfx;
    g.clear();

    const gs = window.gameState;
    const stats = gs.getStats();

    // Player HP
    const pPct = gs.player.hp / stats.maxHp;
    g.fillStyle(0x220000, 1);
    g.fillRect(PLAYER_X - 30, GROUND_Y - 75, 60, 8);
    g.fillStyle(0xcc2222, 1);
    g.fillRect(PLAYER_X - 30, GROUND_Y - 75, Math.floor(60 * pPct), 8);

    // Monster HP
    if (this.currentMonster) {
      const mPct = Math.max(0, this.monsterHp / this.currentMonster.hp);
      const mx = this.monsterX;
      g.fillStyle(0x220000, 1);
      g.fillRect(mx - 35, GROUND_Y - 80, 70, 8);
      const hpCol = mPct > 0.5 ? 0x22cc22 : mPct > 0.25 ? 0xcccc22 : 0xcc2222;
      g.fillStyle(hpCol, 1);
      g.fillRect(mx - 35, GROUND_Y - 80, Math.floor(70 * mPct), 8);
    }
  }

  _drawNPC() {
    const g = this.npcGfx;
    g.clear();
    this._drawHumanoid(g, 350, GROUND_Y, 0xddcc66, 1.0);
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

  _drawPartner() {
    const g = this.partnerGfx;
    g.clear();
    const state = window.multiManager.partnerState;
    if (!state) return;
    // Partner walks slightly behind player
    this._drawHumanoid(g, PLAYER_X - 40, GROUND_Y, 0x44aaff, 1.0);
    g.fillStyle(0x44aaff, 1);
    g.fillRect(PLAYER_X - 58, GROUND_Y - 75, 36, 3);
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
