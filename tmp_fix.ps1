 = 'frontend/src/services/apiBackend/adminPortalApi.js'
# read raw
 = Get-Content  -Raw
# Replace all bad patterns
 =  -replace "apiClient\.post\(\\\/admin\/inventory\/\/adjust\/,", 'apiClient.post(/admin/inventory//adjust/,'
 =  -replace "apiClient\.get\(\\\/admin\/orders\/\/\)", 'apiClient.get(/admin/orders//)'
 =  -replace "apiClient\.patch\(\\\/admin\/orders\/\/status\/,", 'apiClient.patch(/admin/orders//status/,'
 =  -replace "apiClient\.post\(\\\/admin\/orders\/\/collect-cod\/,", 'apiClient.post(/admin/orders//collect-cod/,'
 =  -replace "apiClient\.post\(\\\/admin\/orders\/\/cancel\/,", 'apiClient.post(/admin/orders//cancel/,'
 =  -replace "apiClient\.get\(\\\/admin\/customers\/\/\)", 'apiClient.get(/admin/customers//)'
 =  -replace "apiClient\.patch\(\\\/admin\/customers\/\/status\/,", 'apiClient.patch(/admin/customers//status/,'
 =  -replace "apiClient\.patch\(\\\/admin\/subscriptions\/supplements\/\/,", 'apiClient.patch(/admin/subscriptions/supplements//,'
 =  -replace "apiClient\.delete\(\\\/admin\/subscriptions\/supplements\/\/\)", 'apiClient.delete(/admin/subscriptions/supplements//)'
Set-Content -Path  -Value  -Encoding UTF8
Write-Output 'done'
