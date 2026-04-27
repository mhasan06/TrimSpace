$path = "c:\Users\mohammad.hasan\.antigravity\extensions\barber-app\src\components\BookingFlow.tsx"
$content = [System.IO.File]::ReadAllText($path)

# 1. Rollback Barber Name in Summary
$old1 = @"
                 <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '2.5rem' }}>Professional</h4>
                 <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    {selectedBarberId ? barbers.find(b => b.id === selectedBarberId)?.name : "Any Specialist (First Available)"}
                 </p>

                 <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '2.5rem' }}>Date & Time</h4>
"@
$new1 = '<h4 style={{ fontWeight: 900, textTransform: ''uppercase'', fontSize: ''0.75rem'', color: ''#94a3b8'', letterSpacing: ''1px'', marginBottom: ''0.5rem'', marginTop: ''2.5rem'' }}>Date & Time</h4>'
$content = $content.Replace($old1, $new1)

# 2. Rollback Back to Schedule Button
$old2 = @"
             <button onClick={() => setStage("CALENDAR")} style={{ marginTop: '3rem', width: '100%', padding: '1.2rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 800, cursor: 'pointer' }}>
                &laquo; Back to Schedule
             </button>
"@
$content = $content.Replace($old2, "")

[System.IO.File]::WriteAllText($path, $content)
