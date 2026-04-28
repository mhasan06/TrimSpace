      {(stage === "SERVICES" || stage === "CALENDAR" || stage === "BARBERS") && (
        <div style={{
            position: currentCart.length > 0 ? 'fixed' : 'relative',
            top: currentCart.length > 0 ? 0 : 'auto',
            left: currentCart.length > 0 ? 0 : 'auto',
            right: currentCart.length > 0 ? 0 : 'auto',
            bottom: currentCart.length > 0 ? 0 : 'auto',
            background: currentCart.length > 0 ? '#f8fafc' : 'transparent',
            zIndex: currentCart.length > 0 ? 9999 : 1,
            overflowY: currentCart.length > 0 ? 'auto' : 'visible',
            padding: currentCart.length > 0 ? '2rem' : '0'
        }}>
            {currentCart.length > 0 && (
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                    <button 
                        onClick={() => { 
                            if (stage === 'SERVICES') setMultiCart({ 0: [] }); 
                            else if (stage === 'CALENDAR') setStage('SERVICES');
                            else if (stage === 'BARBERS') setStage('CALENDAR');
                        }}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}
                    >
                        ←
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>
                        {stage === 'SERVICES' ? 'Services' : stage === 'CALENDAR' ? 'Select a Time' : 'Choose Your Professional'}
                    </h1>
                </div>
            )}

            <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto',
                display: currentCart.length > 0 ? 'grid' : 'block',
                gridTemplateColumns: currentCart.length > 0 ? '1fr 380px' : '1fr',
                gap: '4rem',
                alignItems: 'flex-start'
            }}>
                {/* Left Column: Dynamic Content */}
                <div>
                    {stage === "SERVICES" && (
                        <>
                            {!currentCart.length && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                                        {partySize > 1 ? `Person ${currentPersonIndex + 1} Selection` : terminology.serviceLabelPlural}
                                        </h2>
                                    </div>
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {initialServices.map((srv) => {
                                    const isSelected = currentCartIds.has(srv.id);
                                    return (
                                        <div 
                                        key={srv.id} 
                                        onClick={() => addToCart(srv)}
                                        style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            padding: '1.5rem', 
                                            background: '#fff', 
                                            borderRadius: '12px', 
                                            border: isSelected ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isSelected ? '0 4px 14px rgba(124, 58, 237, 0.1)' : 'none'
                                        }}
                                        >
                                        <div style={{ flex: 1, paddingRight: '1rem' }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.3rem 0' }}>{srv.name}</h4>
                                                <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, margin: '0 0 0.8rem 0' }}>{srv.durationMinutes} mins</p>
                                                <p style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>from ${srv.price.toFixed(0)}</p>
                                        </div>
                                        
                                        <div style={{ 
                                            width: '32px', 
                                            height: '32px', 
                                            borderRadius: '50%', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            background: isSelected ? '#7c3aed' : '#fff',
                                            border: isSelected ? 'none' : '1px solid #cbd5e1',
                                            color: isSelected ? '#fff' : '#64748b',
                                            fontSize: '1.2rem',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {isSelected ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : (
                                                <span style={{ marginTop: '-2px' }}>+</span>
                                            )}
                                        </div>
                                        </div>
                                    );
                                    })}
                                    {initialServices.length === 0 && (
                                    <p style={{ color: '#64748b', padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>No services available for booking at this time.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {stage === "CALENDAR" && (
                        <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontWeight: 500 }}>Choose your preferred date to see available openings.</p>
                            
                            <input 
                                type="date" 
                                min={getToday()}
                                value={targetDate} 
                                onChange={(e) => fetchSlots(e.target.value)} 
                                style={{ width: '100%', padding: '1.2rem', marginBottom: '2.5rem', border: '2px solid #f1f5f9', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }} 
                            />

                            <div>
                                {slotReason ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', background: '#fff1f2', color: '#be123c', borderRadius: '16px', border: '1px solid #fecdd3', margin: '1rem 0' }}>
                                        {slotReason}
                                    </div>
                                ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.8rem' }}>
                                        {slots.length === 0 && (
                                            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '3rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                                <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>No specialists assigned to these services are available today.</p>
                                                <p style={{ color: 'var(--primary)', fontWeight: 900 }}>Please request a different day.</p>
                                            </div>
                                        )}
                                        {slots.map((s: any) => (
                                            <button 
                                                key={s.time} 
                                                onClick={() => handleTimeSelect(s.time)}
                                                style={{ 
                                                    padding: '0.8rem 0.5rem', 
                                                    background: '#fff', 
                                                    border: '1px solid #e2e8f0', 
                                                    borderRadius: '16px', 
                                                    color: '#1e293b', 
                                                    fontWeight: 800, 
                                                    cursor: 'pointer', 
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '2px'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                                >
                                                <span style={{ fontSize: '0.95rem' }}>{s.time}</span>
                                                <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 700 }}>Ends {format12h(s.finishTime)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {stage === "BARBERS" && (
                        <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontWeight: 500 }}>Select a specific specialist or the first available.</p>
                            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '2.5rem', fontStyle: 'italic', background: '#f8fafc', padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #cbd5e1' }}>
                                The requested professional is subject to availability and may be unavailable due to circumstances beyond our control.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                <button 
                                onClick={() => { setSelectedBarberId(null); setStage("PAYMENT"); }}
                                style={{ 
                                    padding: '1.5rem', 
                                    background: '#fff', 
                                    border: '2px solid #e2e8f0', 
                                    borderRadius: '24px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>✨</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>Any Specialist</div>
                                </button>

                                {barbers.filter(b => availableBarbersAtTime.includes(b.id)).map(b => (
                                <button 
                                    key={b.id}
                                    onClick={() => { setSelectedBarberId(b.id); setStage("PAYMENT"); }}
                                    style={{ 
                                    padding: '1.5rem', 
                                    background: '#fff', 
                                    border: '2px solid #e2e8f0', 
                                    borderRadius: '24px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.5rem', border: '2px solid #f1f5f9' }}>
                                        <img src={b.avatarUrl || `https://ui-avatars.com/api/?name=${b.name || 'P'}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{b.name || 'Professional'}</div>
                                </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Sticky Cart Pane */}
                {currentCart.length > 0 && (
                    <div style={{ position: 'sticky', top: '2rem' }}>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
                                    <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=120" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: 800 }}>{tenantSlug.replace(/-/g, ' ').toUpperCase()}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>Professional Services</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {currentCart.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{item.service.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.service.durationMinutes} mins</div>
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                                            from ${item.service.price.toFixed(0)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {stage !== "SERVICES" && selectedTime && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Selected Time</div>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(targetDate).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedTime}</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', marginBottom: '2rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total</div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>from ${currentCart.reduce((sum, item) => sum + item.service.price, 0).toFixed(0)}</div>
                            </div>

                            {stage === "SERVICES" && (
                                <button 
                                    onClick={nextPerson}
                                    style={{ 
                                        width: '100%',
                                        padding: '1.2rem', 
                                        background: '#000', 
                                        color: '#fff', 
                                        borderRadius: '50px', 
                                        border: 'none', 
                                        fontWeight: 800, 
                                        fontSize: '1rem', 
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    Continue
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
