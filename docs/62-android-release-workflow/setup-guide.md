# セットアップガイド: Android リリースワークフロー

## 1. アップロード用キーストアの作成

以下のコマンドでキーストアを作成する。

```bash
keytool -genkey -v \
  -keystore upload-keystore.jks \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload
```

対話形式でパスワードや証明書情報を入力する。入力したパスワードは後で GitHub Secrets に登録するので控えておくこと。

> **注意**: 作成したキーストアファイルは安全な場所にバックアップし、リポジトリにはコミットしないこと。

## 2. ローカルでの署名付きビルド（任意）

ローカルで署名付きビルドを行う場合は、`android/app/key.properties` を作成する。

```properties
storePassword=<キーストアのパスワード>
keyPassword=<キーのパスワード>
keyAlias=upload
storeFile=upload-keystore.jks
```

キーストアファイルを `android/app/` に配置する。

```bash
cp /path/to/upload-keystore.jks android/app/
```

ビルド実行:

```bash
flutter build appbundle --release
```

## 3. GitHub Secrets の設定

リポジトリの **Settings > Secrets and variables > Actions** で以下の Secrets を登録する。

| Secret名 | 値 |
|-----------|-----|
| `KEYSTORE_BASE64` | キーストアファイルを Base64 エンコードした文字列 |
| `KEYSTORE_PASSWORD` | キーストアのパスワード |
| `KEY_ALIAS` | キーのエイリアス名（例: `upload`） |
| `KEY_PASSWORD` | キーのパスワード |

### キーストアの Base64 エンコード

```bash
base64 -i upload-keystore.jks | pbcopy
```

クリップボードにコピーされた文字列を `KEYSTORE_BASE64` に設定する。

## 4. ワークフローの使い方

### タグプッシュによるリリース

```bash
git tag v1.0.0
git push origin v1.0.0
```

タグ名の `v` を除いた部分（`1.0.0`）がバージョン名として AAB に埋め込まれる。
GitHub Release が自動作成され、AAB ファイルが添付される。

### 手動実行

GitHub の **Actions > Release Android > Run workflow** からバージョン名を入力して実行する。
手動実行の場合は GitHub Release は作成されず、ビルドの Artifacts から AAB をダウンロードする。

## 5. Google Play Console へのアップロード

1. GitHub Release から AAB ファイルをダウンロードする
2. [Google Play Console](https://play.google.com/console/) にログインする
3. アプリの **リリース > 製品版**（または内部テスト等）でリリースを作成する
4. ダウンロードした AAB ファイルをアップロードする
5. リリースノートを記入してレビューに提出する
