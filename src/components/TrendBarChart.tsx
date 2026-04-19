"use client";

import { useState } from "react";

interface DataPoint {
  date: string;
  stripe: number;
  gift: number;
}

interface TrendBarChartProps {
  data: DataPoint[];
}

export default function TrendBarChart({ data }: TrendBarChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  const WIDTH = 800;
  const HEIGHT = 320; // Increased height for better label room
  const PAD_L = 50;
  const PAD_R = 20;
  const PAD_T = 50; // More room at top for totals
  const PAD_B = 60; // More room at bottom for dates

  const chartW = WIDTH - PAD_L - PAD_R;
  const chartH = HEIGHT - PAD_T - PAD_B;

  const maxVal = Math.max(
    ...data.map(d => d.stripe + d.gift),
    10 // Minimum scale
  );

  const barWidth = Math.max(6, (chartW / data.length) * 0.7);
  const gap = (chartW / data.length) * 0.3;

  const xFor = (i: number) => PAD_L + i * (barWidth + gap) + gap / 2;
  const yFor = (v: number) => PAD_T + chartH - (v / maxVal) * chartH;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '12px', height: '12px', background: '#D4AF37', borderRadius: '3px' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Digital (Stripe)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Gift Card</span>
        </div>
      </div>

      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
                <linearGradient id="barStripe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
                <linearGradient id="barGift" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                </linearGradient>
            </defs>

            {/* Y-Axis Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((p: number, i: number) => {
                const val = maxVal * p;
                const y = yFor(val);
                return (
                    <g key={i}>
                        <line x1={PAD_L} y1={y} x2={WIDTH - PAD_R} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                        <text x={PAD_L - 10} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.3)" fontWeight="600">
                            ${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0)}
                        </text>
                    </g>
                );
            })}

            {/* Bars Mapping */}
            {data.map((d: any, i: number) => {
                const x = xFor(i);
                const stripeHeight = (d.stripe / maxVal) * chartH;
                const giftHeight = (d.gift / maxVal) * chartH;
                const totalAmount = d.stripe + d.gift;
                const totalY = yFor(totalAmount);

                return (
                    <g key={i} 
                       onMouseEnter={() => setTooltip({ x: x + barWidth/2, y: totalY, point: d })}
                       onMouseLeave={() => setTooltip(null)}
                       style={{ cursor: 'pointer' }}>
                        
                        {/* Digital Segment (Bottom) */}
                        <rect 
                            x={x} 
                            y={yFor(d.stripe)} 
                            width={barWidth} 
                            height={stripeHeight} 
                            fill="url(#barStripe)" 
                            rx="4"
                        />
                        
                        {/* Gift Segment (Stacked Top) */}
                        <rect 
                            x={x} 
                            y={yFor(d.stripe + d.gift)} 
                            width={barWidth} 
                            height={giftHeight} 
                            fill="url(#barGift)" 
                            rx="4"
                        />

                        {/* Total Label on top of bar */}
                        {totalAmount > 0 && (
                            <g>
                                {/* Background "Halo" for maximum readability */}
                                <text 
                                    x={x + barWidth / 2} 
                                    y={totalY - 12} 
                                    textAnchor="middle" 
                                    fontSize="12" 
                                    fontWeight="900"
                                    fill="black"
                                    stroke="black"
                                    strokeWidth="3"
                                    strokeLinejoin="round"
                                >
                                    ${totalAmount.toFixed(0)}
                                </text>
                                <text 
                                    x={x + barWidth / 2} 
                                    y={totalY - 12} 
                                    textAnchor="middle" 
                                    fontSize="12" 
                                    fontWeight="900"
                                    fill="#D4AF37"
                                >
                                    ${totalAmount.toFixed(0)}
                                </text>
                            </g>
                        )}

                        {/* X-Axis Labels (Date/Week) */}
                        {((data.length < 15) || (i % Math.floor(data.length / 10) === 0)) && (
                            <text 
                                x={x + barWidth / 2} 
                                y={HEIGHT - 20} 
                                textAnchor={data.length > 15 ? "start" : "middle"} 
                                fontSize="12" 
                                fill="#D4AF37"
                                fontWeight="800"
                                transform={data.length > 15 ? `rotate(35, ${x + barWidth / 2}, ${HEIGHT - 20})` : ""}
                                style={{ letterSpacing: '0.5px' }}
                            >
                                {d.date}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>

        {/* Floating Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            top: (tooltip.y / HEIGHT) * 100 + '%',
            left: (tooltip.x / WIDTH) * 100 + '%',
            transform: 'translate(-50%, -120%)',
            background: '#111',
            border: '1px solid var(--primary)',
            padding: '0.8rem',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            zIndex: 100,
            pointerEvents: 'none',
            minWidth: '140px'
          }}>
            <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>{tooltip.point.date}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#D4AF37', fontSize: '0.8rem' }}>Digital</span>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>${tooltip.point.stripe.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Gift</span>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>${tooltip.point.gift.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.3rem', paddingTop: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Total</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.85rem' }}>${(tooltip.point.stripe + tooltip.point.gift).toFixed(2)}</span>
                </div>
            </div>
          </div>
        )}
      </div>

      {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.4 }}>No data for this period.</div>
      )}
    </div>
  );
}
