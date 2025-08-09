# Set Telegram Webhook Script
# Run this after deploying to Vercel

Write-Host "🚀 Telegram Webhook Setup for FocusFuel" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

# Bot configuration
$BOT_TOKEN = "8263183208:AAGo5XcxxcSfTReeLQfgipC1pFdVFwrWNog"

# Ask user for their Vercel URL
Write-Host "📋 Please enter your Vercel deployment URL:" -ForegroundColor Yellow
Write-Host "   Example: https://your-app-name.vercel.app" -ForegroundColor Gray
Write-Host "   (Do NOT include /api/telegram-webhook at the end)" -ForegroundColor Gray
$VERCEL_URL = Read-Host "🌐 Your Vercel URL"

# Remove trailing slash if present
$VERCEL_URL = $VERCEL_URL.TrimEnd('/')

# Construct webhook URL
$WEBHOOK_URL = "$VERCEL_URL/api/telegram-webhook"

Write-Host "`n� Configuration:" -ForegroundColor Cyan
Write-Host "   Bot Token: $BOT_TOKEN" -ForegroundColor White
Write-Host "   Vercel URL: $VERCEL_URL" -ForegroundColor White
Write-Host "   Webhook URL: $WEBHOOK_URL" -ForegroundColor White

Write-Host "`n🔄 Setting up webhook..." -ForegroundColor Yellow

# Set webhook
try {
    $body = @{
        url = $WEBHOOK_URL
        drop_pending_updates = $true
    }
    
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
    
    Write-Host "`n✅ Webhook Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    
    if ($response.ok) {
        Write-Host "`n🎉 SUCCESS! Webhook configured successfully!" -ForegroundColor Green
        Write-Host "💬 Your Telegram bot is now connected to Vercel!" -ForegroundColor Yellow
        Write-Host "`n📱 Next Steps:" -ForegroundColor Cyan
        Write-Host "   1. Open Telegram and search for your bot" -ForegroundColor White
        Write-Host "   2. Send /start to get your Chat ID" -ForegroundColor White
        Write-Host "   3. Copy the Chat ID to FocusFuel app under 'Parent Reports'" -ForegroundColor White
        Write-Host "   4. Ask questions like 'What tasks is my child doing?'" -ForegroundColor White
    } else {
        Write-Host "`n❌ Failed to set webhook!" -ForegroundColor Red
        Write-Host "Error: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "`n❌ Error setting webhook: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure your Vercel URL is correct and accessible" -ForegroundColor Yellow
}

# Check webhook status
Write-Host "`n🔍 Checking webhook status..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" -Method Get
    Write-Host "`n📋 Current Webhook Info:" -ForegroundColor Cyan
    Write-Host "   URL: $($info.result.url)" -ForegroundColor White
    Write-Host "   Pending Updates: $($info.result.pending_update_count)" -ForegroundColor White
    Write-Host "   Last Error: $($info.result.last_error_message)" -ForegroundColor White
    Write-Host "   Last Error Date: $($info.result.last_error_date)" -ForegroundColor White
} catch {
    Write-Host "`n❌ Error getting webhook info: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "🎓 FocusFuel AI Academic Coach is ready!" -ForegroundColor Green
