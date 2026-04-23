# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

```bash
npm start        # 本番起動 (node server.js)
npm run dev      # 開発起動 (nodemon、ファイル変更で自動再起動)
```

ローカル確認: http://localhost:3000

デプロイ先は2つ:
- **ゲーム本体**: Render.com (`master` ブランチへ push → 自動デプロイ)
- **登録ページ/静的ページ**: GitHub Pages (`gh-pages` ブランチ)

## アーキテクチャ

### サーバー (`server.js`)
Express + Socket.io。`public/` を静的配信するだけ。ゲームロジックはすべてクライアント側。Socket.io はマルチプレイ用の部屋管理（最大2人）と状態同期のみ。

### クライアント (`public/`)

**スクリプト読み込み順（index.html）:**
```
sprites.js → data.js → GameState.js → MultiplayerManager.js
→ BootScene.js → JourneyScene.js → DungeonScene.js → BossScene.js
→ ui.js → main.js
```

**`data.js` — グローバル定数 `D`**
ゲームの全マスターデータ（エリア・モンスター・装備・ギルド・クエスト・ボス）を保持する読み取り専用オブジェクト。新しいコンテンツはここに追加する。

**`GameState.js` — グローバル `window.gameState`**
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

**Phaser シーン構成:**
- `BootScene` — セーブデータ読み込み・名前入力モーダル・スプライト初期化。URLパラメータ `?name=&bio=` でギルド登録ページから連携。
- `JourneyScene` — メインループ。歩行・モンスター戦闘・NPC・ダンジョン入口。1秒ティック制。
- `DungeonScene` — ダンジョン探索（JourneyScene から launch して pause/resume）。
- `BossScene` — 月末ボス戦（同上）。

**`sprites.js` — `createGameSprites(scene)`**
HTML Canvas で DQ 風ピクセルアートテクスチャを生成し `scene.textures.addCanvas(key, canvas)` で登録。`PXSCALE = 3`（1グリッド = 3px）。

スプライトキー: `hero`, `ern`, `saria`, `npc`, `slime`, `goblin`, `skeleton`, `orc`, `bat`, `spider`, `dragon`

モンスター shape → sprite マッピング:
```js
const SHAPE_SPRITE = {
  blob:'slime', small:'goblin', human:'skeleton',
  large:'orc', quad:'dragon', fly:'bat', multi:'spider'
};
```

**`ui.js`** — HUD更新 (`updateUI()`)、タブ切り替え、モーダル表示 (`showItemModal`, `showGuildModal`)。`updateUI()` はゲームティックごとと戦闘終了時に呼ぶ。

## 世界観・カラーテーマ

**世界観:** 「永遠の旅人」— DQ（ドラゴンクエスト）風の放置系RPG。プレイヤーが仲間2人（エルン・サリア）と自動で旅を続け、モンスターを倒しレベルアップする。

**カラーパレット（CSS / Phaser 共通）:**
| 用途 | 色 |
|------|-----|
| 背景・暗色 | `#060d08`, `#0a1610` |
| ボーダー | `#1e3020` |
| ゴールド（タイトル・強調） | `#c0a850`, `#ffd700` |
| テキスト通常 | `#c8d4c0` |
| HP バー | `#2a7a38` → `#44aa55` |
| EXP バー | `#2a5870` → `#4a8090` |
| レアリティ: common | `#d4c8a8` |
| レアリティ: uncommon | `#44ff88` |
| レアリティ: rare | `#4488ff` |
| レアリティ: legendary | `#ffaa22` |

**背景（エリア別 Phaser グラデーション）:** `skyA`（上）→ `skyB`（下）。昼間の明るい DQ 風空。雲は白い楕円3重ね。遠景は `skyB` を明るくした丘（楕円）。

## GitHub Pages（静的ページ）

`gh-pages` ブランチで管理。ゲームとは独立した静的ファイル群。
- `index.html` — 冒険者ギルド登録ページ。登録後、ゲームURL（Render.com）に `?name=&bio=` パラメータを付けてリンク。
- 今後 `board.html` などのハブページを追加予定。

## レスポンシブ対応

`style.css` にメディアクエリあり:
- `≥ 900px`: グリッド2列（ゲーム + サイドパネル）
- `768〜900px`: タブレット（サイドパネル縮小）
- `≤ 767px`: スマホ（flex縦並び）
