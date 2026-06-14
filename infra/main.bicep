// リソースグループスコープでデプロイする（最小権限：CI 用 ID は rg-libcheck の
// Contributor のみで足りる）。RG 自体は一度きりのブートストラップで作成済みのため、
// ここでは作成しない。
targetScope = 'resourceGroup'

@description('リソースのリージョン')
param location string = 'eastasia'

@description('Static Web App の名前')
param staticWebAppName string = 'libcheck'

@description('GitHub 連携: リポジトリ URL（既存リソースに合わせる）')
param repositoryUrl string = 'https://github.com/satoryu/LibCheck'

@description('GitHub 連携: ブランチ')
param branch string = 'main'

@description('Calil API アプリキー（シークレット）。リポジトリに置かず、デプロイ時に注入する。')
@secure()
param calilAppKey string

module staticWebApp 'modules/staticWebApp.bicep' = {
  name: 'staticWebApp'
  params: {
    name: staticWebAppName
    location: location
    repositoryUrl: repositoryUrl
    branch: branch
    calilAppKey: calilAppKey
  }
}

@description('Static Web App の既定ホスト名')
output staticWebAppHostname string = staticWebApp.outputs.defaultHostname
