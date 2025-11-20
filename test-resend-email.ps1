# Test resend verification email
Write-Host "Testing resend verification email..." -ForegroundColor Cyan

$uri = "http://localhost:4000/api/auth/resend-verification-email"
$body = @{
    email = "sedatergoz@icloud.com"
    password = "testtest"
} | ConvertTo-Json

Write-Host "Sending request to: $uri" -ForegroundColor Yellow
Write-Host "Request body: $body" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $body
    Write-Host "`nSuccess! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`nError occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "`nError Details:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host "`n`nNow check the backend server console for SMTP logs!" -ForegroundColor Cyan
