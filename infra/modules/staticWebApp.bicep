@description('Static Web App の名前')
param name string

@description('リージョン（Static Web App Free が利用可能なリージョン）')
param location string

@description('Calil API アプリキー（シークレット）。リポジトリに置かず、デプロイ時に注入する。')
@secure()
param calilAppKey string

@description('GitHub 連携プロバイダ（既存リソースに合わせる）')
param provider string = 'GitHub'

@description('GitHub 連携: リポジトリ URL')
param repositoryUrl string = 'https://github.com/satoryu/LibCheck'

@description('GitHub 連携: ブランチ')
param branch string = 'main'

resource site 'Microsoft.Web/staticSites@2024-04-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  // 既存リソースの設定可能プロパティを再表明し、apply が settable フィールドを
  // 消さない（実質 no-op になる）ようにする。アプリ配信は既存の GitHub Actions
  // （デプロイトークン方式）が担い、ここでは構成のみを忠実に表現する。
  // 注: deploymentAuthPolicy は省略。apply 後に既定の 'DeploymentToken' に戻り
  // 同値となるため害はなく、現行 Bicep 型では未定義（BCP037）のため明示しない。
  properties: {
    provider: provider
    repositoryUrl: repositoryUrl
    branch: branch
  }
}

// SWA のアプリ設定（Azure Functions プロキシが process.env から参照）。
// ARM では appsettings は全置換のため、管理するキーはここに網羅する。
// 値はデプロイ時に @secure() パラメータ経由で注入し、リポジトリには残さない。
resource appSettings 'Microsoft.Web/staticSites/config@2024-04-01' = {
  parent: site
  name: 'appsettings'
  properties: {
    CALIL_APP_KEY: calilAppKey
  }
}

@description('SWA の既定ホスト名')
output defaultHostname string = site.properties.defaultHostname
