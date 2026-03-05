type SparklineProps = {
  values: number[];
  stroke: string;
};

const WIDTH = 240;
const HEIGHT = 80;
const PADDING = 8;

export const Sparkline = ({ values, stroke }: SparklineProps) => {
  if (values.length < 2) {
    return (
      <svg className="sparkline" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="rgba(255,255,255,0.24)" strokeWidth="1.5" />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const path = values
    .map((value, index) => {
      const x = PADDING + (index / (values.length - 1)) * (WIDTH - PADDING * 2);
      const y = HEIGHT - PADDING - ((value - min) / span) * (HEIGHT - PADDING * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <path className="sparkline-area" d={`${path} L ${WIDTH - PADDING},${HEIGHT - PADDING} L ${PADDING},${HEIGHT - PADDING} Z`} />
      <path d={path} stroke={stroke} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
};
