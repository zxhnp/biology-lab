param(
  [Parameter(Mandatory)]
  [ValidateSet('with-webview2', 'without-webview2')]
  [string]$Variant
)

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$package = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json
$bundleDirectory = Join-Path $projectRoot 'src-tauri/target/release/bundle/nsis'
$installers = @(Get-ChildItem -LiteralPath $bundleDirectory -File -Filter '*-setup.exe')
if ($installers.Count -ne 1) {
  throw "预期恰有一个 NSIS 安装包，实际为 $($installers.Count) 个。"
}

# 仅重命名发布文件，中文产品名继续由 Tauri/NSIS 配置决定。
$outputDirectory = Join-Path $projectRoot 'release-assets'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$outputPath = Join-Path $outputDirectory "biology-lab_$($package.version)_x64_$Variant-setup.exe"
Copy-Item -LiteralPath $installers[0].FullName -Destination $outputPath
Write-Output $outputPath
