import { useMemo } from "react";

interface SensoryRadarChartProps {
  values: { label: string; value: number }[];
  max?: number;
  size?: number;
}

export function SensoryRadarChart({ values, max = 5, size = 200 }: SensoryRadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) - 24;
  const angleStep = (2 * Math.PI) / values.length;

  const points = useMemo(() =>
    values.map((v, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (v.value / max) * radius;
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    }),
    [values, max, radius, center, angleStep]
  );

  const gridLevels = [1, 2, 3, 4, 5];

  const labelPoints = useMemo(() =>
    values.map((v, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const lr = radius + 16;
      return {
        x: center + lr * Math.cos(angle),
        y: center + lr * Math.sin(angle),
        label: v.label,
        value: v.value,
      };
    }),
    [values, radius, center, angleStep]
  );

  const polygon = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[200px] mx-auto"
      aria-label="Sensory profile radar chart"
      role="img"
    >
      {/* Grid rings */}
      {gridLevels.map(level => {
        const r = (level / max) * radius;
        const ringPoints = values.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={ringPoints}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={level === max ? 1.5 : 0.5}
            opacity={level === max ? 0.6 : 0.3}
          />
        );
      })}

      {/* Axis lines */}
      {values.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            opacity={0.4}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="hsl(var(--primary))"
        />
      ))}

      {/* Labels */}
      {labelPoints.map((lp, i) => (
        <text
          key={i}
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground"
          fontSize={9}
          fontWeight={lp.value >= 4 ? 600 : 400}
        >
          {lp.label}
        </text>
      ))}
    </svg>
  );
}
