// ASCII Mandelbrot
const chars = ' .:-=+*#%@';
for (let y = 0; y < 22; y++) {
  let line = '';
  for (let x = 0; x < 70; x++) {
    let zr = 0, zi = 0, n = 0;
    const cr = -2.2 + x * 0.045, ci = -1.1 + y * 0.1;
    while (zr * zr + zi * zi < 4 && n < 30) {
      const t = zr * zr - zi * zi + cr;
      zi = 2 * zr * zi + ci; zr = t; n++;
    }
    line += chars[Math.floor((n * (chars.length - 1)) / 30)];
  }
  console.log(line);
}
