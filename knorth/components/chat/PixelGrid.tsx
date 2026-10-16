// Renders pixel art from string rows. Each character is a palette key ("." is empty); runs of the
// same colour on a row merge into one <rect>, so a 20x15 sprite stays a few dozen elements.
export type Palette = Record<string, string>;

export default function PixelGrid({ rows, palette, x = 0, y = 0, className }: {
  rows: string[];
  palette: Palette;
  x?: number;
  y?: number;
  className?: string;
}) {
  const rects: React.ReactNode[] = [];
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const key = row[c];
      let end = c + 1;
      while (end < row.length && row[end] === key) end++;
      if (key !== "." && palette[key]) {
        rects.push(<rect key={`${r}-${c}`} x={x + c} y={y + r} width={end - c} height={1} fill={palette[key]} />);
      }
      c = end;
    }
  });
  return <g className={className}>{rects}</g>;
}
