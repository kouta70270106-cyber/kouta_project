---
name: monster-stats
description: モンスターや敵キャラのステータスを設定・算出するとき
---

# Monster Stats Skill

モンスターや敵キャラのステータスを設定・追加・変更する際は、
`game-spec/mechanics.md` のバランス表に従って値を決定する。

## 参照先
- バランス表: `game-spec/mechanics.md`
- モンスターデータ: `public/js/data.js` の `D.MONSTERS`

## ステータス決定の手順

1. **レアリティを決める** — common / uncommon / rare / legendary
2. **出現エリアを決める** — `D.AREAS` の `id` から選ぶ
3. **バランス表の範囲内で値を設定する**

| レアリティ | baseHP | baseATK | baseDEF | EXP目安 |
|---|---|---|---|---|
| common | 15〜80 | 3〜12 | 1〜8 | 10〜45 |
| uncommon | 50〜160 | 13〜28 | 3〜20 | 60〜100 |
| rare | 200〜500 | 25〜50 | 15〜40 | 200〜400 |
| legendary | 50〜900 | 3〜100 | 30〜50 | 50〜1200 |

4. **ATK/DEFのトレードオフを守る** — 高ATKなら低DEF、高DEFなら低ATK
5. **EXPの目安** — `(baseHP + baseATK) / 2` を参考にする
6. **shapeを選ぶ** — blob / small / human / large / quad / fly / multi から形状に合ったものを選ぶ

## data.js への追加フォーマット

```js
monster_id: {
  id: 'monster_id',
  name: 'モンスター名',
  hp: 30,       // baseHP
  atk: 6,       // baseATK
  def: 3,       // baseDEF
  exp: 18,      // 基本EXP
  gold: [3, 8], // [min, max]
  rarity: 'common',
  types: ['beast'],
  areas: ['plains'],
  shape: 'small',
  color: 0xaabbcc,
  desc: '説明文',
},
```

## スケーリングの確認

追加後、プレイヤーLv20での強さを確認する:
```
scaledHP  = floor(baseHP  × (1 + 19 × 0.12)) = baseHP  × 3.28
scaledATK = floor(baseATK × (1 + 19 × 0.12)) = baseATK × 3.28
```
Lv20で戦うにあたり理不尽に強くないか・弱くないかを確認すること。
