# アーキテクチャ

## サーバー (`server.js`)

Express + Socket.io。`public/` を静的配信するだけ。ゲームロジックはすべてクライアント側。
Socket.io はマルチプレイ用の部屋管理（最大2人）と状態同期のみ。

## クライアント (`public/`)

### スクリプト読み込み順（index.html）

```
sprites.js → data.js → GameState.js → MultiplayerManager.js
→ BootScene.js → JourneyScene.js → DungeonScene.js → BossScene.js
→ ui.js → main.js
```

### `data.js` — グローバル定数 `D`

ゲームの全マスターデータ（エリア・モンスター・装備・ギルド・クエスト・ボス）を保持する読み取り専用オブジェクト。新しいコンテンツはここに追加する。

### `GameState.js` — グローバル `window.gameState`

プレイヤー状態の単一ソース。`save()`/`load()` で `localStorage` にJSON保存。保存キー: `idle_rpg_save`。

保存形式:
```json
{
  "player": { "name", "bio", "level", "exp", "expToNext", "hp", "maxHp", "baseAtk", "baseDef", "gold", "equipment" },
  "inventory": [],
  "guild": { "id", "name" },
  "quests": { "active": [], "completed": [] },
  "journey": { "distance", "area" },
  "gameTime": { "day", "month", "tick" },
  "stats": { "monstersKilled", "dungeonsCleared", "questsCompleted", "bossesDefeated", "killCount", "distTraveled" },
  "companions": [{ "id", "hp", "downTimer" }]
}
```

### Phaser シーン構成

- `BootScene` — セーブデータ読み込み・名前入力モーダル・スプライト初期化。URLパラメータ `?name=&bio=` でギルド登録ページから連携。
- `JourneyScene` — メインループ。歩行・モンスター戦闘・NPC・ダンジョン入口。1秒ティック制。
- `DungeonScene` — ダンジョン探索（JourneyScene から launch して pause/resume）。オート/手動切り替え可能。
- `BossScene` — 月末ボス戦（同上）。

### `sprites.js` — `createGameSprites(scene)`

HTML Canvas で DQ 風ピクセルアートテクスチャを生成し `scene.textures.addCanvas(key, canvas)` で登録。`PXSCALE = 3`（1グリッド = 3px）。

スプライトキー: `hero`, `ern`, `saria`, `npc`, `slime`, `goblin`, `skeleton`, `orc`, `bat`, `spider`, `dragon`, `gold_slime`, `silver_slime`

モンスター shape → sprite マッピング:
```js
const SHAPE_SPRITE = {
  blob:'slime', small:'goblin', human:'skeleton',
  large:'orc', quad:'dragon', fly:'bat', multi:'spider',
  gold_blob:'gold_slime', silver_blob:'silver_slime'
};
```

### `ui.js`

HUD更新 (`updateUI()`)、タブ切り替え、モーダル表示 (`showItemModal`, `showGuildModal`)。
`updateUI()` はゲームティックごとと戦闘終了時に呼ぶ。

### 装備・合成システム

- 装備には `refine` プロパティ（0〜5）。凸ごとにステータス +10%
- 同一IDのアイテムが重複入手 → 自動合成。5凸済みは自動売却
- `gs._getSellPrice(item)` でショップ定価の30%を算出

### localStorage キー一覧

| キー | 内容 |
|------|------|
| `idle_rpg_save` | メインセーブデータ（JSON） |
| `idle_rpg_token` | プレイヤー識別トークン（16桁hex） |
| `dungeon_auto` | ダンジョンオートモード設定 |
| `bestiary.defeatedMonsterIds` | 討伐済みモンスターID配列 |

## レスポンシブ対応

`style.css` にメディアクエリあり:
- `≥ 900px`: グリッド2列（ゲーム + サイドパネル）
- `768〜900px`: タブレット（サイドパネル縮小）
- `≤ 767px`: スマホ（flex縦並び）
