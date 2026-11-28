// Map, Set and a tiny event emitter
class Emitter {
  #handlers = new Map();
  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event).add(fn);
    return () => this.#handlers.get(event).delete(fn);
  }
  emit(event, ...args) { this.#handlers.get(event)?.forEach((fn) => fn(...args)); }
}

const chat = new Emitter();
const off = chat.on('message', (who, text) => console.log(`${who}: ${text}`));
chat.on('message', (who) => console.log(`  (notification from ${who})`));
chat.emit('message', 'Ada', 'Hello!');
off();
chat.emit('message', 'Grace', 'Anyone there?');

const visitors = new Set(['ada', 'grace', 'ada', 'linus', 'grace']);
console.log('Unique visitors:', [...visitors]);
