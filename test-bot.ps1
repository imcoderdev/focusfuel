# Simple Telegram Bot Test for PowerShell
# Test the webhook functionality locally

Write-Host "🤖 Testing Telegram Bot on Localhost..." -ForegroundColor Green
Write-Host "📡 URL: http://localhost:3000/api/telegram-webhook" -ForegroundColor Cyan
Write-Host ""

# Test 1: /start command
Write-Host "🧪 Test 1: /start command" -ForegroundColor Yellow

$startMessage = @{
    update_id = 1
    message = @{
        message_id = 1
        from = @{
            id = 123456789
            first_name = "TestParent"
            is_bot = $false
        }
        chat = @{
            id = 123456789
            type = "private"
        }
        date = [int]([DateTimeOffset]::Now.ToUnixTimeSeconds())
        text = "/start"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/telegram-webhook" -Method Post -Body $startMessage -ContentType "application/json"
    Write-Host "✅ Response received:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Test 2: Natural question
Write-Host "🧪 Test 2: Natural question about tasks" -ForegroundColor Yellow

$taskMessage = @{
    update_id = 2
    message = @{
        message_id = 2
        from = @{
            id = 123456789
            first_name = "TestParent"
            is_bot = $false
        }
        chat = @{
            id = 123456789
            type = "private"
        }
        date = [int]([DateTimeOffset]::Now.ToUnixTimeSeconds())
        text = "What tasks is my child working on today?"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/telegram-webhook" -Method Post -Body $taskMessage -ContentType "application/json"
    Write-Host "✅ Response received:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Testing completed!" -ForegroundColor Green
Write-Host "📋 Check the responses above to verify bot functionality" -ForegroundColor Cyan
