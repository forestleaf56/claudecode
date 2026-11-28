// FizzBuzz with a one-liner per number
for (let i = 1; i <= 30; i++) {
  console.log((i % 3 ? '' : 'Fizz') + (i % 5 ? '' : 'Buzz') || i);
}
