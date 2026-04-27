$path = "c:\Users\mohammad.hasan\.antigravity\extensions\barber-app\src\components\BookingFlow.tsx"
$content = [System.IO.File]::ReadAllText($path)

# 1. Remove the misplaced button from INSIDE the map
$badButton = @"
              <button onClick={() => setStage("CALENDAR")} style={{ marginTop: '3rem', width: '100%', padding: '1.2rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 800, cursor: 'pointer' }}>
                 &laquo; Back to Schedule
              </button>
"@
$content = $content.Replace($badButton, "")

# 2. Fix the broken div from the accidental insertion
# It was inserted like this: {b.name || 'Professional'}[BUTTON]</div>
# So we have extra </div> or similar? No, it replaced the tag end?
# Let's see: 427: <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{b.name || 'Professional'}[BTN]</div>
# Wait, it looks like it just inserted it before </div>.
# So I just need to remove it.

# 3. Insert it PROPERLY after the grid (Line 432 area)
# I'll look for the end of the stage block
$stageEnd = $content.IndexOf('{stage === "SERVICES" && (')
$targetInsert = $content.LastIndexOf('</div>', $stageEnd)

$newBtn = @"
              <button onClick={() => setStage("CALENDAR")} style={{ marginTop: '3rem', width: '100%', padding: '1.2rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 800, cursor: 'pointer' }}>
                 &laquo; Back to Schedule
              </button>
"@

# I'll use a more precise anchor: the closing div of the grid container in BARBERS stage
$barbersStart = $content.IndexOf('{stage === "BARBERS" && (')
$gridEnd = $content.IndexOf('</div>', $content.IndexOf('display: ''grid''', $barbersStart))
# Find the div that closes the BARBERS content
$contentEnd = $content.LastIndexOf('</div>', $content.IndexOf(')}', $barbersStart))

if ($contentEnd -gt 0) {
    $content = $content.Insert($contentEnd, $newBtn)
}

[System.IO.File]::WriteAllText($path, $content)
