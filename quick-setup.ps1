# Quick Telegram Webhook Setup for FocusFuel
# Direct setup for your Vercel URL

$BOT_TOKEN = "8263183208:AAGo5XcxxcSfTReeLQfgipC1pFdVFwrWNog"
$VERCEL_URL = "https://focusfuel-e4wi.vercel.app"
$WEBHOOK_URL = "$VERCEL_URL/api/telegram-webhook"

Write-Host "🚀 Setting up Telegram Webhook for FocusFuel..." -ForegroundColor Green
Write-Host "📡 Webhook URL: $WEBHOOK_URL" -ForegroundColor Cyan

try {
    $body = @{
        url = $WEBHOOK_URL
        drop_pending_updates = $true
    }
    
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
    
    Write-Host "`n✅ Webhook Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
    
    if ($response.ok) {
        Write-Host "`n🎉 SUCCESS! Telegram bot is now connected to Vercel!" -ForegroundColor Green
        Write-Host "`n📱 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Open Telegram and search for your bot" -ForegroundColor White
        Write-Host "2. Send /start to get your Chat ID" -ForegroundColor White
        Write-Host "3. Copy Chat ID to FocusFuel app" -ForegroundColor White
        Write-Host "4. Ask: 'What tasks is my child doing?'" -ForegroundColor White
    }
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check status
Write-Host "`n🔍 Checking webhook status..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" -Method Get
    Write-Host "Current URL: $($info.result.url)" -ForegroundColor Cyan
} catch {
    Write-Host "Error checking status" -ForegroundColor Red
}
