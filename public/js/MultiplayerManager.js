'use strict';

class MultiplayerManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.passphrase = null;
    this.isHost = false;
    this.partnerState = null;
    this.onPartnerJoined = null;
    this.onPartnerLeft = null;
    this.onPartnerSync = null;
  }

  connect() {
    if (this.socket) return;
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('joinSuccess', ({ isHost, passphrase }) => {
      this.connected = true;
      this.isHost = isHost;
      this.passphrase = passphrase;
      window.gameState.addLog(`🌐 合言葉「${passphrase}」で${isHost ? '部屋を作成' : '参加'}しました`, 'success');
      updateMultiUI();
    });

    this.socket.on('joinError', (msg) => {
      alert('マルチプレイエラー: ' + msg);
    });

    this.socket.on('partnerJoined', ({ playerId, playerName }) => {
      window.gameState.addLog(`👥 パートナー「${playerName || '旅人'}」が仲間になった！`, 'success');
      updateMultiUI();
      if (this.onPartnerJoined) this.onPartnerJoined(playerId, playerName);
    });

    this.socket.on('partnerLeft', ({ playerId }) => {
      this.partnerState = null;
      window.gameState.addLog(`👋 パートナーが旅立った...`, 'danger');
      updateMultiUI();
      if (this.onPartnerLeft) this.onPartnerLeft(playerId);
    });

    this.socket.on('partnerSync', ({ state }) => {
      this.partnerState = state;
      if (this.onPartnerSync) this.onPartnerSync(state);
      updatePartnerDisplay(state);
    });

    this.socket.on('sharedEvent', ({ type, data }) => {
      if (type === 'boss_defeated') {
        window.gameState.addLog(`🎉 パートナーが魔王を倒した！`, 'legendary');
      }
    });

    this.socket.on('leftRoom', () => {
      this.connected = false;
      this.passphrase = null;
      this.partnerState = null;
      updateMultiUI();
    });
  }

  joinRoom(passphrase) {
    if (!this.socket) this.connect();
    const gs = window.gameState;
    this.socket.emit('joinRoom', {
      passphrase: passphrase.trim(),
      playerName: gs.player.name,
    });
  }

  leaveRoom() {
    if (this.socket && this.connected) {
      this.socket.emit('leaveRoom');
    }
  }

  sendSync() {
    if (!this.socket || !this.connected) return;
    const gs = window.gameState;
    const stats = gs.getStats();
    this.socket.emit('partnerSync', {
      name: gs.player.name,
      level: gs.player.level,
      hp: gs.player.hp,
      maxHp: stats.maxHp,
      atk: stats.atk,
      def: stats.def,
      area: gs.journey.area,
      guild: gs.guild?.id || null,
    });
  }

  sendSharedEvent(type, data = {}) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('sharedEvent', { type, data });
  }
}

window.multiManager = new MultiplayerManager();

// ===== Multi UI helpers =====
function updateMultiUI() {
  const mm = window.multiManager;
  const statusEl = document.getElementById('multi-status-text');
  const joinBtn = document.getElementById('join-btn');
  const leaveBtn = document.getElementById('leave-btn');
  const partnerArea = document.getElementById('partner-area');

  if (mm.connected) {
    statusEl.className = 'multi-status online';
    statusEl.textContent = `● 接続中 (${mm.passphrase})`;
    joinBtn.style.display = 'none';
    leaveBtn.style.display = 'block';
    document.getElementById('passphrase-input').style.display = 'none';
    partnerArea.style.display = mm.partnerState ? 'block' : 'none';
  } else {
    statusEl.className = 'multi-status offline';
    statusEl.textContent = '● オフライン';
    joinBtn.style.display = 'block';
    leaveBtn.style.display = 'none';
    document.getElementById('passphrase-input').style.display = 'block';
    partnerArea.style.display = 'none';
  }
}

function updatePartnerDisplay(state) {
  const el = document.getElementById('partner-info');
  const area = document.getElementById('partner-area');
  if (!el || !state) return;
  area.style.display = 'block';
  const guildInfo = state.guild ? (D.GUILDS[state.guild]?.name || '') : '未所属';
  const hpPct = Math.round((state.hp / state.maxHp) * 100);
  el.innerHTML = `
    <div style="color:#ffd700;font-weight:bold">${state.name} Lv.${state.level}</div>
    <div style="font-size:11px;color:#888">⚔️${state.atk} 🛡️${state.def} | ${D.getArea(0).name}</div>
    <div style="font-size:11px;color:#888">${guildInfo}</div>
    <div style="margin-top:4px">
      <div style="font-size:10px;color:#888">HP ${state.hp}/${state.maxHp}</div>
      <div style="background:#1a1a2a;border-radius:3px;height:6px;overflow:hidden;margin-top:2px">
        <div style="background:#cc4444;width:${hpPct}%;height:100%"></div>
      </div>
    </div>
  `;
}
