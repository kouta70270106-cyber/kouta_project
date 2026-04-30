# モンスター設計ルール・バランス表

## レアリティ別スポーン重み

| レアリティ | 重み | 説明 |
|-----------|------|------|
| common | 60 | 草原・森など序盤エリアに多数 |
| uncommon | 25 | 中盤エリア、少し強い |
| rare | 12 | ドロップあり、強敵 |
| legendary | 3 | 超低確率。特殊モンスター含む |

## スケーリング式

通常モンスター: `hp/atk/def × (1 + (playerLevel - 1) × 0.12)`
`noScale: true` のモンスターはスケールしない（黄金・白銀スライム等）

## EXP倍率（レアリティ別）

| レアリティ | 倍率 |
|-----------|------|
| common | ×1 |
| uncommon | ×2 |
| rare | ×5 |
| legendary | ×15 |

## 特殊モンスター

### 黄金のスライム王 (gold_slime)
- HP:50 ATK:3 DEF:80 EXP:50 GOLD:[2000,5000]
- noScale:true, spawnWeight:4（約0.5%出現）
- 目的: ゴールド大量獲得

### 白銀のスライム王 (silver_slime)
- HP:50 ATK:3 DEF:80 EXP:8000 GOLD:[5,20]
- noScale:true, spawnWeight:4（約0.5%出現）
- 目的: 経験値大量獲得

## ドロップ設計

| 条件 | ドロップ率 |
|------|-----------|
| 通常 | 12% |
| rare | +15% |
| legendary | +30% |
| 盗賊ギルド所属 | +15% |
| ダンジョン内 | +25%（基本値） |

## 討伐記録

- `gs.stats.killCount[monsterId]` でゲーム内カウント
- `localStorage['bestiary.defeatedMonsterIds']` でGitHub Pagesの図鑑と共有

## バランス指針

- Lv1プレイヤーがスライムに5〜10秒で勝てる程度の序盤調整
- ボスはLv10以上で勝率50%程度を目安に設計
- 凸システム: 1凸=+10%、5凸=+50% のステータス補正
