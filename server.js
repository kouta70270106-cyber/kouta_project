const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.json({ limit: '128kb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ===== セーブデータ API =====
// token -> saveData (in-memory)
const saves = new Map();

// 起動時にファイルから復元（デプロイ間以外の再起動に対応）
const SAVE_FILE = path.join(__dirname, 'saves.json');
try {
  if (fs.existsSync(SAVE_FILE)) {
    const loaded = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
    for (const [k, v] of Object.entries(loaded)) saves.set(k, v);
    console.log(`セーブ復元: ${saves.size}件`);
  }
} catch(e) { console.warn('セーブファイル読み込み失敗:', e.message); }

// 60秒ごとにファイルへ書き出し
setInterval(() => {
  try {
    const obj = Object.fromEntries(saves);
    fs.writeFileSync(SAVE_FILE, JSON.stringify(obj));
  } catch(e) { /* ignore */ }
}, 60_000);

const TOKEN_RE = /^[a-f0-9]{16}$/;

app.get('/api/save/:token', (req, res) => {
  if (!TOKEN_RE.test(req.params.token)) return res.status(400).json({ error: 'invalid token' });
  const data = saves.get(req.params.token);
  if (!data) return res.status(404).json({ error: 'not found' });
  res.json({ save: data });
});

app.post('/api/save/:token', (req, res) => {
  if (!TOKEN_RE.test(req.params.token)) return res.status(400).json({ error: 'invalid token' });
  const { save } = req.body;
  if (!save || typeof save !== 'object') return res.status(400).json({ error: 'no save data' });
  saves.set(req.params.token, save);
  res.json({ ok: true });
});

// rooms: Map<passphrase, { players: [socketId], host: socketId }>
const rooms = new Map();

function leaveRoom(socket) {
  const room = socket.currentRoom;
  if (!room) return;
  const data = rooms.get(room);
  if (data) {
    data.players = data.players.filter(id => id !== socket.id);
    if (data.players.length === 0) {
      rooms.delete(room);
    } else {
      socket.to(room).emit('partnerLeft', { playerId: socket.id });
      if (data.host === socket.id) {
        data.host = data.players[0];
        io.to(room).emit('hostChanged', { newHost: data.host });
      }
    }
  }
  socket.leave(room);
  socket.currentRoom = null;
}

io.on('connection', (socket) => {
  console.log('接続:', socket.id);

  socket.on('joinRoom', ({ passphrase, playerName }) => {
    if (!passphrase || passphrase.trim() === '') {
      socket.emit('joinError', '合言葉を入力してください');
      return;
    }

    if (socket.currentRoom) leaveRoom(socket);

    const key = passphrase.trim().toLowerCase();
    socket.currentRoom = key;
    socket.join(key);

    if (!rooms.has(key)) {
      rooms.set(key, { players: [socket.id], host: socket.id });
      socket.emit('joinSuccess', { isHost: true, passphrase: key });
      console.log(`部屋作成: ${key}`);
    } else {
      const room = rooms.get(key);
      if (room.players.length >= 2) {
        socket.emit('joinError', '部屋が満員です（最大2人）');
        socket.leave(key);
        socket.currentRoom = null;
        return;
      }
      room.players.push(socket.id);
      socket.emit('joinSuccess', { isHost: false, passphrase: key });
      socket.to(key).emit('partnerJoined', { playerId: socket.id, playerName });
      console.log(`部屋参加: ${key}`);
    }
  });

  socket.on('leaveRoom', () => {
    leaveRoom(socket);
    socket.emit('leftRoom');
  });

  // Sync partner's game state for display only
  socket.on('partnerSync', (data) => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('partnerSync', { ...data, fromId: socket.id });
    }
  });

  // Shared events (boss defeat, dungeon clear, etc.)
  socket.on('sharedEvent', (data) => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('sharedEvent', { ...data, fromId: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log('切断:', socket.id);
    leaveRoom(socket);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
