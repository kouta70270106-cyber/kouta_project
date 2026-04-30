# 開発コマンド

```bash
npm start        # 本番起動 (node server.js)
npm run dev      # 開発起動 (nodemon、ファイル変更で自動再起動)
```

ローカル確認: http://localhost:3000

## デプロイ先

- **ゲーム本体**: Render.com (`master` ブランチへ push → 自動デプロイ)
- **登録ページ/静的ページ**: GitHub Pages (`gh-pages` ブランチ)

## ブランチ運用

- 機能開発は `claude/` プレフィクスのブランチで行い、完了後 `master` にマージ
- `gh-pages` ブランチは GitHub Pages 専用（ゲームと独立した静的ファイル）
