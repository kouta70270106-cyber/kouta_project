'use strict';

// Room nodes matching dungeon-map.html (SVG viewBox 0 0 820 500 → canvas 750×480)
const DMAP_ROOMS = (() => {
  const sx = 750 / 820, sy = 480 / 500;
  const p = (x, y) => ({ x: Math.round(x * sx), y: Math.round(y * sy) });
  return [
    { id: 0, name: '入口',     ...p(110, 400), isBoss: false, neighbors: [1, 3] },
    { id: 1, name: '広間',     ...p(110, 250), isBoss: false, neighbors: [0, 2, 4] },
    { id: 2, name: '宝物庫',   ...p(110, 100), isBoss: false, neighbors: [1] },
    { id: 3, name: '貯蔵庫',   ...p(300, 400), isBoss: false, neighbors: [0] },
    { id: 4, name: '衛兵所',   ...p(300, 250), isBoss: false, neighbors: [1, 5] },
    { id: 5, name: '中央広場', ...p(490, 250), isBoss: false, neighbors: [4, 6, 7] },
    { id: 6, name: '祭壇',     ...p(490, 100), isBoss: false, neighbors: [5] },
    { id: 7, name: '控えの間', ...p(690, 250), isBoss: false, neighbors: [5, 8] },
    { id: 8, name: 'ボスの間', ...p(698,  99), isBoss: true,  neighbors: [7] },
  ];
})();
const DNODE_R = 22;

class DungeonScene extends Phaser.Scene {
  constructor() { super({ key: 'DungeonScene' }); }

  create() {
    const gs = window.gameState;

    this.floorNum = 1 + Math.floor(gs.journey.distance / 300);
    this.rooms = this._generateRooms();
    this.playerRoomId = 0;
    this.state = 'explore';
    this.battleMonster = null;
    this.battleMonsterHp = 0;
    this.battleFlashT = 0;
    this.battleDmgTimer = 1.5;
    this.autoMoveTimer = 0;
    this.autoMode = localStorage.getItem('dungeon_auto') !== 'false';

    // Background image
    this.add.image(CANVAS_W / 2, CANVAS_H / 2, 'dungeon_bg').setDisplaySize(CANVAS_W, CANVAS_H);

    // Graphics layers
    this.mapGfx  = this.add.graphics();
    this.charGfx = this.add.graphics();
    this.hpGfx   = this.add.graphics();
    this.floatTexts = [];

    // Title
    this.add.text(CANVAS_W / 2, 24, `🏚️ ダンジョン (フロア${this.floorNum})`, {
      fontSize: '16px', color: '#ffd700', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Exit button
    const exitBtn = this.add.text(60, CANVAS_H - 20, '[ 退出 ]', {
      fontSize: '13px', color: '#ff8888', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    exitBtn.on('pointerdown', () => { window.playSE?.(); this._exitDungeon(false); });

    // Auto/Manual toggle
    this.toggleBtn = this.add.text(CANVAS_W - 60, CANVAS_H - 20, '', {
      fontSize: '12px', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#1a2a1a', padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.toggleBtn.on('pointerdown', () => { window.playSE?.(); this._toggleAutoMode(); });
    this._updateToggleBtn();

    this._drawAll();
    this._enterRoom();

    gs.addLog(`🏚️ ダンジョン（フロア${this.floorNum}）に潜った！`, 'highlight');
    updateUI();
  }

  update(time, delta) {
    const dt = (delta / 1000) * window.gameSpeed;
    if (this.state === 'battle') {
      this.battleFlashT += dt * 4;
      this.battleDmgTimer -= dt;
      if (this.battleDmgTimer <= 0) {
        this._doBattleTick();
        this.battleDmgTimer = 1.0;
      }
    } else if (this.state === 'explore' && this.autoMode && this.autoMoveTimer > 0) {
      this.autoMoveTimer -= dt;
      if (this.autoMoveTimer <= 0) this._autoMove();
    }
    this._drawAll();
    this._updateFloats(dt);
  }

  // =========================================================
  //  ROOM GENERATION
  // =========================================================
  _generateRooms() {
    const gs = window.gameState;
    return DMAP_ROOMS.map(tmpl => {
      const isStart = tmpl.id === 0;
      const isEmpty = isStart || (!tmpl.isBoss && Math.random() < 0.15);
      let monster = null;
      if (!isEmpty) {
        const base = tmpl.isBoss
          ? this._pickRareMonster(gs.journey.area)
          : D.pickMonster(gs.journey.area, gs.guild?.id);
        monster = gs.scaleMonster({
          ...base,
          hp:  Math.floor(base.hp  * (1 + this.floorNum * 0.1)),
          atk: Math.floor(base.atk * (1 + this.floorNum * 0.08)),
        });
      }
      return { ...tmpl, monster, cleared: false };
    });
  }

  _pickRareMonster(area) {
    const rareMonsters = Object.values(D.MONSTERS).filter(m =>
      (m.rarity === 'rare' || m.rarity === 'legendary') &&
      (!m.areas || m.areas.includes(area))
    );
    if (rareMonsters.length === 0) return Object.values(D.MONSTERS).filter(m => m.rarity === 'rare')[0];
    return rareMonsters[Math.floor(Math.random() * rareMonsters.length)];
  }

  _getRoom(id) { return this.rooms.find(r => r.id === id); }
  _currentRoom() { return this._getRoom(this.playerRoomId); }

  // =========================================================
  //  ROOM LOGIC
  // =========================================================
  _enterRoom() {
    const room = this._currentRoom();
    if (!room) return;

    if (room.cleared || !room.monster) {
      this.state = 'explore';
      this._showMoveButtons();
    } else {
      this.state = 'battle';
      this.battleMonster = room.monster;
      this.battleMonsterHp = room.monster.hp;
      this.battleDmgTimer = 1.5;
      window.gameState.addLog(`⚔️ ${room.monster.name}が待ち構えていた！`);
      this._hideMoveButtons();
    }
  }

  _showMoveButtons() {
    const room = this._currentRoom();
    if (!room) return;

    if (this.rooms.every(r => r.cleared || !r.monster)) {
      this._allClear();
      return;
    }

    this._clearMoveButtons();

    if (this.autoMode) {
      this.autoMoveTimer = 1.2;
      return;
    }

    // Manual: clickable zones at each neighbor room node
    this.moveButtons = [];
    for (const nid of room.neighbors) {
      const nr = this._getRoom(nid);
      if (!nr) continue;

      const hasMonster = !nr.cleared && nr.monster;
      const zone = this.add.zone(nr.x, nr.y, (DNODE_R + 8) * 2, (DNODE_R + 8) * 2)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(nr.x, nr.y + DNODE_R + 14, nr.name, {
        fontSize: '10px', color: hasMonster ? '#ff8888' : '#88ff88',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5);

      zone.on('pointerdown', () => {
        window.playSE?.();
        this.playerRoomId = nid;
        this._clearMoveButtons();
        this._enterRoom();
      });

      this.moveButtons.push(zone, label);
    }
  }

  _autoMove() {
    this.autoMoveTimer = 0;

    const visited = new Set([this.playerRoomId]);
    const queue = [{ id: this.playerRoomId, firstStep: null }];

    while (queue.length > 0) {
      const cur = queue.shift();
      const room = this._getRoom(cur.id);
      for (const nid of room.neighbors) {
        if (visited.has(nid)) continue;
        visited.add(nid);
        const firstStep = cur.firstStep ?? nid;
        const adj = this._getRoom(nid);
        if (adj && !adj.cleared && adj.monster) {
          this.playerRoomId = firstStep;
          this._enterRoom();
          return;
        }
        queue.push({ id: nid, firstStep });
      }
    }
    this._showMoveButtons();
  }

  _toggleAutoMode() {
    this.autoMode = !this.autoMode;
    localStorage.setItem('dungeon_auto', this.autoMode ? 'true' : 'false');
    this._updateToggleBtn();
    if (!this.autoMode) {
      this.autoMoveTimer = 0;
      if (this.state === 'explore') this._showMoveButtons();
    } else {
      this._clearMoveButtons();
      if (this.state === 'explore') this.autoMoveTimer = 0.5;
    }
  }

  _updateToggleBtn() {
    if (!this.toggleBtn) return;
    if (this.autoMode) {
      this.toggleBtn.setText('🤖 オート中');
      this.toggleBtn.setColor('#88ffaa');
    } else {
      this.toggleBtn.setText('🕹️ 手動操作');
      this.toggleBtn.setColor('#ffdd88');
    }
  }

  _hideMoveButtons() { this._clearMoveButtons(); }

  _clearMoveButtons() {
    if (this.moveButtons) {
      this.moveButtons.forEach(b => b.destroy());
      this.moveButtons = [];
    }
  }

  // =========================================================
  //  BATTLE
  // =========================================================
  _doBattleTick() {
    const gs = window.gameState;
    const pStats = gs.getStats();
    const m = this.battleMonster;

    const pDmg = Math.max(1, pStats.atk - m.def);
    this.battleMonsterHp -= pDmg;
    this._addFloat(CANVAS_W / 2 + 80, CANVAS_H / 2 - 40, `-${pDmg}`, '#ff4444');

    if (this.battleMonsterHp > 0) {
      const mDmg = Math.max(1, m.atk - pStats.def);
      gs.player.hp = Math.max(0, gs.player.hp - mDmg);
      this._addFloat(CANVAS_W / 2 - 80, CANVAS_H / 2 - 40, `-${mDmg}`, '#ff8844');
    }

    if (this.battleMonsterHp <= 0) {
      this._onRoomVictory();
    } else if (gs.player.hp <= 0) {
      this._onRoomDefeat();
    }
    updateUI();
  }

  _onRoomVictory() {
    const gs = window.gameState;
    const m = this.battleMonster;
    const room = this._currentRoom();
    room.cleared = true;

    const baseExp = m.exp * D.RARITY_EXP[m.rarity];
    const gained = gs.gainExp(baseExp);
    const g = m.gold[0] + Math.floor(Math.random() * (m.gold[1] - m.gold[0] + 1));
    const goldGained = gs.gainGold(g);

    gs.stats.monstersKilled++;
    gs.stats.killCount[m.id] = (gs.stats.killCount[m.id] || 0) + 1;
    gs.updateQuestProgress(m.id);

    const dropChance = 0.25 + (m.rarity === 'rare' ? 0.2 : 0) + (m.rarity === 'legendary' ? 0.4 : 0)
                     + (gs.guild?.id === 'thieves' ? 0.15 : 0);
    if (m.drop && Math.random() < dropChance) {
      const dropId = m.drop[Math.floor(Math.random() * m.drop.length)];
      const item = D.EQUIPMENT[dropId];
      if (item && gs.addItem(item)) {
        gs.addLog(`💎 「${item.name}」を入手！`, item.rarity);
        showItemModal(item);
      }
    }

    gs.addLog(`⚔️ ${m.name}を倒した！ EXP+${gained} 💰+${goldGained}`);
    if (room.isBoss) gs.addLog(`👑 ダンジョンボスを討伐！`, 'legendary');

    this.state = 'explore';
    this.battleMonster = null;
    this._showMoveButtons();
    updateUI();
  }

  _onRoomDefeat() {
    const gs = window.gameState;
    gs.player.hp = Math.floor(gs.getStats().maxHp * 0.25);
    gs.addLog(`💀 ダンジョンで倒された！ 入口まで引き返した...`, 'danger');
    this._exitDungeon(false);
  }

  _allClear() {
    const gs = window.gameState;
    gs.stats.dungeonsCleared++;
    gs.addLog(`🏆 ダンジョン踏破！ 全ての魔物を倒した！`, 'legendary');
    const bonusExp = 500 * this.floorNum;
    const bonusGold = 200 * this.floorNum;
    gs.gainExp(bonusExp);
    gs.gainGold(bonusGold);
    gs.addLog(`✨ 踏破ボーナス: EXP+${bonusExp} Gold+${bonusGold}`, 'success');
    const rareDrops = Object.values(D.EQUIPMENT).filter(e => e.rarity === 'rare');
    const drop = rareDrops[Math.floor(Math.random() * rareDrops.length)];
    if (drop && gs.addItem(drop)) {
      gs.addLog(`💎 踏破報酬「${drop.name}」を入手！`, 'rare');
      showItemModal(drop);
    }
    this._exitDungeon(true);
  }

  _exitDungeon(cleared) {
    this.scene.stop('DungeonScene');
    this.scene.resume('JourneyScene');
    const journey = this.scene.get('JourneyScene');
    if (journey) journey.resumeFromScene();
    window.gameState.addLog(cleared ? `🚪 ダンジョンを脱出した！` : `🚪 ダンジョンから撤退した`);
    updateUI();
  }

  // =========================================================
  //  DRAWING
  // =========================================================
  _drawAll() {
    const g = this.mapGfx;
    g.clear();

    // Semi-transparent overlay
    g.fillStyle(0x050510, 0.45);
    g.fillRect(0, 44, CANVAS_W, CANVAS_H - 44);

    // Corridors (draw edges once per pair)
    for (const room of this.rooms) {
      for (const nid of room.neighbors) {
        if (nid > room.id) {
          const nr = this._getRoom(nid);
          g.lineStyle(5, 0x2a1a08, 0.75);
          g.lineBetween(room.x, room.y, nr.x, nr.y);
          g.lineStyle(2, 0x8a6438, 0.5);
          g.lineBetween(room.x, room.y, nr.x, nr.y);
        }
      }
    }

    // Room nodes
    for (const room of this.rooms) {
      this._drawRoom(g, room);
    }

    // Characters and HP (battle)
    const cg = this.charGfx;
    cg.clear();
    this._drawDungeonChars(cg);

    const hg = this.hpGfx;
    hg.clear();
    if (this.state === 'battle') this._drawDungeonHpBars(hg);
  }

  _drawRoom(g, room) {
    const { x, y } = room;
    const isPlayer   = room.id === this.playerRoomId;
    const isNeighbor = this.state === 'explore' && !this.autoMode &&
                       (this._currentRoom()?.neighbors.includes(room.id) ?? false);
    const R = DNODE_R;

    // Fill
    let fillCol, alpha;
    if (isPlayer)                        { fillCol = 0x2244aa; alpha = 0.90; }
    else if (room.cleared || !room.monster) { fillCol = 0x1a3a1a; alpha = 0.75; }
    else if (room.isBoss)                { fillCol = 0x440010; alpha = 0.92; }
    else                                 { fillCol = 0x1a0a22; alpha = 0.80; }

    g.fillStyle(fillCol, alpha);
    g.fillCircle(x, y, R);

    // Border
    const borderCol = room.isBoss ? 0xcc2244 : (isPlayer ? 0x6699ff : 0x6a4a1e);
    g.lineStyle(2, borderCol, 1);
    g.strokeCircle(x, y, R);

    // Clickable neighbor highlight
    if (isNeighbor) {
      g.lineStyle(2, 0xffdd44, 0.85);
      g.strokeCircle(x, y, R + 5);
    }

    // Monster dot / crown
    if (!room.cleared && room.monster) {
      g.fillStyle(room.isBoss ? 0xff4466 : (room.monster.color || 0xff4444), 0.9);
      g.fillCircle(x, y, room.isBoss ? 10 : 7);
      if (room.isBoss) {
        g.fillStyle(0xffd700, 1);
        g.fillTriangle(x - 6, y + 5, x, y - 8, x + 6, y + 5);
      }
    } else if (room.cleared) {
      g.fillStyle(0x44ff88, 0.6);
      g.fillCircle(x, y, 5);
    }

    // Player dot
    if (isPlayer) {
      g.fillStyle(0xaaccff, 1);
      g.fillCircle(x, y - R + 7, 5);
    }
  }

  _drawDungeonChars(g) {
    if (this.state !== 'battle' || !this.battleMonster) return;

    const cx = CANVAS_W / 2;
    const by = CANVAS_H - 140;

    g.fillStyle(0x5566ff, 1);
    g.fillCircle(cx - 90, by - 20, 10);
    g.fillRect(cx - 99, by - 10, 18, 22);
    g.fillRect(cx - 99, by + 12, 7, 14);
    g.fillRect(cx - 90, by + 12, 7, 14);

    const flash = this.state === 'battle' && Math.sin(this.battleFlashT) < -0.5;
    g.fillStyle(flash ? 0xffffff : (this.battleMonster.color || 0xcc2222), 1);
    g.fillCircle(cx + 90, by - 20, 14);
    g.fillRect(cx + 76, by - 6, 28, 25);
  }

  _drawDungeonHpBars(g) {
    const gs = window.gameState;
    const stats = gs.getStats();
    const cx = CANVAS_W / 2;
    const by = CANVAS_H - 160;

    const pPct = gs.player.hp / stats.maxHp;
    g.fillStyle(0x220000, 1);
    g.fillRect(cx - 160, by, 100, 8);
    g.fillStyle(0xcc2222, 1);
    g.fillRect(cx - 160, by, Math.floor(100 * pPct), 8);

    if (this.battleMonster) {
      const mPct = Math.max(0, this.battleMonsterHp / this.battleMonster.hp);
      g.fillStyle(0x220000, 1);
      g.fillRect(cx + 60, by, 100, 8);
      g.fillStyle(mPct > 0.5 ? 0x22cc22 : mPct > 0.25 ? 0xcccc22 : 0xcc2222, 1);
      g.fillRect(cx + 60, by, Math.floor(100 * mPct), 8);
    }
  }

  _addFloat(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontSize: '14px', fontStyle: 'bold', color,
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    this.floatTexts.push({ obj: t, vy: -50, life: 1.0 });
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
