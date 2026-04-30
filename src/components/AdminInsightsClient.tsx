
"use client";

import { useState } from "react";
import { getAIInsightAction } from "./actions";

export default function AdminInsightsClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    const res = await getAIInsightAction(query);
    if (res.success) {
      setReport(res.report);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
      
      {/* AI Command Bar */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '800px', position: 'relative' }}>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask TrimSpace AI about your marketplace..."
          style={{
            width: '100%',
            padding: '1.5rem 2.5rem',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#0f172a',
            background: '#ffffff',
            border: '2px solid #f1f5f9',
            borderRadius: '100px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
            outline: 'none',
            transition: 'all 0.3s ease'
          }}
          className="ai-input"
        />
        <button 
          type="submit"
          disabled={loading}
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#000000',
            color: '#ffffff',
            border: 'none',
            padding: '0.8rem 2rem',
            borderRadius: '100px',
            fontWeight: 800,
            cursor: 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? 'ANALYZING...' : 'ASK'}
        </button>
      </form>

      {/* Suggested Queries */}
      {!report && !loading && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            "Who are the top performing shops?",
            "Show me revenue trends",
            "Are there any active disputes?",
            "Platform risk report"
          ].map(q => (
            <button 
              key={q}
              onClick={() => { setQuery(q); }}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8e0',
                padding: '0.6rem 1.2rem',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { (e.target as any).style.background = '#000'; (e.target as any).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.target as any).style.background = '#f8fafc'; (e.target as any).style.color = '#64748b'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Report Area */}
      <div style={{ width: '100%', maxWidth: '900px', minHeight: '400px' }}>
        {loading && (
           <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', animation: 'pulse 1.5s infinite' }}>Intelligence Engine Running...</div>
              <p style={{ color: '#64748b', marginTop: '1rem' }}>Sourcing real-time data from your marketplace nodes.</p>
           </div>
        )}

        {!loading && report && (
          <div style={{ background: '#fff', padding: '3rem', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }} className="fade-in">
            <div style={{ marginBottom: '2.5rem' }}>
               <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>{report.title}</h2>
               <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', borderLeft: '4px solid #000', fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>
                 🤖 <span style={{ fontStyle: 'italic' }}>AI Insight:</span> {report.insight}
               </div>
            </div>

            {/* Render Data based on type */}
            {report.type === 'leaderboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {report.data.map((shop: any, idx: number) => (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#94a3b8' }}>#{idx + 1}</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#000' }}>{shop.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>${shop.revenue.toFixed(2)}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{shop.count} Transactions</div>
                      </div>
                   </div>
                ))}
              </div>
            )}

            {report.type === 'risk' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                 {report.data.map((stat: any, idx: number) => (
                    <div key={idx} style={{ padding: '2rem', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', textAlign: 'center' }}>
                       <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>{stat.label}</div>
                       <div style={{ fontSize: '2rem', fontWeight: 900, color: '#000' }}>{stat.value}</div>
                    </div>
                 ))}
              </div>
            )}

            {report.type === 'chart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 {report.data.map((item: any, idx: number) => (
                    <div key={idx}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                          <span>{item.name}</span>
                          <span>${item.value.toFixed(2)}</span>
                       </div>
                       <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${(item.value / Math.max(...report.data.map((d:any) => d.value))) * 100}%`, height: '100%', background: '#000' }} />
                       </div>
                    </div>
                 ))}
              </div>
            )}

            {report.type === 'text' && (
               <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: 500 }}>
                  Select one of the quick insights above or try asking about specific marketplace metrics.
               </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .ai-input:focus {
           border-color: #000 !important;
           box-shadow: 0 0 0 10px rgba(0,0,0,0.02) !important;
        }
        .fade-in {
           animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
           from { opacity: 0; transform: translateY(20px); }
           to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
