# NanoWalk モンスター画像生成ガイド
## Gemini × remove.bg フロー完全版

---

## 📋 全体フロー

```
① このガイドで「#001から始める」とClaudeに伝える
② Claudeが1体ずつプロンプトを出力
③ そのプロンプトをGeminiに貼り付けて生成
④ 生成画像をremove.bgで背景除去
⑤ 512×512にリサイズして保存
⑥ Claudeに「続けてください」→次の1体へ
```

---

## 🛠 使用ツール

| ツール | 用途 | URL | 料金 |
|--------|------|-----|------|
| Gemini Advanced | 画像生成 | gemini.google.com | 有料プラン推奨 |
| remove.bg | 背景除去 | remove.bg | 無料50枚/月 or 有料 |
| Squoosh / Photoshop | 512×512リサイズ | squoosh.app | 無料 |

---

## 📁 ファイル保存ルール

```
/assets/monsters/
├── 001_nanobana.png
├── 002_kokemosu.png
├── 003_chibikinon.png
...
└── 100_nanowalker.png
```

**命名規則**: `{3桁ID}_{名前ローマ字小文字}.png`

---

## ⚙️ Geminiへの貼り方

1. **Gemini Advanced** を開く（gemini.google.com）
2. **「画像を生成して」モード**に切り替え（Imagen 3を選択）
3. 下記の「共通システムプロンプト」を**毎回最初に貼る**
4. その直後に各モンスターの「個別プロンプト」を貼る
5. 1メッセージで両方を貼り付けてEnter

---

## 🔧 共通システムプロンプト（毎回使用）

```
Generate a game character sprite with these specifications:
- Style: cute chibi creature, rounded soft shapes
- Inspired by: Yo-kai Watch, Pokemon, Studio Ghibli creature design
- Background: pure white (#FFFFFF) — will be removed later
- Pose: front-facing, centered, slight 3/4 angle allowed
- Canvas: square composition, character fills 70% of frame
- Lighting: soft flat lighting, subtle shadow beneath character
- Outline: clean black outline (2px equivalent), cel-shaded
- Detail level: medium — readable at 128px, beautiful at 512px
- Eyes: large expressive eyes, signature of the character
- No text, no watermark, no UI elements
- Single character only, no background elements
```

---

## 🎨 属性別カラーパレット（プロンプトに追加）

| 属性 | メインカラー | アクセント | 雰囲気ワード |
|------|------------|-----------|------------|
| 🌿 フォレスト | `#66BB6A` forest green | `#8D6E63` bark brown | organic, earthy, fresh |
| 💧 アクア | `#4FC3F7` sky blue | `#B3E5FC` ice blue | fluid, transparent, cool |
| 🔥 フレア | `#FF6B35` warm orange | `#FFCCBC` pale orange | hot, energetic, glowing |
| ⚡ ボルト | `#FFD54F` electric yellow | `#FFF9C4` pale yellow | sparkling, sharp, bright |
| 🌑 シャドウ | `#7B1FA2` deep purple | `#1A1A2E` near black | mysterious, dark, haunting |
| ✨ ルミナ | `#FFF176` soft gold | `#FFFDE7` cream white | radiant, holy, warm glow |

---

## 📐 remove.bg 使い方

1. remove.bg にアクセス
2. 生成した画像をドラッグ＆ドロップ
3. 「Download」→「HD Download」（有料）or 通常Download（無料）
4. Squoosh.app で 512×512 にリサイズ
5. PNG形式でエクスポート

**Tip**: remove.bgの無料枠は月50枚。100体生成するなら途中で有料プラン（$9/月）を使うか、月をまたいで生成するのがお得。

---

## ✅ 進捗チェックリスト

- [ ] #001 ナノバナナ
- [ ] #002 コケモス
- [ ] #003 チビキノン
- [ ] #004 ハネムシン
- [ ] #005 クサリス
- [ ] #006 コロコケ
- [ ] #007 メロメロン
- [ ] #008 ナミコロ
- [ ] #009 バブルット
- [ ] #010 コーラルン
- [ ] #011 プルプルン
- [ ] #012 シズクン
- [ ] #013 キリリン
- [ ] #014 チビフレア
- [ ] #015 スパーキン
- [ ] #016 エンバーロ
- [ ] #017 ヒートモス
- [ ] #018 マグマチン
- [ ] #019 チラリス
- [ ] #020 ピカトン
- [ ] #021 ボルティス
- [ ] #022 デンデン
- [ ] #023 テスラット
- [ ] #024 ジルコン
- [ ] #025 ネオンコ
- [ ] #026 クロモチン
- [ ] #027 ダークロ
- [ ] #028 ニャクラ
- [ ] #029 ゴーストチン
- [ ] #030 ミラーン
- [ ] #031 ルミロン
- [ ] #032 ホシミン
- [ ] #033 レインボット
- [ ] #034 オーロラン
- [ ] #035 クリスタリア
- [ ] #036〜100 ... (以下同様)

---

*「続けてください」と言うとClaudeが次のモンスターのプロンプトを出力します*
