'use client';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2.5 rounded-sm"
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '11px',
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', letterSpacing: '0.1em' }}>
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-bold text-white">
          {p.value}<span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> kg</span>
        </p>
      ))}
    </div>
  );
};

export default function ExerciseChart({ data }) {
  const [mode, setMode] = useState('maxWeight');

  const chartData = data.map((d) => ({
    ...d,
    date: format(new Date(d.date), 'MMM d'),
  }));

  const max = Math.max(...chartData.map((d) => d[mode]));
  const prIndex = chartData.findIndex((d) => d[mode] === max);

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex gap-1">
        {[
          { key: 'maxWeight', label: 'MAX WEIGHT' },
          { key: 'volume',    label: 'VOLUME' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`forge-btn forge-btn-ghost px-3 py-1.5 rounded-sm text-[10px] ${
              mode === key ? 'text-white border-white/20 bg-white/[0.06]' : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="1 0"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 10, fontFamily: 'SF Pro' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 10, fontFamily: 'SF Pro' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          {prIndex >= 0 && (
            <ReferenceLine
              x={chartData[prIndex]?.date}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="3 3"
            />
          )}
          <Line
            type="monotone"
            dataKey={mode}
            stroke="#ffffff"
            strokeWidth={1.5}
            dot={{ fill: '#080808', stroke: '#ffffff', strokeWidth: 1.5, r: 3 }}
            activeDot={{ fill: '#ffffff', r: 4, stroke: 'none' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
