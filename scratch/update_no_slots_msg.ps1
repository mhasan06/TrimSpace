$path = "c:\Users\mohammad.hasan\.antigravity\extensions\barber-app\src\components\BookingFlow.tsx"
$content = [System.IO.File]::ReadAllText($path)

$old = '{slots.length === 0 && <p style={{ opacity: 0.5, textAlign: ''center'', gridColumn: ''1 / -1'', padding: ''3rem'' }}>No slots available this date.</p>}'
$new = @'
{slots.length === 0 && (
                           <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '3rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                               <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>No specialists assigned to these services are available today.</p>
                               <p style={{ color: 'var(--primary)', fontWeight: 900 }}>Please request a different day.</p>
                           </div>
                       )}
'@

$content = $content.Replace($old, $new)

[System.IO.File]::WriteAllText($path, $content)
