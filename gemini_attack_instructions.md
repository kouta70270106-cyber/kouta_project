# 攻撃アニメーション 画像生成指示書

## 目的

主人公・エルン・サリアの攻撃モーションをコマ割りで実装するための画像を生成する。
各キャラ × 3フレーム = **合計9枚**。

---

## 重要：生成の手順

1. **既存の画像をGeminiに見せてから**プロンプトを送る
   - 例：「この画像のキャラクターを使って次のポーズを描いてください」
   - 既存画像：`public/images/characters/hero.png` / `ern.png` / `saria.png`

2. 1フレームずつ生成する（まとめて頼むとポーズがぶれる）

3. 生成した画像を以下のフォルダに保存：
   `C:\Users\kouta\work\kouta_project\public\images\characters\`

4. ファイル名を **正確に** 指示通りに変更して保存

5. 9枚揃ったら Claude に「揃いました」と伝える → コードを追加してもらう

---

## フレーム解説（全キャラ共通の流れ）

```
[atk1] 構え      →  [atk2] 振り      →  [atk3] フォロー
 剣を頭上に          弧の中間、          振り切った後、
 振り上げた状態       体が前傾き最大       剣が前方に伸びている
    ↑                   ↑                    ↑
  攻撃開始(0ms)       120ms後             220ms後
```

---

## 主人公（Hero）

> **事前準備：** Gemini に `hero.png` を見せてから以下を送る

### hero_atk1.png（構え）
```
This is a Dragon Quest style pixel art RPG character.
Please draw the SAME character in an attack windup pose:
- Holding sword with both hands raised high overhead, ready to strike
- Body leaning slightly backward, weight on back foot
- Facing right (toward the enemy)
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

### hero_atk2.png（振り）
```
This is a Dragon Quest style pixel art RPG character.
Please draw the SAME character mid-swing attack pose:
- Sword swinging down in a diagonal arc (upper-left to lower-right)
- Body leaning strongly forward, dynamic motion blur feeling
- Right arm fully extended with sword, facing right
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

### hero_atk3.png（フォロースルー）
```
This is a Dragon Quest style pixel art RPG character.
Please draw the SAME character in a follow-through pose after a sword swing:
- Sword pointing forward-downward, arm fully extended
- Body momentum still carrying forward, slightly crouched
- Facing right, triumphant finishing pose
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

---

## エルン（Ern）

> **事前準備：** Gemini に `ern.png` を見せてから以下を送る

### ern_atk1.png（構え）
```
This is a Dragon Quest style pixel art RPG warrior companion character.
Please draw the SAME character in an attack windup pose:
- Holding sword raised high above head with both hands, ready to strike
- Leaning slightly back, coiled energy, facing right
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

### ern_atk2.png（振り）
```
This is a Dragon Quest style pixel art RPG warrior companion character.
Please draw the SAME character mid-sword-swing:
- Sword cutting diagonally downward, strong forward lean
- Powerful, aggressive stance, facing right, arm extended
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

### ern_atk3.png（フォロースルー）
```
This is a Dragon Quest style pixel art RPG warrior companion character.
Please draw the SAME character after completing a sword swing:
- Sword pointed forward and slightly down, follow-through position
- Body weight forward, slightly off-balance from the swing force
- Facing right
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

---

## サリア（Saria）※魔法使いのため杖・魔法モーション

> **事前準備：** Gemini に `saria.png` を見せてから以下を送る

### saria_atk1.png（詠唱）
```
This is a Dragon Quest style pixel art RPG mage/healer companion character.
Please draw the SAME character in a magic casting windup pose:
- Raising her staff up high with both hands, gathering magical energy
- A faint magical glow or sparkle around the staff tip
- Body slightly arched backward, concentrating power, facing right
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

### saria_atk2.png（魔法放射）
```
This is a Dragon Quest style pixel art RPG mage/healer companion character.
Please draw the SAME character releasing a magic attack:
- Staff pointed forward horizontally, shooting magical energy to the right
- A bright magical orb or beam visible at the staff tip
- Body leaning forward, arm extended, dynamic casting pose, facing right
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

### saria_atk3.png（詠唱完了）
```
This is a Dragon Quest style pixel art RPG mage/healer companion character.
Please draw the SAME character after releasing a magic spell:
- Staff lowering, slight fatigue or satisfaction in the pose
- Residual magical sparkles around her
- Body returning to neutral, facing right
- Full body, white background only, no scenery
- Same art style, same colors, same character design
- Pixel art, Dragon Quest inspired
```

---

## チェックリスト

画像を保存したら ✅ をつけていく：

- [ ] hero_atk1.png
- [ ] hero_atk2.png
- [ ] hero_atk3.png
- [ ] ern_atk1.png
- [ ] ern_atk2.png
- [ ] ern_atk3.png
- [ ] saria_atk1.png
- [ ] saria_atk2.png
- [ ] saria_atk3.png

---

## 完了後

9枚揃ったら Claude に「揃いました」と送るだけ。以下を自動で追加してもらえます：

- `BootScene.js` → 9枚をロード
- `sprites.js` → 白背景除去リストに追加
- `JourneyScene.js` → 攻撃時にテクスチャをコマ送り切り替え
