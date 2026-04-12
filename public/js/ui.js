'use strict';

// ============================================================
//  Main UI update (called every game tick)
// ============================================================
function updateUI() {
  const gs = window.gameState;
  const stats = gs.getStats();
  const p = gs.player;

  // Top HUD
  document.getElementById('player-name-hud').textContent = p.name;
  document.getElementById('player-level-hud').textContent = `Lv.${p.level}`;

  const hpPct = Math.round((p.hp / stats.maxHp) * 100);
  document.getElementById('hp-bar').style.width = hpPct + '%';
  document.getElementById('hp-text').textContent = `${p.hp}/${stats.maxHp}`;

  const expPct = Math.round((p.exp / p.expToNext) * 100);
  document.getElementById('exp-bar').style.width = expPct + '%';
  document.getElementById('exp-text').textContent = `${p.exp}/${p.expToNext}`;

  const gt = gs.gameTime;
  document.getElementById('day-display').textContent = `Day ${gt.day}`;
  document.getElementById('month-display').textContent = `月 ${gt.month}`;
  const daysLeft = 10 - gt.day + 1;
  document.getElementById('boss-timer-display').textContent = `${daysLeft}日後`;

  document.getElementById('atk-display').textContent = stats.atk;
  document.getElementById('def-display').textContent = stats.def;
  document.getElementById('gold-display').textContent = p.gold.toLocaleString();
  document.getElementById('area-display').textContent = D.getArea(gs.journey.distance).name;

  // Update active tab content
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  switch (activeTab) {
    case 'equipment': updateEquipmentTab(); break;
    case 'inventory': updateInventoryTab(); break;
    case 'quests': updateQuestsTab(); break;
    case 'guild': updateGuildTab(); break;
  }

  // Battle log
  updateBattleLog();
}

// ============================================================
//  Equipment Tab
// ============================================================
function updateEquipmentTab() {
  const gs = window.gameState;
  const eq = gs.player.equipment;
  const stats = gs.getStats();

  const fmt = item => item ? `<span class="rarity-${item.rarity}">${item.icon || ''} ${item.name}</span>` : '<span style="color:#444">なし</span>';
  document.getElementById('eq-weapon').innerHTML = fmt(eq.weapon);
  document.getElementById('eq-armor').innerHTML = fmt(eq.armor);
  document.getElementById('eq-accessory').innerHTML = fmt(eq.accessory);

  const det = document.getElementById('stats-detail');
  det.innerHTML = `
    <div class="stat-row">ATK<span>${gs.player.baseAtk} <small style="color:#666">(+${stats.atk - gs.player.baseAtk})</small></span></div>
    <div class="stat-row">DEF<span>${gs.player.baseDef} <small style="color:#666">(+${stats.def - gs.player.baseDef})</small></span></div>
    <div class="stat-row">HP<span>${gs.player.maxHp} <small style="color:#666">(+${stats.maxHp - gs.player.maxHp})</small></span></div>
    <div class="stat-row">討伐数<span>${gs.stats.monstersKilled}</span></div>
    <div class="stat-row">ダンジョン<span>${gs.stats.dungeonsCleared}</span></div>
    <div class="stat-row">クエスト<span>${gs.stats.questsCompleted}</span></div>
    <div class="stat-row">ボス撃破<span>${gs.stats.bossesDefeated}</span></div>
    <div class="stat-row">旅の距離<span>${gs.stats.distTraveled.toLocaleString()}</span></div>
  `;
}

// ============================================================
//  Inventory Tab
// ============================================================
function updateInventoryTab() {
  const gs = window.gameState;
  document.getElementById('inv-count').textContent = `(${gs.inventory.length}/20)`;

  const list = document.getElementById('inventory-list');
  if (gs.inventory.length === 0) {
    list.innerHTML = '<div style="color:#444;font-size:12px;text-align:center;padding:10px">アイテムなし</div>';
    return;
  }

  list.innerHTML = gs.inventory.map(item => {
    const isEquipped = Object.values(gs.player.equipment).some(e => e && e.uid === item.uid);
    const stats = [];
    if (item.atk) stats.push(`ATK+${item.atk}`);
    if (item.def) stats.push(`DEF+${item.def}`);
    if (item.hp) stats.push(`HP+${item.hp}`);

    return `<div class="inv-item" onclick="openItemDetail('${item.uid}')">
      <span class="inv-item-type">${item.icon || ''}</span>
      <div style="flex:1">
        <div class="inv-item-name rarity-${item.rarity}">${item.name}${isEquipped ? ' <span style="color:#666;font-size:10px">[装備中]</span>' : ''}</div>
        <div style="font-size:10px;color:#666">${stats.join(' / ')}</div>
      </div>
    </div>`;
  }).join('');
}

function openItemDetail(uid) {
  const gs = window.gameState;
  const item = gs.inventory.find(i => i.uid == uid);
  if (!item) return;

  const isEquipped = gs.player.equipment[item.type]?.uid === item.uid;
  const stats = [];
  if (item.atk) stats.push(`⚔️ ATK +${item.atk}`);
  if (item.def) stats.push(`🛡️ DEF +${item.def}`);
  if (item.hp) stats.push(`❤️ HP ${item.hp > 0 ? '+' : ''}${item.hp}`);

  const el = document.getElementById('item-modal-content');
  el.innerHTML = `
    <div style="font-size:16px;margin-bottom:8px" class="rarity-${item.rarity}">${item.icon || ''} ${item.name}</div>
    <div style="color:#888;font-size:11px;margin-bottom:8px">レアリティ: ${item.rarity} | 種別: ${item.type}</div>
    <div style="margin-bottom:12px">${stats.join('<br>')}</div>
    ${!isEquipped ? `<button class="btn btn-gold" onclick="equipFromModal('${uid}')">装備する</button>` : '<div style="color:#44ff88">装備中</div>'}
    <button class="btn btn-danger" onclick="dropItem('${uid}')" style="margin-top:4px">捨てる</button>
  `;
  document.getElementById('item-modal').style.display = 'flex';
}

function equipFromModal(uid) {
  const gs = window.gameState;
  const item = gs.inventory.find(i => i.uid == uid);
  if (item) {
    gs.equip(item);
    document.getElementById('item-modal').style.display = 'none';
    updateUI();
  }
}

function dropItem(uid) {
  const gs = window.gameState;
  const idx = gs.inventory.findIndex(i => i.uid == uid);
  if (idx >= 0) {
    const item = gs.inventory[idx];
    // Unequip if equipped
    if (gs.player.equipment[item.type]?.uid === item.uid) {
      gs.player.equipment[item.type] = null;
    }
    gs.inventory.splice(idx, 1);
    gs.addLog(`🗑️ ${item.name}を捨てた`);
    document.getElementById('item-modal').style.display = 'none';
    updateUI();
  }
}

// ============================================================
//  Quests Tab
// ============================================================
function updateQuestsTab() {
  const gs = window.gameState;
  const active = document.getElementById('quest-active');
  const completed = document.getElementById('quest-completed');

  if (gs.quests.active.length === 0) {
    active.innerHTML = '<div style="color:#444;font-size:12px;padding:6px">受注中の依頼なし</div>';
  } else {
    active.innerHTML = gs.quests.active.map(q => `
      <div class="quest-card">
        <div class="quest-title">${q.title}</div>
        <div class="quest-desc">${q.desc}</div>
        <div class="quest-progress">進捗: ${q.progress}/${q.required}</div>
        <div class="quest-reward">報酬: EXP+${q.reward.exp} 💰+${q.reward.gold}</div>
      </div>
    `).join('');
  }

  const recent = gs.quests.completed.slice(-5).reverse();
  if (recent.length === 0) {
    completed.innerHTML = '<div style="color:#444;font-size:12px;padding:6px">完了した依頼なし</div>';
  } else {
    completed.innerHTML = recent.map(q => `
      <div class="quest-card quest-done">
        <div class="quest-title">✅ ${q.title}</div>
        <div class="quest-reward">+${q.reward.exp}EXP +${q.reward.gold}G</div>
      </div>
    `).join('');
  }
}

// ============================================================
//  Guild Tab
// ============================================================
function updateGuildTab() {
  const gs = window.gameState;
  const guild = gs.guild;

  const nameEl = document.getElementById('guild-display-name');
  const bonusEl = document.getElementById('guild-bonus-text');
  const descEl  = document.getElementById('guild-desc-text');

  if (guild) {
    const gData = D.GUILDS[guild.id];
    nameEl.textContent = gData?.name || guild.name;
    nameEl.style.color = gData?.color || '#ffd700';
    bonusEl.textContent = gData?.bonusText || '';
    descEl.textContent = gData?.desc || '';
  } else {
    nameEl.textContent = '未所属';
    nameEl.style.color = '#666';
    bonusEl.textContent = '';
    descEl.textContent = '';
  }

  const statsEl = document.getElementById('guild-stats');
  statsEl.innerHTML = `
    <div class="guild-stat-row">討伐数<span>${gs.stats.monstersKilled}</span></div>
    <div class="guild-stat-row">ダンジョン踏破<span>${gs.stats.dungeonsCleared}</span></div>
    <div class="guild-stat-row">クエスト完了<span>${gs.stats.questsCompleted}</span></div>
    <div class="guild-stat-row">魔王討伐<span>${gs.stats.bossesDefeated}</span></div>
  `;
}

// ============================================================
//  Battle Log
// ============================================================
function updateBattleLog() {
  const gs = window.gameState;
  const container = document.getElementById('log-inner');
  const entries = gs.log.slice(0, 40);

  container.innerHTML = entries.map(e => {
    const cls = e.type ? ` ${e.type}` : '';
    return `<div class="log-entry${cls}">${e.msg}</div>`;
  }).join('');
}

// ============================================================
//  Guild Modal
// ============================================================
function showGuildModal(callback, isMonthReset = false) {
  const modal = document.getElementById('guild-modal');
  modal.style.display = 'flex';

  const choicesEl = document.getElementById('guild-choices');
  choicesEl.innerHTML = '';

  const gs = window.gameState;

  Object.values(D.GUILDS).forEach(guild => {
    const card = document.createElement('div');
    card.className = `guild-choice-card ${guild.id}`;
    card.innerHTML = `
      <div class="guild-card-title">${guild.name}</div>
      <div class="guild-card-desc">${guild.desc}</div>
      <div class="guild-card-bonus">${guild.bonusText}</div>
    `;
    card.addEventListener('click', () => {
      gs.guild = { id: guild.id, name: guild.name };
      gs.addLog(`⚜️ ${guild.name}に参加した！`, 'success');
      modal.style.display = 'none';
      updateUI();
      if (callback) callback();
    });
    choicesEl.appendChild(card);
  });

  // If it's a monthly reset, update title
  const title = modal.querySelector('.modal-title');
  if (title) {
    title.textContent = isMonthReset
      ? `⚜️ 月の初め — ギルド選択 (月${gs.gameTime.month})`
      : '⚜️ ギルド選択';
  }
}

// ============================================================
//  Item Modal (for drops)
// ============================================================
function showItemModal(item) {
  const stats = [];
  if (item.atk) stats.push(`⚔️ ATK +${item.atk}`);
  if (item.def) stats.push(`🛡️ DEF +${item.def}`);
  if (item.hp) stats.push(`❤️ HP ${item.hp > 0 ? '+' : ''}${item.hp}`);

  document.getElementById('item-modal-content').innerHTML = `
    <div style="font-size:16px;margin-bottom:8px" class="rarity-${item.rarity}">${item.icon || ''} ${item.name}</div>
    <div style="color:#888;font-size:11px;margin-bottom:8px">レアリティ: <span class="rarity-${item.rarity}">${item.rarity}</span></div>
    <div style="margin-bottom:12px">${stats.join('<br>') || 'ステータスなし'}</div>
    <div style="color:#44ff88;font-size:12px">荷物に追加されました！</div>
  `;
  document.getElementById('item-modal').style.display = 'flex';
  // Auto-close after 3s
  setTimeout(() => {
    if (document.getElementById('item-modal').style.display !== 'none') {
      document.getElementById('item-modal').style.display = 'none';
    }
  }, 3000);
}

// ============================================================
//  Tab switching
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabId = 'tab-' + btn.dataset.tab;
      document.getElementById(tabId)?.classList.add('active');
      updateUI();
    });
  });

  // Multiplayer buttons
  document.getElementById('join-btn')?.addEventListener('click', () => {
    const phrase = document.getElementById('passphrase-input').value.trim();
    if (!phrase) { alert('合言葉を入力してください'); return; }
    window.multiManager.joinRoom(phrase);
  });

  document.getElementById('leave-btn')?.addEventListener('click', () => {
    window.multiManager.leaveRoom();
  });

  document.getElementById('passphrase-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('join-btn')?.click();
  });
});
