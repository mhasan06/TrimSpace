{stage === "PAYMENT" && (
          <div style={{ 
            background: '#fff', 
            padding: 'clamp(1rem, 4vw, 3rem)', 
            borderRadius: 'clamp(16px, 5vw, 32px)', 
            border: '1px solid #e2e8f0',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: '0 10px 40px rgba(0,0,0,0.03)'
          }}>
             {!session?.user ? (
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                   <button 
                        onClick={() => setStage("BARBERS")}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.9rem', marginBottom: '2rem' }}
                    >
                        ← Back to specialists
                    </button>

                   {authStep === 'EMAIL' && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Log in or sign up</h2>
                            <p style={{ color: '#64748b', fontWeight: 500 }}>Log in or sign up to complete your booking</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <SocialLoginButtons mode="in" compact={false} callbackUrl={typeof window !== 'undefined' ? window.location.href : '/'} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                        </div>

                        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    required 
                                    name="email" 
                                    type="email" 
                                    placeholder="Email address" 
                                    value={loginForm.email} 
                                    onChange={handleLoginChange} 
                                    style={{ 
                                        width: '100%', 
                                        padding: '1.2rem', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '12px', 
                                        fontSize: '1rem', 
                                        fontWeight: 500,
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }} 
                                    onFocus={(e) => { e.target.style.borderColor = '#000'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
                                />
                            </div>
                            {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>{loginError}</p>}
                            <button 
                                type="submit" 
                                disabled={isCheckingEmail}
                                style={{ 
                                    width: '100%', 
                                    padding: '1.2rem', 
                                    background: '#000', 
                                    color: '#fff', 
                                    fontWeight: 800, 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {isCheckingEmail ? "Checking..." : "Continue"}
                            </button>
                        </form>
                     </div>
                   )}

                   {authStep === 'PASSWORD' && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <button 
                            onClick={() => setAuthStep('EMAIL')}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}
                        >
                            ← Use a different email
                        </button>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Welcome back</h2>
                            <p style={{ color: '#64748b', fontWeight: 500 }}>Enter your password for <strong>{authEmail}</strong></p>
                        </div>

                        <form onSubmit={handleInPlaceLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <input 
                                required 
                                name="password" 
                                type="password" 
                                placeholder="Password" 
                                value={loginForm.password} 
                                onChange={handleLoginChange} 
                                style={{ 
                                    width: '100%', 
                                    padding: '1.2rem', 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '12px', 
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }} 
                            />
                            {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>{loginError}</p>}
                            <button 
                                type="submit" 
                                style={{ 
                                    width: '100%', 
                                    padding: '1.2rem', 
                                    background: '#000', 
                                    color: '#fff', 
                                    fontWeight: 800, 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Log in
                            </button>
                        </form>
                     </div>
                   )}

                   {authStep === 'REGISTER' && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <button 
                            onClick={() => setAuthStep('EMAIL')}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}
                        >
                            ← Use a different email
                        </button>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Finish signing up</h2>
                            <p style={{ color: '#64748b', fontWeight: 500 }}>Create an account for <strong>{authEmail}</strong></p>
                        </div>

                        <form onSubmit={handleInPlaceRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input name="name" required placeholder="Full name" value={regForm.name} onChange={handleRegChange} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                                <input name="phone" required type="tel" placeholder="Mobile number" value={regForm.phone} onChange={handleRegChange} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                            </div>
                            
                            <input name="street" required placeholder="Street address" value={regForm.street} onChange={handleRegChange} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', position: 'relative' }}>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        name="suburb" required placeholder="Suburb" value={regForm.suburb} 
                                        onChange={handleRegChange} onFocus={() => setShowSubDropdown(true)} onBlur={() => setTimeout(() => setShowSubDropdown(false), 200)}
                                        style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', boxSizing: 'border-box' }} 
                                    />
                                    {showSubDropdown && matchingSubs.length > 0 && (
                                        <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: 'white', zIndex: 100, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '5px' }}>
                                            {matchingSubs.map(item => (
                                                <div key={item.s} onClick={() => setRegForm({ ...regForm, suburb: item.s, state: item.st })} style={{ padding: '0.8rem 1rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{item.s}, {item.st}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input name="state" required placeholder="State" value={regForm.state} onChange={handleRegChange} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                            </div>

                            <input name="password" required type="password" placeholder="Create a password" value={regForm.password} onChange={handleRegChange} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                            
                            {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>{loginError}</p>}
                            
                            <button type="submit" style={{ width: '100%', padding: '1.2rem', background: '#000', color: '#fff', fontWeight: 800, border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem' }}>Agree and continue</button>
                        </form>
                     </div>
                   )}
                </div>
             ) : (
              <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                        <button 
                            onClick={() => setStage("BARBERS")}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}
                        >
                            ← Back to specialists
                        </button>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.3rem', letterSpacing: '-0.02em' }}>Confirm booking</h2>
                        <p style={{ color: '#64748b', fontWeight: 500 }}>Review your selection and complete your booking securely</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>LOGGED IN AS</p>
                        <p style={{ fontSize: '1rem', fontWeight: 800 }}>{session.user.name}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                          <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1.5rem' }}>Order Summary</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                                {Object.keys(multiCart).map(key => {
                                  const personIndex = Number(key);
                                  const items = multiCart[personIndex];
                                  if (!items || items.length === 0) return null;
                                  return (
                                    <div key={key} style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                                      <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Connoisseur {personIndex + 1}</p>
                                      {items.map(item => (
                                        <div key={item.service.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                                          <span style={{ fontWeight: 600 }}>{item.service.name}</span>
                                          <span style={{ fontWeight: 800 }}>${item.service.price.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Subtotal</span>
                                <span style={{ fontWeight: 700 }}>${totalPrice.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Priority Fee</span>
                                <span style={{ fontWeight: 700 }}>$0.50</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}>
                                <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>Total</span>
                                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)' }}>${(finalPrice + 0.50).toFixed(2)}</span>
                            </div>
                          </div>

                          <div style={{ padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '1.5rem', letterSpacing: '1px' }}>Policies & Terms</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#475569' }}><strong style={{ color: '#1e293b' }}>Booking Policy:</strong> {bookingPolicy || "A valid payment method is required to secure your booking."}</p>
                                <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#475569' }}><strong style={{ color: '#1e293b' }}>Cancellation Policy:</strong> {cancellationPolicy || "Cancellations must be made at least 24 hours in advance."}</p>
                            </div>
                            <label style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', background: agreedToPolicies ? 'rgba(99,102,241,0.05)' : 'transparent', padding: '1rem', borderRadius: '12px', border: agreedToPolicies ? '1px solid #6366f1' : '1px solid transparent', transition: 'all 0.2s' }}>
                                <input type="checkbox" checked={agreedToPolicies} onChange={(e) => setAgreedToPolicies(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#6366f1' }} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>I agree to the policies</span>
                            </label>
                          </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                          <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1.5rem' }}>Appointment Details</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Professional</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedBarberId ? barbers.find(b => b.id === selectedBarberId)?.name : "Any Specialist"}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Date & Time</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{new Date(targetDate).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })} at {selectedTime}</p>
                                </div>
                            </div>
                          </div>

                          <button 
                             onClick={handleFinalCheckout}
                             disabled={isPending || isProcessingPayment || !agreedToPolicies}
                             style={{ 
                                 width: '100%', 
                                 padding: '1.5rem', 
                                 background: agreedToPolicies ? '#000' : '#cbd5e1', 
                                 color: '#fff', 
                                 border: 'none', 
                                 borderRadius: '16px', 
                                 fontWeight: 900, 
                                 fontSize: '1.2rem', 
                                 cursor: agreedToPolicies ? 'pointer' : 'not-allowed',
                                 boxShadow: agreedToPolicies ? '0 20px 40px -10px rgba(0,0,0,0.3)' : 'none',
                                 transition: 'all 0.3s ease'
                             }}>
                             {isProcessingPayment ? "Processing..." : "Confirm & Pay Online"}
                          </button>
                      </div>
                  </div>
               </div>
             )}
          </div>
      )}
