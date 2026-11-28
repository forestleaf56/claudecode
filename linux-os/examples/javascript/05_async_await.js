// Promises and async/await
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function brewCoffee(name, seconds) {
  console.log(`Starting ${name}...`);
  await sleep(seconds * 100);
  console.log(`${name} is ready!`);
  return name;
}

async function main() {
  const order = await Promise.all([
    brewCoffee('Espresso', 2),
    brewCoffee('Latte', 4),
    brewCoffee('Americano', 3),
  ]);
  console.log('All done:', order.join(', '));
  const first = await Promise.race([sleep(300).then(() => 'slow'), sleep(100).then(() => 'fast')]);
  console.log('Race winner:', first);
}

main();
