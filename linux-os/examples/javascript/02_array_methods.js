// map, filter, reduce, find, some, every, sort
const people = [
  { name: 'Ada', age: 36, lang: 'Analytical Engine' },
  { name: 'Grace', age: 85, lang: 'COBOL' },
  { name: 'Linus', age: 54, lang: 'C' },
  { name: 'Guido', age: 68, lang: 'Python' },
];

const names = people.map((p) => p.name);
const over50 = people.filter((p) => p.age > 50).map((p) => p.name);
const avgAge = people.reduce((sum, p) => sum + p.age, 0) / people.length;
const pythonista = people.find((p) => p.lang === 'Python');
const byAge = [...people].sort((a, b) => a.age - b.age).map((p) => `${p.name} (${p.age})`);

console.log('Names:', names.join(', '));
console.log('Over 50:', over50);
console.log('Average age:', avgAge.toFixed(1));
console.log('Python fan:', pythonista.name);
console.log('Youngest first:', byAge.join(' < '));
console.log('Everyone over 30?', people.every((p) => p.age > 30));
