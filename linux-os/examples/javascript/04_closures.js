// Closures keep private state
function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const a = makeCounter();
const b = makeCounter(100);
a.increment(); a.increment(); a.increment();
b.decrement();
console.log('a =', a.value(), ' b =', b.value());

// Memoization with a closure
function memo(fn) {
  const cache = new Map();
  return (n) => (cache.has(n) ? cache.get(n) : (cache.set(n, fn(n)), cache.get(n)));
}
const slowSquare = (n) => { for (let i = 0; i < 1e6; i++); return n * n; };
const fastSquare = memo(slowSquare);
console.log(fastSquare(12), fastSquare(12));
