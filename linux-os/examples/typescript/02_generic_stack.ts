// A generic Stack<T> class
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  get size(): number { return this.items.length; }
}

// Check balanced brackets with a stack
function balanced(text: string): boolean {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack = new Stack<string>();
  for (const ch of text) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (ch in pairs && stack.pop() !== pairs[ch]) return false;
  }
  return stack.size === 0;
}

for (const s of ['(a + b) * [c]', '{[()()]}', '(]', '((x)']) {
  console.log(s.padEnd(14), balanced(s) ? 'balanced' : 'NOT balanced');
}
