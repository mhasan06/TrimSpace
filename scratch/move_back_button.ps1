$path = "c:\Users\mohammad.hasan\.antigravity\extensions\barber-app\src\components\BookingFlow.tsx"
$content = [System.IO.File]::ReadAllText($path)

# 1. Remove the misplaced button from PARTY_SIZE stage
$misplaced = '              <button onClick={() => setStage("CALENDAR")} style={{ marginTop: ''3rem'', width: ''100%'', padding: ''1.2rem'', background: ''transparent'', color: ''#64748b'', border: ''1px solid #e2e8f0'', borderRadius: ''16px'', fontWeight: 800, cursor: ''pointer'' }}>
                 &laquo; Back to Schedule
              </button>'
# I'll use a simpler match if needed, but let's try this first with line replacement logic
$lines = Get-Content $path
$newLines = @()
$skip = 0
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -like '*setStage("CALENDAR")*' -and $lines[$i+1] -like '*Back to Schedule*' -and $i -lt 385) {
        $i += 2 # Skip these 3 lines (the button)
        continue
    }
    $newLines += $lines[$i]
    
    # 2. Add it to the BARBERS stage (after the div with grid)
    if ($lines[$i] -like '*{barbers.filter(b => availableBarbersAtTime.includes(b.id)).map(b => (*') {
        # Find the end of this map/div
        $foundDiv = $false
        for ($j = $i + 1; $j -lt $lines.Length; $j++) {
             if ($lines[$j] -like '*</div>*' -and $lines[$j+1] -like '*</div>*') {
                 # This is the end of the grid and the container
                 # Wait, line 432 in view_file showed exactly where to put it
             }
        }
    }
}

# Actually, let's use a simpler string replacement for the whole block
$oldBlock = '              <button onClick={() => setStage("CALENDAR")} style={{ marginTop: ''3rem'', width: ''100%'', padding: ''1.2rem'', background: ''transparent'', color: ''#64748b'', border: ''1px solid #e2e8f0'', borderRadius: ''16px'', fontWeight: 800, cursor: ''pointer'' }}>
                 &laquo; Back to Schedule
              </button>
           </div>
       )}'

# No, I'll just rewrite the relevant sections.
# Stage PARTY_SIZE ends around 380
# Stage BARBERS ends around 435

$content = [System.IO.File]::ReadAllText($path)
# Remove from first occurrence (which is the wrong one)
$btnText = '              <button onClick={() => setStage("CALENDAR")} style={{ marginTop: ''3rem'', width: ''100%'', padding: ''1.2rem'', background: ''transparent'', color: ''#64748b'', border: ''1px solid #e2e8f0'', borderRadius: ''16px'', fontWeight: 800, cursor: ''pointer'' }}>
                 &laquo; Back to Schedule
              </button>'

# Let's use a more robust way: find the BARBERS block and insert before the closing div
$barbersBlockStart = $content.IndexOf('{stage === "BARBERS" && (')
$barbersBlockEnd = $content.IndexOf(')}', $barbersBlockStart)
# The closing div for the container is just before )}
$lastDiv = $content.LastIndexOf('</div>', $barbersBlockEnd)

if ($barbersBlockStart -gt 0 -and $lastDiv -gt $barbersBlockStart) {
    # 1. Add to BARBERS
    $btnToAdd = "`n              <button onClick={() => setStage(""CALENDAR"")} style={{ marginTop: '3rem', width: '100%', padding: '1.2rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 800, cursor: 'pointer' }}>`n                 &laquo; Back to Schedule`n              </button>"
    $content = $content.Insert($lastDiv, $btnToAdd)
    
    # 2. Remove the first one (the wrong one)
    # The wrong one is before the BARBERS block
    $wrongBtnStart = $content.IndexOf('<button onClick={() => setStage("CALENDAR")}')
    if ($wrongBtnStart -lt $barbersBlockStart) {
        $wrongBtnEnd = $content.IndexOf('</button>', $wrongBtnStart) + 9
        $content = $content.Remove($wrongBtnStart, $wrongBtnEnd - $wrongBtnStart)
    }
}

[System.IO.File]::WriteAllText($path, $content)
