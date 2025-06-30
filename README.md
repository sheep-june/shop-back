# Kauuru - バックエンド（Node.js + Express）

## 概要  
このリポジトリには、ショッピングサイトのバックエンド（Node.js + Express）を実装しています。  
ユーザ管理、商品管理、レビュー・お問い合わせ、管理者用広告バナー管理などの API を提供し、MongoDB による永続化を行います。

## 主な機能  
- 会員登録・ログイン・ログアウト（JWT による認証・認可）  
- 商品 CRUD（画像アップロード、タイトル・説明・価格・カテゴリ）  
- カート機能（追加・一覧取得・削除）  
- 購入履歴取得（購入日時・数量・合計金額）  
- ウィッシュリスト（お気に入り登録・解除・一覧取得）  
- レビュー投稿・取得（購入済みユーザーのみ許可）  
- お問い合わせ投稿・取得  
- FAQ 提供  
- 商品検索・フィルター・ページネーション  
- 管理者認証・管理者用広告バナーの CRUD  
- ファイルアップロード: Multer で画像保存  
- グローバルエラーハンドリング

## CI/CD（自動デプロイ）
- GitHub Actions を使い、`main` ブランチに push すると  
  AWS EC2 に自動でデプロイされます。  
- `git pull → npm install → pm2 reload` が自動実行されます。  
- 設定ファイル: `.github/workflows/deploy.yml`


## 使用技術スタック  
- **Node.js** + **Express**  
- **MongoDB** (Mongoose)  
- **JWT** (jsonwebtoken)  
- **Multer** (画像アップロード)  
- **helmet** (セキュリティヘッダー)  
- **cors** (クロスオリジン制御)  
- **cookie-parser** (クッキー解析)  
- **csurf** (CSRF 防御)  
- **express-rate-limit** (リクエストレート制限)  
- **express-validator** (入力検証)  
- **bcryptjs** (パスワードハッシュ化)  
- **dotenv** (環境変数管理)  
- **morgan** (HTTPリクエストロギング)  
- **winston** （アプリケーションロギング／カスタムロガー）  
- **dayjs** (日時フォーマット)  
- **nodemailer** (メール送信)  
- **swagger-jsdoc** + **swagger-ui-express** (API ドキュメント)  
- **nodemon** (開発時ホットリロード)  


## プロジェクト構成  
```plaintext
backend/
├── models/
│   ├── User.js       （ユーザースキーマ）
│   ├── Product.js    （商品スキーマ）
│   ├── Review.js     （レビュー）
│   ├── Question.js   （お問い合わせ）
│   └── FAQ.js        （FAQ 項目）
├── routes/
│   ├── users.js      （会員認証・カート・履歴）
│   ├── products.js   （商品 CRUD・検索）
│   ├── reviews.js    （レビュー投稿・取得）
│   ├── question.js   （お問い合わせ投稿・取得）
│   └── faq.js        （FAQ 取得）
├── middleware/
│   ├── auth.js       （JWT 検証）
│   └── adminAuth.js  （管理者認証）
├── uploads/          （アップロード画像保存フォルダ）
├── utils/
│   └── logger.js     （ロガー設定）
└── index.js          （サーバー起動・ミドルウェア設定）
