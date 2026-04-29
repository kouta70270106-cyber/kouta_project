'use strict';

class GameState {
  constructor() {
    this.player = {
      name: '勇者',
      bio: '',
      level: 1,
      exp: 0,
      expToNext: 100,
      hp: 100,
      maxHp: 100,
      baseAtk: 10,
      baseDef: 5,
      gold: 0,
      equipment: { weapon: null, shield: null, armor: null, accessory: null, spellbook: null },
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
    this.partner = null;
    this.companions = D.COMPANIONS.map(c => ({
      id: c.id,
      hp: Math.floor(100 * c.hpRatio),
      downTimer: 0,
    }));
  }

  // ===== Stats with equipment =====
  getStats() {
    const p = this.player;
    let atk = p.baseAtk;
    let def = p.baseDef;
    let bonusHp = 0;

    const slots = ['weapon', 'shield', 'armor', 'accessory', 'spellbook'];
    for (const slot of slots) {
      const eq = p.equipment[slot];
      if (eq) {
        const mult = 1 + (eq.refine || 0) * 0.1;
        atk += Math.floor((eq.atk || 0) * mult);
        def += Math.floor((eq.def || 0) * mult);
        bonusHp += Math.floor((eq.hp || 0) * mult);
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
    for (let i = 0; i < this.companions.length; i++) {
      this.companions[i].hp = this.getCompanionMaxHp(i);
      this.companions[i].downTimer = 0;
    }
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
    // Check for existing item with same id → auto-refine
    const existing = this.inventory.find(i => i.id === item.id);
    if (existing) {
      const refine = existing.refine || 0;
      if (refine < 5) {
        existing.refine = refine + 1;
        this.addLog(`✨ ${item.name}を合成！ +${existing.refine} になった！`, 'success');
      } else {
        const sellGold = this._getSellPrice(item);
        this.gainGold(sellGold);
        this.addLog(`💰 ${item.name}(+5 MAX) を自動売却 💰+${sellGold}`, 'highlight');
      }
      return true;
    }

    if (this.inventory.length >= 20) {
      this.addLog(`🎒 荷物がいっぱいで${item.name}を拾えなかった...`, 'danger');
      return false;
    }
    const newItem = { ...item, uid: Date.now() + Math.random(), refine: 0 };
    this.inventory.push(newItem);

    // Auto-equip if slot is empty
    if (item.type && !this.player.equipment[item.type]) {
      this.equip(newItem);
    }
    return true;
  }

  _getSellPrice(item) {
    const shopEntry = D.SHOP.find(s => s.itemId === item.id);
    if (shopEntry) return Math.floor(shopEntry.price * 0.3);
    const byRarity = { common: 50, uncommon: 200, rare: 800, legendary: 3000 };
    return byRarity[item.rarity] || 100;
  }

  equip(item) {
    const slot = item.type;
    if (!['weapon','shield','armor','accessory','spellbook'].includes(slot)) return;
    const prev = this.player.equipment[slot];
    this.player.equipment[slot] = item;
    // recalculate HP bounds
    const stats = this.getStats();
    this.player.hp = Math.min(this.player.hp, stats.maxHp);
    this.addLog(`🔧 ${item.name}を装備した！`, 'success');
    return prev;
  }

  // ===== Shop =====
  buyItem(itemId) {
    const entry = D.SHOP.find(s => s.itemId === itemId);
    if (!entry) return { ok: false, msg: 'アイテムが見つかりません' };
    const def = D.EQUIPMENT[itemId];
    if (!def) return { ok: false, msg: 'アイテムデータがありません' };
    if (this.player.gold < entry.price) return { ok: false, msg: 'ゴールドが足りません' };

    const existing = this.inventory.find(i => i.id === itemId);
    if (!existing && this.inventory.length >= 20) return { ok: false, msg: '荷物がいっぱいです' };

    this.player.gold -= entry.price;

    if (existing) {
      const refine = existing.refine || 0;
      if (refine < 5) {
        existing.refine = refine + 1;
        return { ok: true, item: existing, refined: true };
      } else {
        const refund = Math.floor(entry.price * 0.3);
        this.gainGold(refund);
        return { ok: true, item: existing, maxRefine: true, refund };
      }
    }

    const item = { ...def, uid: Date.now() + Math.random(), refine: 0 };
    this.inventory.push(item);
    if (!this.player.equipment[item.type]) this.equip(item);
    return { ok: true, item };
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
    // noScale:true のモンスター（レアスライム等）はスケールしない
    if (base.noScale) return { ...base };
    const scale = 1 + (this.player.level - 1) * 0.12;
    return {
      ...base,
      hp: Math.floor(base.hp * scale),
      atk: Math.floor(base.atk * scale),
      def: Math.floor(base.def * scale),
    };
  }

  // ===== Companion helpers =====
  getCompanionMaxHp(i) {
    return Math.floor(this.getStats().maxHp * D.COMPANIONS[i].hpRatio);
  }

  getCompanionAtk(i) {
    return Math.max(1, Math.floor(this.getStats().atk * D.COMPANIONS[i].atkRatio));
  }

  // ===== HP Regen =====
  regenHp() {
    const stats = this.getStats();
    const maxHp = stats.maxHp;
    if (this.player.hp < maxHp) {
      this.player.hp = Math.min(maxHp, this.player.hp + Math.ceil(maxHp * 0.005));
    }
    for (let i = 0; i < this.companions.length; i++) {
      const c = this.companions[i];
      if (c.downTimer > 0) {
        c.downTimer--;
        if (c.downTimer === 0) {
          c.hp = Math.floor(this.getCompanionMaxHp(i) * 0.5);
          this.addLog(`💙 ${D.COMPANIONS[i].name}が戦線に復帰した！`, 'success');
        }
      } else {
        const cMax = this.getCompanionMaxHp(i);
        if (c.hp < cMax) c.hp = Math.min(cMax, c.hp + Math.ceil(cMax * 0.005));
      }
    }
  }

  // ===== Token =====
  _getOrCreateToken() {
    let t = localStorage.getItem('idle_rpg_token');
    if (!t || !/^[a-f0-9]{16}$/.test(t)) {
      t = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      localStorage.setItem('idle_rpg_token', t);
    }
    this.token = t;
    return t;
  }

  // ===== Save / Load =====
  save() {
    try {
      const token = this._getOrCreateToken();
      const data = {
        player: this.player,
        inventory: this.inventory,
        guild: this.guild,
        quests: this.quests,
        journey: this.journey,
        gameTime: this.gameTime,
        stats: this.stats,
        companions: this.companions,
      };
      localStorage.setItem('idle_rpg_save', JSON.stringify(data));
      // サーバーに非同期で同期（失敗しても無視）
      fetch(`/api/save/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ save: data }),
      }).catch(() => {});
    } catch(e) { /* ignore */ }
  }

  load() {
    try {
      const t = localStorage.getItem('idle_rpg_token');
      if (t) this.token = t;
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
      if (data.companions) this.companions = data.companions;
      return true;
    } catch(e) {
      return false;
    }
  }

  // サーバーからセーブデータを取得し localStorage に書き込む
  async loadFromServer(token) {
    try {
      const res = await fetch(`/api/save/${token}`);
      if (!res.ok) return false;
      const { save: data } = await res.json();
      localStorage.setItem('idle_rpg_save', JSON.stringify(data));
      localStorage.setItem('idle_rpg_token', token);
      this.token = token;
      return true;
    } catch(e) { return false; }
  }

  reset() {
    localStorage.removeItem('idle_rpg_save');
    location.reload();
  }
}

window.gameState = new GameState();
