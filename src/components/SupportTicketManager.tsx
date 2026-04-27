"use client";

import { useState } from "react";
import { createSupportTicket, replyToTicket } from "@/app/dashboard/support/actions";

export default function SupportTicketManager({ initialTickets, tenantId, role }: { initialTickets: any[], tenantId: string, role: "MERCHANT" | "ADMIN" }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newTicket, setNewTicket] = useState({ subject: '', category: 'GENERAL', content: '' });
  const [reply, setReply] = useState("");

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await createSupportTicket(newTicket.subject, newTicket.category, newTicket.content, tenantId);
      setTickets([ticket as any, ...tickets]);
      setIsNewTicketOpen(false);
      setNewTicket({ subject: '', category: 'GENERAL', content: '' });
    } catch (err) {
      alert("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !reply.trim()) return;
    setLoading(true);
    try {
      const msg = await replyToTicket(selectedTicketId, reply, role);
      setTickets(tickets.map(t => t.id === selectedTicketId ? { ...t, messages: [...t.messages, msg], updatedAt: new Date().toISOString() } : t));
      setReply("");
    } catch (err) {
      alert("Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', height: '70vh', minHeight: '600px' }}>
      {/* Sidebar: Ticket List */}
      <div style={{ background: '#fff', borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
        <button 
          onClick={() => setIsNewTicketOpen(true)}
          style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800, marginBottom: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          + New Support Ticket
        </button>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {tickets.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', marginTop: '2rem' }}>No support history found.</p>
          ) : (
            tickets.map(t => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicketId(t.id)}
                style={{ 
                  padding: '1.2rem', 
                  borderRadius: '16px', 
                  cursor: 'pointer', 
                  border: '1px solid',
                  borderColor: selectedTicketId === t.id ? '#6366f1' : '#f1f5f9',
                  background: selectedTicketId === t.id ? '#f5f7ff' : '#fff',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, background: t.status === 'OPEN' ? '#10b981' : '#64748b', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{t.status}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>{new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
                {role === 'ADMIN' && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', marginBottom: '0.2rem' }}>🏪 {t.tenant?.name || 'Unknown Shop'}</div>
                )}
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t.category}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Chat View */}
      <div style={{ background: '#fff', borderRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {isNewTicketOpen ? (
          <div style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem' }}>Create Ticket</h2>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Subject</label>
                <input required value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} placeholder="e.g. Help with payouts" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Category</label>
                <select value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }}>
                  <option value="GENERAL">General Inquiry</option>
                  <option value="BILLING">Billing / Payouts</option>
                  <option value="TECHNICAL">Technical Issue</option>
                  <option value="FEATURE">Feature Request</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Message</label>
                <textarea required rows={5} value={newTicket.content} onChange={e => setNewTicket({...newTicket, content: e.target.value})} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }} placeholder="Describe your issue..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>{loading ? 'Submitting...' : 'Submit Ticket'}</button>
                <button type="button" onClick={() => setIsNewTicketOpen(false)} style={{ padding: '1rem 2rem', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        ) : selectedTicket ? (
          <>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{selectedTicket.subject}</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>#{selectedTicket.id.slice(-6).toUpperCase()}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{selectedTicket.category}</p>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fcfcfc' }}>
              {selectedTicket.messages.map((m: any) => (
                <div key={m.id} style={{ alignSelf: m.senderRole === role ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ 
                    padding: '1.2rem', 
                    borderRadius: m.senderRole === role ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: m.senderRole === role ? '#6366f1' : '#fff',
                    color: m.senderRole === role ? '#fff' : '#0f172a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    border: m.senderRole === role ? 'none' : '1px solid #f1f5f9'
                  }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>{m.content}</p>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.4rem', textAlign: m.senderRole === role ? 'right' : 'left', fontWeight: 700 }}>
                    {m.senderRole === 'ADMIN' ? 'Platform Team' : 'You'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleReply} style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', background: '#fff', display: 'flex', gap: '1rem' }}>
              <input required value={reply} onChange={e => setReply(e.target.value)} style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }} placeholder="Type your reply..." />
              <button disabled={loading} type="submit" style={{ padding: '0 2rem', borderRadius: '14px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                {loading ? '...' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
             <span style={{ fontSize: '3rem' }}>📩</span>
             <p style={{ fontWeight: 800, marginTop: '1rem' }}>Select a ticket to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
