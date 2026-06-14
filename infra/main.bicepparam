using './main.bicep'

param location = 'eastasia'
param staticWebAppName = 'libcheck'

// シークレットはリポジトリに置かず、デプロイ実行時の環境変数 CALIL_APP_KEY から注入する。
// （CI でも同名の GitHub Secret を env で渡せばそのまま使える）
param calilAppKey = readEnvironmentVariable('CALIL_APP_KEY')
