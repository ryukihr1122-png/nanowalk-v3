# NanoWalk — Supabase セットアップガイド

## 1. プロジェクト作成

1. https://supabase.com にアクセス
2. 「New project」を作成
3. プロジェクト名: `nanowalk`
4. リージョン: `Northeast Asia (Tokyo)`

---

## 2. スキーマの適用

1. Supabase Dashboard → **SQL Editor**
2. `supabase/schema.sql` の内容を貼り付けて実行

---

## 3. 環境変数の設定

プロジェクトルートに `.env` を作成:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

値は Dashboard → **Settings → API** で確認。

---

## 4. Apple Sign In の設定

1. Dashboard → **Authentication → Providers → Apple**
2. Apple Developer Account で以下を取得:
   - Service ID
   - Team ID
   - Key ID
   - Private Key (.p8)
3. Supabase の Apple プロバイダー設定に入力

---

## 5. Edge Function のデプロイ

```bash
# Supabase CLI のインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref xxxxxxxxxxxx

# Edge Function をデプロイ
supabase functions deploy verify-purchase

# シークレットを設定
supabase secrets set APPLE_SHARED_SECRET=your_shared_secret
```

---

## 6. RLS の確認

Dashboard → **Authentication → Policies** で
各テーブルのポリシーが有効になっていることを確認:

| テーブル | ポリシー |
|---------|---------|
| profiles | own read / own update / insert on signup |
| monsters | own all |
| daily_steps | own all |
| weekly_rankings | public read / own write |
| purchase_receipts | own all |
| sync_log | own all |

---

## 7. 動作確認

```typescript
// アプリ内で確認
import { supabase } from "@/services/supabaseClient";

const { data, error } = await supabase
  .from("profiles")
  .select("*");

console.log(data, error);
```

---

## テーブル構成

```
profiles          プレイヤーのメインデータ（NE・歩数・ボール）
monsters          所持モンスター一覧
daily_steps       歩数履歴（過去30日分を同期）
weekly_rankings   週間ランキング（公開）
purchase_receipts 課金レシート検証ログ
sync_log          同期履歴（デバッグ用）
```

---

## 差分同期の仕組み

```
ローカルSQLite （常に最新・オフライン動作の主体）
       ↓↑ 5分ごと + フォアグラウンド復帰時
Supabase PostgreSQL （クラウドバックアップ兼ランキング）

競合解決ルール:
- 歩数: max(local, server) を採用
- NE: max(local, server) を採用
- モンスター: UUID で管理、どちらにあっても追加
- ガチャ履歴: 重複UUIDは無視
```
