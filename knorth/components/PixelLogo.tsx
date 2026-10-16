// TIFFANY as a pixel wordmark, built from the same blocky grid as Kniah the chat cat. A darker copy one
// pixel down-right gives it depth; on hover a ripple runs left to right, lifting each column in turn.
const GLYPHS: Record<string, string[]> = {
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
};

const WORD = "TIFFANY";
const GAP = 1;

type Cell = { x: number; y: number };
const CELLS: Cell[] = [];
let width = 0;
for (const ch of WORD) {
  const g = GLYPHS[ch];
  g.forEach((row, y) => [...row].forEach((c, x) => c === "#" && CELLS.push({ x: width + x, y })));
  width += g[0].length + GAP;
}
width -= GAP;
const HEIGHT = 7;

export default function PixelLogo({ cell = 3 }: { cell?: number }) {
  return (
    <svg
      viewBox={`0 0 ${width + 1} ${HEIGHT + 1}`}
      width={(width + 1) * cell}
      height={(HEIGHT + 1) * cell}
      shapeRendering="crispEdges"
      aria-hidden
      className="pixel-logo block"
    >
      {CELLS.map(({ x, y }) => (
        <rect key={`s${x}-${y}`} x={x + 1} y={y + 1} width={1} height={1} className="px-shadow" style={{ animationDelay: `${x * 22}ms` }} />
      ))}
      {CELLS.map(({ x, y }) => (
        <rect key={`p${x}-${y}`} x={x} y={y} width={1} height={1} className="px-cell" style={{ animationDelay: `${x * 22}ms` }} />
      ))}
    </svg>
  );
}
