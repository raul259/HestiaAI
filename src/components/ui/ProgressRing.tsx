interface Props {
  pct: number;
  label: string;
  sub: string;
  size?: number;
  stroke?: number;
  color?: string;
}

export function ProgressRing({
  pct,
  label,
  sub,
  size = 80,
  stroke = 8,
  color = "#88EBC0",
}: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  const cx = size / 2;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke="#E8F5F0"
            strokeWidth={stroke}
          />
          {/* Fill */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-outfit font-bold text-deep-forest"
          style={{ fontSize: size * 0.21 }}
        >
          {pct}%
        </span>
      </div>
      <div>
        <p className="font-outfit font-semibold text-sm text-deep-forest leading-tight">{label}</p>
        <p className="font-inter text-xs text-gray-400 mt-0.5 leading-snug">{sub}</p>
      </div>
    </div>
  );
}
