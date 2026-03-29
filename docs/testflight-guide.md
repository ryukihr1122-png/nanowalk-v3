# NanoWalk — TestFlight配布ガイド

## 事前準備（1回だけ）

### 1. Apple Developer Account
- https://developer.apple.com に登録（年間$99）
- App Store Connectにログイン

### 2. EAS CLIをインストール
```bash
npm install -g eas-cli
```

### 3. Expoアカウントを作成・ログイン
```bash
eas login
```

### 4. プロジェクトをEASに登録
```bash
cd ~/Downloads/nanowalk
eas init
```
→ 表示される **Project ID** をコピー

### 5. app.json を更新
`app.json` の以下の箇所を実際の値に差し替える：

```json
"extra": {
  "eas": {
    "projectId": "← eas init で表示されたID"
  }
},
"updates": {
  "url": "https://u.expo.dev/← 同じID"
}
```

`eas.json` の submit セクションも更新：
```json
"appleId": "← Apple IDのメールアドレス",
"ascAppId": "← App Store ConnectのApp ID（後で）",
"appleTeamId": "← Apple Developer の Team ID"
```

---

## TestFlightに配布する（毎回）

### Step 1 — ビルド

```bash
cd ~/Downloads/nanowalk

# TestFlight用ビルド（クラウドでビルドされる・20〜40分）
eas build --platform ios --profile testflight
```

初回はApple Developer Accountへのアクセス許可を求められます。
表示に従って認証してください。

### Step 2 — App Store Connectにアップロード

```bash
eas submit --platform ios --profile production
```

または EAS ダッシュボード（https://expo.dev）から
「Submit to App Store」をクリック。

### Step 3 — TestFlight設定

1. App Store Connect (https://appstoreconnect.apple.com) にログイン
2. 「マイ App」→「NanoWalk」→「TestFlight」タブ
3. ビルドが表示されたら「テスターを追加」
4. 自分のApple IDを追加 → iPhoneのTestFlightアプリからインストール

---

## OTA（ワイヤレス）アップデート

コード変更のみ（ネイティブモジュール変更なし）の場合は
ビルドなしでアップデートできます：

```bash
# TestFlight環境に即時反映
eas update --channel testflight --message "UI修正"

# 本番環境に即時反映
eas update --channel production --message "バグ修正"
```

---

## 環境変数の設定

### ローカル開発用（.env）
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
EXPO_PUBLIC_APP_ENV=development
```

### EASクラウドビルド用
```bash
# Supabase URLをEASシークレットに登録
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxx.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJxxxx"
```

---

## プロファイル別の用途

| プロファイル | 用途 | 配布先 |
|------------|------|--------|
| `development` | 開発・デバッグ | シミュレーター |
| `preview` | 内部テスト | Ad Hoc（端末指定） |
| `testflight` | りゅうきさん自身のテスト | TestFlight |
| `production` | App Store公開 | App Store |

---

## よくあるエラー

| エラー | 対処 |
|-------|------|
| `No bundle identifier` | app.jsonのbundleIdentifierを確認 |
| `Apple credentials error` | `eas credentials` で再設定 |
| `Build failed: peer deps` | package.jsonに `"overrides"` を追加 |
| OTAが反映されない | `eas update` のchannelを確認 |

---

## 必要なもの チェックリスト

- [ ] Apple Developer Account（$99/年）
- [ ] Expoアカウント（無料）
- [ ] app.json の projectId を更新
- [ ] app.json の appleTeamId を更新
- [ ] Supabase URLをEASシークレットに登録
- [ ] `eas build --platform ios --profile testflight` を実行
