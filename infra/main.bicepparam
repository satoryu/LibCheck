using './main.bicep'

param location = 'eastasia'
param resourceGroupName = 'rg-libcheck'
param staticWebAppName = 'libcheck'

// シークレットはリポジトリに置かず、デプロイ実行時の環境変数 CALIL_APP_KEY から注入する。
// （CI 化の際も同名の環境変数 / Secret を渡せばそのまま使える）
param calilAppKey = readEnvironmentVariable('CALIL_APP_KEY')
