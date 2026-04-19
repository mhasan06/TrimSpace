"use client";

import { useState } from "react";

interface DataPoint {
  date: string;
  stripe: number;
  gift: number;
}

interface RevenueChartProps {
  data: DataPoint[];
}

function buildSVGPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
    const cp1y = points[i - 1].y;
    const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
    const cp2y = points[i].y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);
  const [activeLines, setActiveLines] = useState({ stripe: true, gift: true });

  const WIDTH = 800;
  const HEIGHT = 220;
  const PAD_L = 52;
  const PAD_R = 20;
  const PAD_T = 16;
  const PAD_B = 36;

  const chartW = WIDTH - PAD_L - PAD_R;
  const chartH = HEIGHT - PAD_T - PAD_B;

  const maxVal = Math.max(
    ...data.map(d => d.stripe + d.gift),
    1
  );

  const xFor = (i: number) => PAD_L + (i / Math.max(data.length - 1, 1)) * chartW;
  const yFor = (v: number) => PAD_T + chartH - (v / maxVal) * chartH;

  const stripePoints = data.map((d: any, i: number) => ({ x: xFor(i), y: yFor(d.stripe) }));
  const giftPoints   = data.map((d: any, i: number) => ({ x: xFor(i), y: yFor(d.gift) }));
  const totalPoints  = data.map((d: any, i: number) => ({ x: xFor(i), y: yFor(d.stripe + d.gift) }));

  const stripePath = buildSVGPath(stripePoints);
  const giftPath   = buildSVGPath(giftPoints);
  const totalPath  = buildSVGPath(totalPoints);

  // Area fill path (close back to baseline)
  const areaPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    const line = buildSVGPath(pts);
    return `${line} L ${pts[pts.length - 1].x} ${PAD_T + chartH} L ${pts[0].x} ${PAD_T + chartH} Z`;
  };

  const yTicks = 4;
  const xTickEvery = Math.max(1, Math.floor(data.length / 7));

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { key: 'stripe', color: '#D4AF37', label: 'Digital (Stripe)' },
          { key: 'gift',   color: '#10b981', label: 'Gift Credit' },
        ].map(({ key, color, label }) => (
          <button
            key={key}
            onClick={() => setActiveLines(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              opacity: activeLines[key as keyof typeof activeLines] ? 1 : 0.35,
              transition: 'opacity 0.2s ease'
            }}
          >
            <span style={{ width: '24px', height: '3px', display: 'block', background: color, borderRadius: '2px' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="stripeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="giftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const val = (maxVal / yTicks) * i;
            const y   = yFor(val);
            return (
              <g key={i}>
                <line x1={PAD_L} y1={y} x2={WIDTH - PAD_R} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)">
                  ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X Axis Ticks */}
          {data.map((d, i) => {
            if (i % xTickEvery !== 0) return null;
            const x = xFor(i);
            const label = d.date.slice(5); // MM-DD
            return (
              <text key={i} x={x} y={HEIGHT - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">
                {label}
              </text>
            );
          })}

          {/* Area fills */}
          {activeLines.stripe && (
            <path d={areaPath(stripePoints)} fill="url(#stripeGrad)" />
          )}
          {activeLines.gift && (
            <path d={areaPath(giftPoints)} fill="url(#giftGrad)" />
          )}

          {/* Lines */}
          {activeLines.stripe && (
            <path d={stripePath} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="2000" to="0" dur="1.2s" fill="freeze" />
            </path>
          )}
          {activeLines.gift && (
            <path d={giftPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="2000" to="0" dur="1.4s" fill="freeze" />
            </path>
          )}

          {/* Hover capture zones */}
          {data.map((d, i) => {
            const x = xFor(i);
            const cy = yFor(d.stripe + d.gift);
            return (
              <g key={i}
                onMouseEnter={(e) => setTooltip({ x, y: cy, point: d })}
                style={{ cursor: 'crosshair' }}
              >
                <rect x={x - 14} y={PAD_T} width={28} height={chartH} fill="transparent" />
                {tooltip?.point === d && (
                  <>
                    <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3" />
                    {activeLines.stripe && <circle cx={x} cy={yFor(d.stripe)} r="4" fill="#D4AF37" />}
                    {activeLines.gift && <circle cx={x} cy={yFor(d.gift)} r="4" fill="#10b981" />}
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            top: Math.max(0, (tooltip.y / HEIGHT) * 100) + '%',
            left: Math.min(70, (tooltip.x / WIDTH) * 100) + '%',
            transform: 'translate(12px, -50%)',
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '160px'
          }}>
            <p style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tooltip.point.date}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#D4AF37' }}>Digital</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>${tooltip.point.stripe.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#10b981' }}>Gift</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>${tooltip.point.gift.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.3rem', paddingTop: '0.3rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ fontSize: '0.78rem', opacity: 0.5 }}>Total</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)' }}>${(tooltip.point.stripe + tooltip.point.gift).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {data.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.4, fontSize: '0.9rem' }}>
          No revenue data for the selected period.
        </div>
      )}
    </div>
  );
}
