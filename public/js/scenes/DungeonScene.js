'use strict';

const DCELL = 80;
const DCOLS = 5;
const DROWS = 4;
const DOFF_X = (750 - DCOLS * DCELL) / 2;
const DOFF_Y = 60;

class DungeonScene extends Phaser.Scene {
  constructor() { super({ key: 'DungeonScene' }); }

  create() {
    const gs = window.gameState;

    // Floor count increases with journey
    this.floorNum = 1 + Math.floor(gs.journey.distance / 300);
    this.rooms = this._generateRooms();
    this.playerCell = { col: 0, row: DROWS - 1 };
    this.state = 'explore'; // explore | battle | cleared
    this.battleMonster = null;
    this.battleMonsterHp = 0;
    this.battleFlashT = 0;
    this.battleDmgTimer = 1.5;

    // Graphics layers
    this.mapGfx  = this.add.graphics();
    this.charGfx = this.add.graphics();
    this.hpGfx   = this.add.graphics();
    this.floatTexts = [];

    // Title
    this.add.text(CANVAS_W / 2, 24, `🏚️ ダンジョン (フロア${this.floorNum})`, {
      fontSize: '16px', color: '#ffd700', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Exit button (bottom)
    const exitBtn = this.add.text(CANVAS_W / 2, CANVAS_H - 20, '[ 退出する ]', {
      fontSize: '13px', color: '#ff8888', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    exitBtn.on('pointerdown', () => this._exitDungeon(false));

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
    }
    this._drawAll();
    this._updateFloats(dt);
  }

  // =========================================================
  //  ROOM GENERATION
  // =========================================================
  _generateRooms() {
    const gs = window.gameState;
    const rooms = [];
    const bossCol = DCOLS - 1;
    const bossRow = 0;

    for (let r = 0; r < DROWS; r++) {
      for (let c = 0; c < DCOLS; c++) {
        const isBoss = c === bossCol && r === bossRow;
        const isEmpty = Math.random() < 0.15 && !isBoss;
        let monster = null;

        if (!isEmpty) {
          const isForcedRare = isBoss || (c === DCOLS - 1);
          const base = isForcedRare
            ? this._pickRareMonster(gs.journey.area)
            : D.pickMonster(gs.journey.area, gs.guild?.id);
          monster = gs.scaleMonster({
            ...base,
            hp: Math.floor(base.hp * (1 + this.floorNum * 0.1)),
            atk: Math.floor(base.atk * (1 + this.floorNum * 0.08)),
          });
        }

        rooms.push({
          col: c, row: r,
          isBoss,
          monster,
          cleared: false,
          // connections
          right: c < DCOLS - 1,
          down:  r < DROWS - 1,
          up:    r > 0,
          left:  c > 0,
        });
      }
    }
    return rooms;
  }

  _pickRareMonster(area) {
    const rareMonsters = Object.values(D.MONSTERS).filter(m =>
      (m.rarity === 'rare' || m.rarity === 'legendary') &&
      (!m.areas || m.areas.includes(area))
    );
    if (rareMonsters.length === 0) {
      return Object.values(D.MONSTERS).filter(m => m.rarity === 'rare')[0];
    }
    return rareMonsters[Math.floor(Math.random() * rareMonsters.length)];
  }

  _getRoom(col, row) {
    return this.rooms.find(r => r.col === col && r.row === row);
  }

  _currentRoom() {
    return this._getRoom(this.playerCell.col, this.playerCell.row);
  }

  // =========================================================
  //  ROOM LOGIC
  // =========================================================
  _enterRoom() {
    const room = this._currentRoom();
    if (!room) return;

    if (room.cleared || !room.monster) {
      // Empty / already cleared
      this.state = 'explore';
      this._showMoveButtons();
    } else {
      // Start battle
      this.state = 'battle';
      this.battleMonster = room.monster;
      this.battleMonsterHp = room.monster.hp;
      this.battleDmgTimer = 1.5;
      const gs = window.gameState;
      gs.addLog(`⚔️ ${room.monster.name}が待ち構えていた！`);
      this._hideMoveButtons();
    }
  }

  _showMoveButtons() {
    const room = this._currentRoom();
    if (!room) return;

    // Check if all rooms cleared
    if (this.rooms.every(r => r.cleared || !r.monster)) {
      this._allClear();
      return;
    }

    this._clearMoveButtons();
    const dirs = [
      { label: '→', col: 1,  row: 0,  x: CANVAS_W / 2 + 80, y: CANVAS_H - 52 },
      { label: '←', col: -1, row: 0,  x: CANVAS_W / 2 - 80, y: CANVAS_H - 52 },
      { label: '↑', col: 0,  row: -1, x: CANVAS_W / 2,       y: CANVAS_H - 80 },
      { label: '↓', col: 0,  row: 1,  x: CANVAS_W / 2,       y: CANVAS_H - 28 },
    ];

    this.moveButtons = [];
    for (const d of dirs) {
      const nc = this.playerCell.col + d.col;
      const nr = this.playerCell.row + d.row;
      if (nc < 0 || nc >= DCOLS || nr < 0 || nr >= DROWS) continue;

      const btn = this.add.text(d.x, d.y, d.label, {
        fontSize: '20px', color: '#ffd700', stroke: '#000', strokeThickness: 3,
        backgroundColor: '#1a1a3a', padding: { x: 10, y: 4 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.playerCell.col = nc;
        this.playerCell.row = nr;
        this._clearMoveButtons();
        this._enterRoom();
      });
      this.moveButtons.push(btn);
    }
  }

  _hideMoveButtons() {
    this._clearMoveButtons();
  }

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

    // Player attacks
    const pDmg = Math.max(1, pStats.atk - m.def);
    this.battleMonsterHp -= pDmg;
    this._addFloat(CANVAS_W / 2 + 80, CANVAS_H / 2 - 40, `-${pDmg}`, '#ff4444');

    // Monster attacks
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

    // Drop (higher chance in dungeon)
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

    if (room.isBoss) {
      gs.addLog(`👑 ダンジョンボスを討伐！`, 'legendary');
    }

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
    // Bonus reward
    const bonusExp = 500 * this.floorNum;
    const bonusGold = 200 * this.floorNum;
    gs.gainExp(bonusExp);
    gs.gainGold(bonusGold);
    gs.addLog(`✨ 踏破ボーナス: EXP+${bonusExp} Gold+${bonusGold}`, 'success');

    // Guaranteed rare drop
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

    // Background
    g.fillStyle(0x050510, 1);
    g.fillRect(0, 44, CANVAS_W, CANVAS_H - 44);

    // Rooms
    for (const room of this.rooms) {
      this._drawRoom(g, room);
    }

    // Characters
    const cg = this.charGfx;
    cg.clear();
    this._drawDungeonChars(cg);

    // HP bars
    const hg = this.hpGfx;
    hg.clear();
    if (this.state === 'battle') {
      this._drawDungeonHpBars(hg);
    }
  }

  _drawRoom(g, room) {
    const x = DOFF_X + room.col * DCELL;
    const y = DOFF_Y + room.row * DCELL;

    let fillCol = 0x101020;
    if (room.col === this.playerCell.col && room.row === this.playerCell.row) {
      fillCol = 0x1a1a40;
    } else if (room.cleared || !room.monster) {
      fillCol = 0x0a180a;
    } else if (room.isBoss) {
      fillCol = 0x200010;
    }

    g.fillStyle(fillCol, 1);
    g.fillRect(x + 2, y + 2, DCELL - 4, DCELL - 4);
    g.lineStyle(1, room.isBoss ? 0xaa2244 : 0x2a2a4a, 1);
    g.strokeRect(x + 2, y + 2, DCELL - 4, DCELL - 4);

    // Icon
    if (!room.cleared && room.monster) {
      const cx = x + DCELL / 2;
      const cy = y + DCELL / 2;
      g.fillStyle(room.isBoss ? 0xaa2244 : (room.monster.color || 0x884444), 1);
      g.fillCircle(cx, cy, room.isBoss ? 12 : 8);

      if (room.isBoss) {
        g.fillStyle(0xffd700, 1);
        g.fillTriangle(cx - 8, cy + 6, cx, cy - 10, cx + 8, cy + 6);
      }
    } else if (room.cleared || !room.monster) {
      g.fillStyle(0x224422, 0.5);
      g.fillRect(x + DCELL / 2 - 6, y + DCELL / 2 - 6, 12, 12);
    }

    // Player marker
    if (room.col === this.playerCell.col && room.row === this.playerCell.row) {
      g.fillStyle(0x4488ff, 1);
      g.fillCircle(x + 12, y + 12, 5);
    }
  }

  _drawDungeonChars(g) {
    if (this.state !== 'battle' || !this.battleMonster) return;

    const cx = CANVAS_W / 2;
    const by = CANVAS_H - 140;

    // Player
    g.fillStyle(0x5566ff, 1);
    g.fillCircle(cx - 90, by - 20, 10);
    g.fillRect(cx - 99, by - 10, 18, 22);
    g.fillRect(cx - 99, by + 12, 7, 14);
    g.fillRect(cx - 90, by + 12, 7, 14);

    // Monster
    const flash = this.state === 'battle' && Math.sin(this.battleFlashT) < -0.5;
    g.fillStyle(flash ? 0xffffff : (this.battleMonster.color || 0xcc2222), 1);
    g.fillCircle(cx + 90, by - 20, 14);
    g.fillRect(cx + 76, by - 6, 28, 25);

    // VS text
    this.charGfx.fillStyle ? null : null;
  }

  _drawDungeonHpBars(g) {
    const gs = window.gameState;
    const stats = gs.getStats();
    const cx = CANVAS_W / 2;
    const by = CANVAS_H - 160;

    // Player HP
    const pPct = gs.player.hp / stats.maxHp;
    g.fillStyle(0x220000, 1);
    g.fillRect(cx - 160, by, 100, 8);
    g.fillStyle(0xcc2222, 1);
    g.fillRect(cx - 160, by, Math.floor(100 * pPct), 8);

    // Monster HP
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
