// Union types and exhaustive switch
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'triangle'; base: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.radius ** 2;
    case 'square': return s.side ** 2;
    case 'triangle': return (s.base * s.height) / 2;
  }
}

const shapes: Shape[] = [
  { kind: 'circle', radius: 1 },
  { kind: 'square', side: 3 },
  { kind: 'triangle', base: 4, height: 5 },
];
for (const s of shapes) console.log(s.kind.padEnd(9), area(s).toFixed(2));
