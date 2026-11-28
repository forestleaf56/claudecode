// JSON parsing, destructuring, spread and optional chaining
const json = `{
  "city": "Reykjavik",
  "coords": { "lat": 64.14, "lon": -21.94 },
  "forecast": [ { "day": "Mon", "temp": 3 }, { "day": "Tue", "temp": 5 }, { "day": "Wed", "temp": -1 } ]
}`;

const data = JSON.parse(json);
const { city, coords: { lat, lon }, forecast } = data;
console.log(`${city} is at ${lat}, ${lon}`);

const [first, ...others] = forecast;
console.log('First day:', first.day, first.temp + '°C');
console.log('Coldest:', others.reduce((a, b) => (a.temp < b.temp ? a : b)).day);
console.log('Wind:', data.wind?.speed ?? 'unknown');

const updated = { ...data, city: 'Akureyri', forecast: [...forecast, { day: 'Thu', temp: 2 }] };
console.log(JSON.stringify(updated.forecast.map((f) => f.temp)));
