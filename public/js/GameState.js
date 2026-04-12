'use strict';

class GameState {
  constructor() {
    this.player = {
      name: '勇者',
      level: 1,
      exp: 0,
      expToNext: 100,
      hp: 100,
      maxHp: 100,
      baseAtk: 10,
      baseDef: 5,
      gold: 0,
      equipment: { weapon: null, armor: null, accessory: null },
    };
    this.inventory = [];   // max 20 items
    this.guild = null;     // { id, name, ... }
    this.quests = { active: [], completed: [] };
    this.journey = { distance: 0, area: 'plains' };
    this.gameTime = { day: 1, month: 1, tick: 0 };  // tick counts 1/sec
    this.stats = {
      monstersKilled: 0,
      dungeonsCleared: 0,
      questsCompleted: 0,
      bossesDefeated: 0,
      killCount: {},
      distTraveled: 0,
    };
    this.log = [];
    this.partner = null;  // multiplayer partner state
  }

  // ===== Stats with equipment =====
  getStats() {
    const p = this.player;
    let atk = p.baseAtk;
    let def = p.baseDef;
    let bonusHp = 0;

    const slots = ['weapon', 'armor', 'accessory'];
    for (const slot of slots) {
      const eq = p.equipment[slot];
      if (eq) {
        atk += eq.atk || 0;
        def += eq.def || 0;
        bonusHp += eq.hp || 0;
      }
    }

    // Guild bonuses
    if (this.guild) {
      const g = D.GUILDS[this.guild.id];
      if (g) {
        atk = Math.floor(atk * (1 + (g.bonus.atk || 0)));
        def = Math.floor(def * (1 + (g.bonus.def || 0)));
      }
    }

    return { atk, def, maxHp: p.maxHp + bonusHp };
  }

  // ===== EXP & Leveling =====
  gainExp(amount) {
    if (this.guild) {
      const g = D.GUILDS[this.guild.id];
      amount = Math.floor(amount * (1 + (g?.bonus?.exp || 0)));
    }
    this.player.exp += amount;
    while (this.player.exp >= this.player.expToNext) {
      this.player.exp -= this.player.expToNext;
      this._levelUp();
    }
    return amount;
  }

  _levelUp() {
    const p = this.player;
    p.level++;
    p.expToNext = Math.floor(100 * Math.pow(1.18, p.level - 1));
    p.maxHp = Math.floor(100 + (p.level - 1) * 15);
    p.hp = p.maxHp;
    p.baseAtk = Math.floor(10 + (p.level - 1) * 3);
    p.baseDef = Math.floor(5 + (p.level - 1) * 2);
    this.addLog(`🎉 レベルアップ！ Lv.${p.level} になった！`, 'highlight');
  }

  // ===== Gold =====
  gainGold(amount) {
    if (this.guild) {
      const g = D.GUILDS[this.guild.id];
      amount = Math.floor(amount * (1 + (g?.bonus?.gold || 0)));
    }
    this.player.gold += amount;
    return amount;
  }

  // ===== Inventory =====
  addItem(item) {
    if (this.inventory.length >= 20) {
      this.addLog(`🎒 荷物がいっぱいで${item.name}を拾えなかった...`, 'danger');
      return false;
    }
    this.inventory.push({ ...item, uid: Date.now() + Math.random() });

    // Auto-equip if slot is empty
    if (item.type && !this.player.equipment[item.type]) {
      this.equip(item);
    }
    return true;
  }

  equip(item) {
    const slot = item.type;
    if (!['weapon','armor','accessory'].includes(slot)) return;
    const prev = this.player.equipment[slot];
    this.player.equipment[slot] = item;
    // recalculate HP bounds
    const stats = this.getStats();
    this.player.hp = Math.min(this.player.hp, stats.maxHp);
    this.addLog(`🔧 ${item.name}を装備した！`, 'success');
    return prev;
  }

  // ===== Quests =====
  addQuest(quest) {
    if (this.quests.active.length >= 5) return false;
    if (this.quests.active.find(q => q.templateId === quest.templateId)) return false;
    this.quests.active.push(quest);
    this.addLog(`📜 新しい依頼「${quest.title}」を受けた！`, 'success');
    return true;
  }

  updateQuestProgress(monsterId, dist = 0) {
    let completed = [];
    for (const q of this.quests.active) {
      if (!q.done) {
        if (q.targetId === monsterId) q.progress++;
        if (q.targetId === '__dist__') q.progress += dist;
        if (q.progress >= q.required) {
          q.done = true;
          completed.push(q);
        }
      }
    }
    for (const q of completed) {
      this.quests.active = this.quests.active.filter(x => x.id !== q.id);
      this.quests.completed.push(q);
      this.gainExp(q.reward.exp);
      this.gainGold(q.reward.gold);
      this.stats.questsCompleted++;
      this.addLog(`✅ 依頼「${q.title}」完了！ EXP+${q.reward.exp} Gold+${q.reward.gold}`, 'success');
    }
  }

  // ===== Log =====
  addLog(msg, type = '') {
    this.log.unshift({ msg, type, time: Date.now() });
    if (this.log.length > 200) this.log.pop();
  }

  // ===== Monster scaling =====
  scaleMonster(base) {
    const scale = 1 + (this.player.level - 1) * 0.12;
    return {
      ...base,
      hp: Math.floor(base.hp * scale),
      atk: Math.floor(base.atk * scale),
      def: Math.floor(base.def * scale),
    };
  }

  // ===== HP Regen =====
  regenHp() {
    const stats = this.getStats();
    const maxHp = stats.maxHp;
    if (this.player.hp < maxHp) {
      this.player.hp = Math.min(maxHp, this.player.hp + Math.ceil(maxHp * 0.005));
    }
  }

  // ===== Save / Load =====
  save() {
    try {
      localStorage.setItem('idle_rpg_save', JSON.stringify({
        player: this.player,
        inventory: this.inventory,
        guild: this.guild,
        quests: this.quests,
        journey: this.journey,
        gameTime: this.gameTime,
        stats: this.stats,
      }));
    } catch(e) { /* ignore */ }
  }

  load() {
    try {
      const raw = localStorage.getItem('idle_rpg_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      Object.assign(this.player, data.player);
      this.inventory = data.inventory || [];
      this.guild = data.guild || null;
      this.quests = data.quests || { active: [], completed: [] };
      this.journey = data.journey || { distance: 0, area: 'plains' };
      this.gameTime = data.gameTime || { day: 1, month: 1, tick: 0 };
      this.stats = data.stats || this.stats;
      return true;
    } catch(e) {
      return false;
    }
  }

  reset() {
    localStorage.removeItem('idle_rpg_save');
    location.reload();
  }
}

window.gameState = new GameState();
