targetScope = 'subscription'

@description('リソースのリージョン')
param location string = 'eastasia'

@description('リソースグループ名')
param resourceGroupName string = 'rg-libcheck'

@description('Static Web App の名前')
param staticWebAppName string = 'libcheck'

@description('GitHub 連携: リポジトリ URL（既存リソースに合わせる）')
param repositoryUrl string = 'https://github.com/satoryu/LibCheck'

@description('GitHub 連携: ブランチ')
param branch string = 'main'

@description('Calil API アプリキー（シークレット）。リポジトリに置かず、デプロイ時に注入する。')
@secure()
param calilAppKey string

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
}

module staticWebApp 'modules/staticWebApp.bicep' = {
  name: 'staticWebApp'
  scope: rg
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
