# Set Telegram Webhook Script
# Run this after deploying to Vercel

# Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
$VERCEL_URL = "https://your-app-name.vercel.app"
$BOT_TOKEN = "8263183208:AAGo5XcxxcSfTReeLQfgipC1pFdVFwrWNog"
$WEBHOOK_URL = "$VERCEL_URL/api/telegram-webhook"

Write-Host "🚀 Setting up Telegram Webhook..." -ForegroundColor Green
Write-Host "📡 Bot Token: $BOT_TOKEN" -ForegroundColor Cyan
Write-Host "🌐 Webhook URL: $WEBHOOK_URL" -ForegroundColor Cyan

# Set webhook
try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" -Method Post -Body @{
        url = $WEBHOOK_URL
    } -ContentType "application/x-www-form-urlencoded"
    
    Write-Host "✅ Webhook Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
    
    if ($response.ok) {
        Write-Host "🎉 Webhook set successfully!" -ForegroundColor Green
        Write-Host "💬 You can now test the bot on Telegram!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error setting webhook: $($_.Exception.Message)" -ForegroundColor Red
}

# Check webhook status
Write-Host "`n🔍 Checking webhook info..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" -Method Get
    Write-Host "📋 Webhook Info:" -ForegroundColor Cyan
    Write-Host ($info | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "❌ Error getting webhook info: $($_.Exception.Message)" -ForegroundColor Red
}
