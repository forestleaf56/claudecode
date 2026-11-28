// Generator functions and recursion: all permutations
function* permutations(items) {
  if (items.length <= 1) { yield items; return; }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) yield [items[i], ...p];
  }
}

let n = 0;
for (const p of permutations(['☁️', '🌧️', '⚡', '☀️'])) {
  n++;
  if (n <= 6) console.log(p.join(' '));
}
console.log(`...${n} permutations in total`);
