"use client";

import * as React from "react";

interface ChartDataItem {
  name: string;
  value: number;
}

interface ChartProps {
  data: ChartDataItem[];
  color?: string;
  height?: number;
}

// 1. Line Chart Component
export function LineChart({ data, color = "hsl(var(--primary))", height = 200 }: ChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const width = 500;
  const padding = 40;

  const points = data.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1 || 1);
    const y = height - padding - (d.value * (height - padding * 2)) / maxVal;
    return { x, y, label: d.name, val: d.value };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <div className="w-full space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = padding + r * (height - padding * 2);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Line path */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i} className="group/point cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="hsl(var(--background))"
              stroke={color}
              strokeWidth="2.5"
              className="transition-all duration-200 group-hover/point:r-6"
            />
            {/* Tooltip trigger hover */}
            <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect
                x={p.x - 30}
                y={p.y - 32}
                width="60"
                height="22"
                rx="4"
                fill="hsl(var(--popover))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              <text x={p.x} y={p.y - 17} textAnchor="middle" fontSize="10" fill="hsl(var(--popover-foreground))" fontWeight="600">
                {p.val}
              </text>
            </g>
          </g>
        ))}

        {/* X Axis Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 12}
            textAnchor="middle"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// 2. Bar Chart Component
export function BarChart({ data, color = "hsl(var(--primary))", height = 200 }: ChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const width = 500;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const barWidth = (chartWidth / data.length) * 0.65;
  const gap = (chartWidth / data.length) * 0.35;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        {/* Horizontal grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = padding + r * (height - padding * 2);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Bars */}
        {data.map((d, index) => {
          const x = padding + index * (barWidth + gap) + gap / 2;
          const barHeight = (d.value * (height - padding * 2)) / maxVal;
          const y = height - padding - barHeight;

          return (
            <g key={index} className="group/bar cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={color}
                className="opacity-85 hover:opacity-100 transition-opacity duration-150"
              />
              {/* Tooltip */}
              <g className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect
                  x={x + barWidth / 2 - 25}
                  y={y - 28}
                  width="50"
                  height="20"
                  rx="4"
                  fill="hsl(var(--popover))"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill="hsl(var(--popover-foreground))"
                  fontWeight="600"
                >
                  {d.value}
                </text>
              </g>
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={height - 12}
                textAnchor="middle"
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 3. Donut (Pie) Chart Component
export function PieChart({ data }: { data: ChartDataItem[]; height?: number }) {
  if (!data.length) return null;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const center = 100;

  const slices = data.map((d, index) => {
    const percentage = d.value / total;
    const strokeLength = percentage * circumference;
    const previousSum = data
      .slice(0, index)
      .reduce((sum, prev) => sum + (prev.value / total) * circumference, 0);
    const strokeOffset = circumference - previousSum;
    return {
      strokeLength,
      strokeOffset,
      name: d.name,
      value: d.value,
    };
  });

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--amber-500, 38, 92%, 50%))",
    "hsl(var(--emerald-500, 142, 72%, 29%))",
    "hsl(var(--destructive))",
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
        {slices.map((slice, i) => {
          const sliceColor = colors[i % colors.length];

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={sliceColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={slice.strokeOffset}
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-all duration-300 hover:scale-105 origin-center cursor-pointer"
            />
          );
        })}
        {/* Center label */}
        <text x={center} y={center - 2} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontWeight="500">
          Total Escrows
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fontSize="14" fill="hsl(var(--foreground))" fontWeight="800">
          {total > 1000 ? `$${(total / 1000).toFixed(0)}k` : total}
        </text>
      </svg>

      {/* Legends column */}
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center space-x-2 text-xs">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-muted-foreground font-medium">{d.name}:</span>
            <span className="font-bold text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Area Chart Component
export function AreaChart({ data, color = "hsl(var(--primary))", height = 200 }: ChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const width = 500;
  const padding = 40;

  const points = data.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1 || 1);
    const y = height - padding - (d.value * (height - padding * 2)) / maxVal;
    return { x, y, label: d.name, val: d.value };
  });

  const pathLine = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Closed path for fill area
  const pathFill = `${pathLine} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = padding + r * (height - padding * 2);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Fill area */}
        <path d={pathFill} fill="url(#areaGrad)" />

        {/* Border line */}
        <path d={pathLine} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />

        {/* Circles */}
        {points.map((p, i) => (
          <g key={i} className="group/point cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="hsl(var(--background))"
              stroke={color}
              strokeWidth="2.5"
            />
            {/* Tooltip */}
            <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect
                x={p.x - 25}
                y={p.y - 28}
                width="50"
                height="20"
                rx="4"
                fill="hsl(var(--popover))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="9" fill="hsl(var(--popover-foreground))" fontWeight="600">
                {p.val}
              </text>
            </g>
          </g>
        ))}

        {/* Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 12}
            textAnchor="middle"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
