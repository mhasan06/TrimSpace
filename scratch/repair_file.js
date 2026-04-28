
const fs = require('fs');
let content = fs.readFileSync('src/components/BookingFlow.tsx', 'utf8');

// Find the line index of 1197 (approx)
// We want to keep everything up to line 1197 and then add a clean tail.
let lines = content.split('\n');
let newLines = lines.slice(0, 1198); // Keep up to line 1197 (0-indexed 1198)

// Add the clean tail
newLines.push(`
      {/* Persistent Mini-Cart (Fresha Style) */}
      {allCartItems.length > 0 && stage !== 'PAYMENT' && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', background: '#000', color: '#fff', borderRadius: '24px', padding: '1.2rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {partySize > 1 && (
                  <button onClick={prevPerson} disabled={currentPersonIndex === 0} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPersonIndex === 0 ? 'not-allowed' : 'pointer', fontSize: '1.2rem' }}>&lsaquo;</button>
                )}
                <div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>
                      {partySize > 1 ? \`Person \${currentPersonIndex + 1} of \${partySize}\` : \`\${allCartItems.length} services selected\`}
                    </p>
                    <p style={{ fontSize: '1.3rem', fontWeight: 900 }}>Total: \${(finalPrice + 0.50).toFixed(2)} AUD</p>
                </div>
            </div>
            
            {stage === 'SERVICES' ? (
                <button 
                  onClick={nextPerson} 
                  disabled={currentCart.length === 0}
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '0.8rem 2rem', borderRadius: '14px', fontWeight: 900, cursor: currentCart.length === 0 ? 'not-allowed' : 'pointer', opacity: currentCart.length === 0 ? 0.5 : 1 }}
                >
                  {currentPersonIndex < partySize - 1 ? 'Next Person' : 'Choose Time'}
                </button>
            ) : (
                <button onClick={() => setStage('PAYMENT')} style={{ background: '#fff', color: '#000', border: 'none', padding: '0.8rem 2rem', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>Review & Pay</button>
            )}
        </div>
      )}
    </div>
  </div>
  );
}
`);

fs.writeFileSync('src/components/BookingFlow.tsx', newLines.join('\n'));
console.log('File repaired.');
