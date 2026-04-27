$path = "c:\Users\mohammad.hasan\.antigravity\extensions\barber-app\src\components\BookingFlow.tsx"
$content = [System.IO.File]::ReadAllText($path)

# 1. Update Legal Disclaimer with Red Color
$old1 = "Please note, due to many circumstances your chosen Professional may not be available."
$new1 = "The requested professional is subject to availability and may be unavailable due to circumstances beyond our control."

$content = $content.Replace($old1, $new1)
# Also update the color to red
$content = $content.Replace("color: '#94a3b8', fontSize: '0.75rem'", "color: '#ef4444', fontSize: '0.8rem'")

[System.IO.File]::WriteAllText($path, $content)
