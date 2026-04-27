$path = "c:\Users\mohammad.hasan\.antigravity\extensions\barber-app\src\components\BookingFlow.tsx"
$content = [System.IO.File]::ReadAllText($path)

# 1. Add Legal Disclaimer
$old1 = 'Select a specific specialist or the first available.</p>'
$new1 = @"
Select a specific specialist or the first available.</p>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '2.5rem', fontStyle: 'italic', background: '#f8fafc', padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #cbd5e1' }}>
                Please note, due to many circumstances your chosen Professional may not be available.
              </p>
"@
$content = $content.Replace($old1, $new1)

# 2. Add Barber Name to Summary
$old2 = '<h4 style={{ fontWeight: 900, textTransform: ''uppercase'', fontSize: ''0.75rem'', color: ''#94a3b8'', letterSpacing: ''1px'', marginBottom: ''1.5rem'' }}>Order Summary</h4>'
# Wait, I'll use Date & Time as anchor since it's more unique in context
$old2 = '<h4 style={{ fontWeight: 900, textTransform: ''uppercase'', fontSize: ''0.75rem'', color: ''#94a3b8'', letterSpacing: ''1px'', marginBottom: ''0.5rem'', marginTop: ''2.5rem'' }}>Date & Time</h4>'
$new2 = @"
<h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '2.5rem' }}>Professional</h4>
                 <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    {selectedBarberId ? barbers.find(b => b.id === selectedBarberId)?.name : "Any Specialist (First Available)"}
                 </p>

                 <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '2.5rem' }}>Date & Time</h4>
"@
$content = $content.Replace($old2, $new2)

[System.IO.File]::WriteAllText($path, $content)
